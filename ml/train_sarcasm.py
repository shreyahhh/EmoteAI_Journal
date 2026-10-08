"""Fine-tune a binary sarcasm / irony detector.

    python train_sarcasm.py --out sarcasm_model

Training mix (text only; journal entries have no parent comment to condition on):
  * iSarcasmEval (self-labelled by the authors, first-person, closest to a journal)
    - upweighted x2
  * tweet_eval irony (SemEval-2018 Task 3)
  * a balanced Reddit subsample (marcbishara/sarcasm-on-reddit) for volume

The deployed threshold is chosen to favour PRECISION (F0.5) on the in-domain
validation sets: a false "sarcastic" flag flips the polarity of someone's genuine
feelings, which is worse than missing a sarcastic line.
"""
import argparse
import json
import shutil
from pathlib import Path

import numpy as np
import torch
from datasets import Dataset, concatenate_datasets, load_dataset
from sklearn.metrics import (
    accuracy_score, average_precision_score, f1_score, fbeta_score,
    precision_score, recall_score, roc_auc_score,
)
from transformers import (
    AutoModelForSequenceClassification, AutoTokenizer, DataCollatorWithPadding,
    Trainer, TrainingArguments,
)


def softmax_pos(logits):
    z = logits - logits.max(axis=1, keepdims=True)
    e = np.exp(z)
    return (e / e.sum(axis=1, keepdims=True))[:, 1]


def tag(ds, source, text_col, label_col):
    """Normalise a dataset to {text, label, source}."""
    return Dataset.from_dict({
        "text": [str(t) for t in ds[text_col]],
        "label": [int(l) for l in ds[label_col]],
        "source": [source] * len(ds),
    })


def load_sources(reddit_n, max_train):
    isar = load_dataset("viethq1906/isarcasm_2022_taskA_En")
    irony = load_dataset("cardiffnlp/tweet_eval", "irony")
    reddit_tr = load_dataset("marcbishara/sarcasm-on-reddit", split="sft_train").shuffle(seed=42).select(range(reddit_n))
    reddit_ho = load_dataset("marcbishara/sarcasm-on-reddit", split="holdout").shuffle(seed=42).select(range(min(4000, reddit_n)))

    parts = {
        "isarcasm": {s: tag(isar[s], "isarcasm", "sentence", "sentiment") for s in ("train", "validation", "test")},
        "irony": {s: tag(irony[s], "irony", "text", "label") for s in ("train", "validation", "test")},
        "reddit": {"train": tag(reddit_tr, "reddit", "comment", "label"),
                   "validation": tag(reddit_ho.select(range(len(reddit_ho) // 2)), "reddit", "comment", "label"),
                   "test": tag(reddit_ho.select(range(len(reddit_ho) // 2, len(reddit_ho))), "reddit", "comment", "label")},
    }
    train = concatenate_datasets([parts["isarcasm"]["train"]] * 2 + [parts["irony"]["train"], parts["reddit"]["train"]]).shuffle(seed=42)
    if max_train:
        train = train.select(range(max_train))
    return train, parts


def tune_threshold(p, y):
    best_t, best = 0.5, -1.0
    for t in np.arange(0.1, 0.96, 0.01):
        f = fbeta_score(y, p >= t, beta=0.5, zero_division=0)
        if f > best:
            best_t, best = float(t), float(f)
    return best_t, best


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="sarcasm_model")
    ap.add_argument("--base", default="roberta-base")
    ap.add_argument("--epochs", type=float, default=3)
    ap.add_argument("--max-len", type=int, default=96)
    ap.add_argument("--batch-size", type=int, default=32)
    ap.add_argument("--lr", type=float, default=0)
    ap.add_argument("--reddit-n", type=int, default=30000)
    ap.add_argument("--max-train", type=int, default=0, help="subsample for a smoke test")
    args = ap.parse_args()
    if not args.lr:
        args.lr = 1e-5 if "large" in args.base else 2e-5

    train, parts = load_sources(args.reddit_n, args.max_train)
    tok = AutoTokenizer.from_pretrained(args.base)

    def prep(b):
        return tok(b["text"], truncation=True, max_length=args.max_len)

    def encode(ds):
        return ds.map(prep, batched=True, remove_columns=["text", "source"])

    # Model selection uses the in-domain sets only (Reddit is plentiful but off-domain).
    val_small = concatenate_datasets([parts["isarcasm"]["validation"], parts["irony"]["validation"]])
    model = AutoModelForSequenceClassification.from_pretrained(
        args.base, num_labels=2, id2label={0: "literal", 1: "sarcastic"}, label2id={"literal": 0, "sarcastic": 1})

    def compute_metrics(pred):
        p = softmax_pos(pred.predictions)
        return {"f1_sarcastic": f1_score(pred.label_ids, p >= 0.5, zero_division=0)}

    targs = TrainingArguments(
        output_dir=str(Path(args.out) / "checkpoints"),
        num_train_epochs=args.epochs, per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=64, learning_rate=args.lr, weight_decay=0.01, warmup_steps=0.06,
        eval_strategy="epoch", save_strategy="epoch", save_total_limit=1, load_best_model_at_end=True,
        metric_for_best_model="f1_sarcastic", logging_steps=100, report_to="none", seed=42,
        use_cpu=not torch.cuda.is_available(), fp16=torch.cuda.is_available(),
        dataloader_num_workers=2 if torch.cuda.is_available() else 0,
    )
    trainer = Trainer(model=model, args=targs, train_dataset=encode(train), eval_dataset=encode(val_small),
                      data_collator=DataCollatorWithPadding(tok), compute_metrics=compute_metrics)
    trainer.train()

    val = trainer.predict(encode(val_small))
    threshold, val_f05 = tune_threshold(softmax_pos(val.predictions), val.label_ids)

    # Per-source test report (the iSarcasmEval number is the honest one for journal-like text).
    report = {"base_model": args.base, "threshold": threshold, "val_f0.5": val_f05, "test": {}}
    for name, splits in parts.items():
        t = splits["test"]
        out = trainer.predict(encode(t))
        p, y = softmax_pos(out.predictions), out.label_ids
        pred = p >= threshold
        report["test"][name] = {
            "n": len(y), "sarcastic_rate": float(y.mean()),
            "accuracy": float(accuracy_score(y, pred)),
            "precision": float(precision_score(y, pred, zero_division=0)),
            "recall": float(recall_score(y, pred, zero_division=0)),
            "f1_sarcastic": float(f1_score(y, pred, zero_division=0)),
            "auroc": float(roc_auc_score(y, p)), "auprc": float(average_precision_score(y, p)),
        }

    out_dir = Path(args.out)
    trainer.save_model(out_dir)
    tok.save_pretrained(out_dir)
    (out_dir / "thresholds.json").write_text(json.dumps({"threshold": threshold}, indent=2))
    (out_dir / "metrics.json").write_text(json.dumps(report, indent=2))
    shutil.rmtree(out_dir / "checkpoints", ignore_errors=True)  # optimizer state, not needed for inference
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
