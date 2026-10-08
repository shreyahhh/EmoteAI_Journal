"""Fine-tune DistilRoBERTa on GoEmotions (multi-label, 28 classes).

    python train.py                      # defaults: 2 epochs, max_len 64
    python train.py --epochs 3 --out model

Outputs to --out: the HF model + tokenizer, thresholds.json (tuned on the
validation split) and metrics.json (test-split evaluation).
"""
import argparse
import json
import shutil
from pathlib import Path

import numpy as np
import torch
from datasets import Sequence, Value, load_dataset
from sklearn.metrics import f1_score, precision_score, recall_score
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    DataCollatorWithPadding,
    Trainer,
    TrainingArguments,
)

from emotion_config import LABELS



def multi_hot(example):
    vec = np.zeros(len(LABELS), dtype=np.float32)
    vec[example["labels"]] = 1.0
    example["labels"] = vec
    return example


def sigmoid(x):
    return 1 / (1 + np.exp(-x))


GRID = np.arange(0.05, 0.80, 0.025)


def tune_threshold(probs, y):
    """Global decision threshold maximising macro-F1 on the validation split."""
    best_t, best_f1 = 0.5, -1.0
    for t in GRID:
        f1 = f1_score(y, probs >= t, average="macro", zero_division=0)
        if f1 > best_f1:
            best_t, best_f1 = float(t), float(f1)
    return best_t, best_f1


def tune_per_class(probs, y, fallback, min_pos=20):
    """One threshold per emotion. Rare classes (fewer than `min_pos` validation
    positives) keep the global threshold so they don't overfit to a handful of
    examples."""
    out = []
    for j in range(y.shape[1]):
        if y[:, j].sum() < min_pos:
            out.append(fallback)
            continue
        scores = [f1_score(y[:, j], probs[:, j] >= t, zero_division=0) for t in GRID]
        out.append(float(GRID[int(np.argmax(scores))]))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="model")
    ap.add_argument("--base", default="roberta-base",
                    help="roberta-base (default), roberta-large (GPU), or distilroberta-base (fast CPU)")
    ap.add_argument("--epochs", type=float, default=4)
    ap.add_argument("--max-len", type=int, default=64)
    ap.add_argument("--batch-size", type=int, default=32)
    ap.add_argument("--lr", type=float, default=0, help="default: 3e-5 base, 1e-5 large")
    ap.add_argument("--max-train", type=int, default=0, help="subsample for a quick smoke test")
    args = ap.parse_args()
    if not args.lr:
        args.lr = 1e-5 if "large" in args.base else 3e-5

    ds = load_dataset("google-research-datasets/go_emotions", "simplified")
    if args.max_train:
        ds["train"] = ds["train"].select(range(args.max_train))

    tok = AutoTokenizer.from_pretrained(args.base)

    def prep(batch):
        return tok(batch["text"], truncation=True, max_length=args.max_len)

    ds = ds.map(multi_hot).map(prep, batched=True, remove_columns=["text", "id"])
    # map() infers int64 for the multi-hot vectors; BCE needs float32 targets.
    ds = ds.cast_column("labels", Sequence(Value("float32")))

    model = AutoModelForSequenceClassification.from_pretrained(
        args.base,
        num_labels=len(LABELS),
        problem_type="multi_label_classification",
        id2label=dict(enumerate(LABELS)),
        label2id={l: i for i, l in enumerate(LABELS)},
    )

    def compute_metrics(pred):
        probs = sigmoid(pred.predictions)
        return {"macro_f1@0.3": f1_score(pred.label_ids, probs >= 0.3, average="macro", zero_division=0)}

    targs = TrainingArguments(
        output_dir=str(Path(args.out) / "checkpoints"),
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=64,
        learning_rate=args.lr,
        weight_decay=0.01,
        warmup_steps=0.06,  # fraction of total steps (transformers >= 5)
        eval_strategy="epoch",
        save_strategy="epoch",
        save_total_limit=1,
        load_best_model_at_end=True,
        metric_for_best_model="macro_f1@0.3",
        logging_steps=100,
        report_to="none",
        use_cpu=not torch.cuda.is_available(),
        fp16=torch.cuda.is_available(),
        dataloader_num_workers=2 if torch.cuda.is_available() else 0,
        seed=42,
    )
    trainer = Trainer(
        model=model,
        args=targs,
        train_dataset=ds["train"],
        eval_dataset=ds["validation"],
        data_collator=DataCollatorWithPadding(tok),
        compute_metrics=compute_metrics,
    )
    trainer.train()

    # Tune the threshold on validation, report on the untouched test split.
    val = trainer.predict(ds["validation"])
    val_probs = sigmoid(val.predictions)
    threshold, val_f1 = tune_threshold(val_probs, val.label_ids)
    per_class = tune_per_class(val_probs, val.label_ids, threshold)

    test = trainer.predict(ds["test"])
    probs, y = sigmoid(test.predictions), test.label_ids
    pred_global = probs >= threshold
    pred = probs >= np.array(per_class)
    per_class_f1 = f1_score(y, pred, average=None, zero_division=0)
    metrics = {
        "base_model": args.base,
        "threshold": threshold,
        "val_macro_f1": val_f1,
        "test_macro_f1_global_threshold": float(f1_score(y, pred_global, average="macro", zero_division=0)),
        "test_macro_f1": float(f1_score(y, pred, average="macro", zero_division=0)),
        "test_micro_f1": float(f1_score(y, pred, average="micro", zero_division=0)),
        "test_macro_precision": float(precision_score(y, pred, average="macro", zero_division=0)),
        "test_macro_recall": float(recall_score(y, pred, average="macro", zero_division=0)),
        "test_per_class_f1": {l: float(f) for l, f in zip(LABELS, per_class_f1)},
        "max_len": args.max_len,
        "epochs": args.epochs,
    }

    out = Path(args.out)
    trainer.save_model(out)
    tok.save_pretrained(out)
    (out / "thresholds.json").write_text(json.dumps(
        {"threshold": threshold, "per_class": dict(zip(LABELS, per_class))}, indent=2))
    (out / "metrics.json").write_text(json.dumps(metrics, indent=2))
    shutil.rmtree(out / "checkpoints", ignore_errors=True)  # optimizer state, not needed for inference
    print(json.dumps({k: v for k, v in metrics.items() if k != "test_per_class_f1"}, indent=2))


if __name__ == "__main__":
    main()
