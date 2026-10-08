"""Evaluate the trained model on the GoEmotions test split, reporting the metric
families recommended in "A Review of Multimodal Sentiment Analysis" (§6.2-6.3):

  * classification: accuracy, F1, precision, recall (emotions + 5-way mood)
  * sentiment intensity: MAE and Pearson correlation of the -10..10 score
  * calibration: ECE, Brier score, AUROC, AUPRC
  * efficiency: parameter count and per-entry CPU latency

    python evaluate.py --model model
"""
import argparse
import json
import time
from pathlib import Path

import numpy as np
import torch
from datasets import load_dataset
from scipy.stats import pearsonr
from sklearn.metrics import (
    accuracy_score, average_precision_score, f1_score, precision_score,
    recall_score, roc_auc_score,
)

from emotion_config import LABELS
from predict import EmotionModel, summarize

MOODS = ["happy", "sad", "angry", "anxious", "neutral"]


def expected_calibration_error(probs, y, bins=15):
    """ECE over every (example, label) probability, binned by confidence."""
    p, t = probs.ravel(), y.ravel()
    edges = np.linspace(0, 1, bins + 1)
    ece = 0.0
    for lo, hi in zip(edges[:-1], edges[1:]):
        m = (p > lo) & (p <= hi)
        if m.any():
            ece += m.mean() * abs(t[m].mean() - p[m].mean())
    return float(ece)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="model")
    ap.add_argument("--sarcasm", default="sarcasm_model", help="included in the latency measurement if present")
    ap.add_argument("--max-len", type=int, default=64)
    ap.add_argument("--batch-size", type=int, default=64)
    args = ap.parse_args()

    m = EmotionModel(args.model, args.sarcasm)
    ds = load_dataset("google-research-datasets/go_emotions", "simplified")["test"]
    texts = ds["text"]
    y = np.zeros((len(ds), len(LABELS)), dtype=np.float32)
    for i, labs in enumerate(ds["labels"]):
        y[i, labs] = 1.0

    # Batched probabilities (test comments are short, so no windowing needed here).
    probs = []
    with torch.inference_mode():
        for i in range(0, len(texts), args.batch_size):
            enc = m.tok(texts[i:i + args.batch_size], truncation=True, max_length=args.max_len,
                        padding=True, return_tensors="pt")
            probs.append(torch.sigmoid(m.model(**enc).logits).numpy())
    probs = np.concatenate(probs)
    pred = probs >= m.thresholds

    # --- emotions (multi-label) ---
    emotions = {
        "subset_accuracy": accuracy_score(y, pred),
        "micro_f1": f1_score(y, pred, average="micro", zero_division=0),
        "macro_f1": f1_score(y, pred, average="macro", zero_division=0),
        "macro_precision": precision_score(y, pred, average="macro", zero_division=0),
        "macro_recall": recall_score(y, pred, average="macro", zero_division=0),
    }

    # --- mood (5-way) and sentiment score, derived identically from gold and predicted ---
    gold = [summarize(row, m.thresholds) for row in y]
    got = [summarize(row, m.thresholds) for row in probs]
    gold_mood = [g["mood"] for g in gold]
    got_mood = [g["mood"] for g in got]
    mood = {
        "accuracy": accuracy_score(gold_mood, got_mood),
        "macro_f1": f1_score(gold_mood, got_mood, labels=MOODS, average="macro", zero_division=0),
        "weighted_f1": f1_score(gold_mood, got_mood, labels=MOODS, average="weighted", zero_division=0),
        "note": "gold mood is derived from the gold GoEmotions labels with the same bucket rule",
    }
    gs = np.array([g["sentimentScore"] for g in gold])
    ps = np.array([g["sentimentScore"] for g in got])
    polarity = lambda s: np.where(s > 1, "pos", np.where(s < -1, "neg", "neu"))
    sentiment = {
        "mae": float(np.abs(gs - ps).mean()),
        "pearson_r": float(pearsonr(gs, ps)[0]),
        "polarity_accuracy": accuracy_score(polarity(gs), polarity(ps)),
        "mixed_flag_f1": f1_score([g["mixed"] for g in gold], [g["mixed"] for g in got], zero_division=0),
    }

    # --- calibration (skip labels with no positive example in the split) ---
    present = y.sum(0) > 0
    calibration = {
        "ece": expected_calibration_error(probs, y),
        "brier": float(((probs - y) ** 2).mean()),
        "macro_auroc": float(roc_auc_score(y[:, present], probs[:, present], average="macro")),
        "macro_auprc": float(average_precision_score(y[:, present], probs[:, present], average="macro")),
    }

    # --- efficiency (single-entry latency on this machine) ---
    sample = texts[:50]
    m.analyze(sample[0])  # warm-up
    t0 = time.perf_counter()
    for s in sample:
        m.analyze(s)
    efficiency = {
        "parameters_m": round(sum(p.numel() for p in m.model.parameters()) / 1e6, 1),
        "latency_ms_per_entry": round((time.perf_counter() - t0) / len(sample) * 1000, 1),
        "device": "cuda" if torch.cuda.is_available() else "cpu",
    }

    report = {
        "n_test": len(texts),
        "threshold": m.threshold,
        "per_class_thresholds": bool(not np.isscalar(m.thresholds)),
        "emotions": emotions,
        "mood": mood,
        "sentiment_score": sentiment,
        "calibration": calibration,
        "efficiency": efficiency,
    }
    out = Path(args.model) / "eval_report.json"
    out.write_text(json.dumps(report, indent=2, default=float))
    print(json.dumps(report, indent=2, default=float))
    print(f"\nSaved {out}")


if __name__ == "__main__":
    main()
