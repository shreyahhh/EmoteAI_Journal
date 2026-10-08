"""Inference: line-by-line analysis of a journal entry.

Each sentence is scored by the emotion model (28 GoEmotions labels) and the
sarcasm model. Sarcastic lines whose surface reading is positive have their
polarity corrected (positive emotion mass moves to Annoyance) and are marked
`adjusted`, keeping the literal reading alongside so the UI can show why.
The whole-entry result is aggregated from the per-line results.

The top-level keys (sentimentScore, emotions, mood, mixed, scores) are the
entry-level analysis, so existing callers keep working; `lines` and `sarcasm`
are additions.
"""
import json
import re
from pathlib import Path

import numpy as np
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from emotion_config import LABELS, MOOD_BUCKETS, NEGATIVE, POSITIVE, display_name

MAX_LEN = 128  # tokens per line; longer run-on sentences are truncated
NEUTRAL_MIN = 0.25  # below this top-bucket score the line is treated as neutral
MIXED_MIN = 0.35  # both a positive and a negative emotion at least this strong => mixed
EXPLAIN_MAX_WORDS = 80
MAX_LINES = 120  # lines analysed per entry; ~0.25 s/line on CPU, so unbounded input is a denial of service
SARCASM_FALLBACK_THRESHOLD = 0.7
SARCASM_MIN_THRESHOLD = 0.5
POS_IDX = [LABELS.index(l) for l in POSITIVE]
ANNOYANCE = LABELS.index("annoyance")
NEG_IDX = [LABELS.index(l) for l in NEGATIVE]

# Sentence boundary: end punctuation (+ closing quotes/brackets) followed by space,
# or any newline. Common abbreviations are protected below.
_SPLIT = re.compile(r'(?<=[.!?…])["\')\]]*\s+|\n+')
_ABBREV = re.compile(r"\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|vs|etc|e\.g|i\.e)\.$", re.IGNORECASE)


def norm_line(text: str) -> str:
    """Key for matching a line across edits: lowercase, alphanumerics and single
    spaces only. Must match normLine() in frontend-new/src/lib/sarcasmKeys.js."""
    return " ".join(re.sub(r"[^a-z0-9]+", " ", text.lower()).split())


def split_lines(text: str) -> list[dict]:
    """Split into sentences, returning {text, start, end} with character offsets
    into the original string so the UI can highlight each line in place."""
    spans, pos, pieces = [], 0, []
    for m in _SPLIT.finditer(text):
        pieces.append((pos, m.start() + len(m.group(0).rstrip())))
        pos = m.end()
    pieces.append((pos, len(text)))

    # Re-join splits that happened after an abbreviation ("Dr. Smith") or at an
    # ellipsis that continues in lowercase ("so tired... but happy"). The
    # lowercase rule is ellipsis-only: plenty of people journal in all lowercase.
    merged = []
    for s, e in pieces:
        prev = text[merged[-1][0]:merged[-1][1]].strip() if merged else ""
        if merged and (_ABBREV.search(prev) or (prev.endswith(("...", "…")) and text[s:e].lstrip()[:1].islower())):
            merged[-1] = (merged[-1][0], e)
        else:
            merged.append((s, e))
    for s, e in merged:
        chunk = text[s:e]
        stripped = chunk.strip()
        if stripped:
            lead = len(chunk) - len(chunk.lstrip())
            spans.append({"text": stripped, "start": s + lead, "end": s + lead + len(stripped)})
    return spans


def summarize(p: np.ndarray, thresholds) -> dict:
    """Probabilities (len(LABELS),) -> analysis. Pure function, shared by the API
    and the evaluation script so both measure the same thing. `thresholds` is a
    single float or one value per label."""
    thr = np.broadcast_to(np.asarray(thresholds, dtype=float), p.shape)
    by_label = dict(zip(LABELS, p.tolist()))

    # Emotions: labels over their threshold, strongest first, 2-4 of them
    # (padded with the next-most-likely if fewer than 2 clear it).
    ranked = sorted(by_label, key=by_label.get, reverse=True)
    picked = [l for l in ranked if by_label[l] >= thr[LABELS.index(l)] and l != "neutral"][:4]
    if len(picked) < 2:
        picked = [l for l in ranked if l != "neutral"][:2]

    # Mood: bucket with the highest summed-then-capped probability.
    bucket_scores = {
        m: min(1.0, sum(by_label[l] for l in labels)) for m, labels in MOOD_BUCKETS.items()
    }
    mood = max(bucket_scores, key=bucket_scores.get)
    if bucket_scores[mood] < NEUTRAL_MIN:
        mood = "neutral"

    pos = max((by_label[l] for l in POSITIVE), default=0.0)
    neg = max((by_label[l] for l in NEGATIVE), default=0.0)
    return {
        "sentimentScore": round(10 * (pos - neg), 1),
        "emotions": [display_name(l) for l in picked],
        "mood": mood,
        # e.g. "excited about the event, but now disappointed"
        "mixed": bool(pos >= MIXED_MIN and neg >= MIXED_MIN),
        "scores": {l: round(by_label[l], 4) for l in ranked[:8]},
    }


def correct_for_sarcasm(p: np.ndarray) -> np.ndarray:
    """Move the strength of the positive reading onto Annoyance: 'Great, another
    meeting' is literally positive but expresses the opposite."""
    q = p.copy()
    pos_mass = q[POS_IDX].max()
    q[POS_IDX] = 0.0
    q[ANNOYANCE] = max(q[ANNOYANCE], pos_mass)
    return q


def _load_thresholds(path: Path, default_global: float):
    if not path.exists():
        return default_global, None
    cfg = json.loads(path.read_text())
    per = cfg.get("per_class")
    arr = np.array([per[l] for l in LABELS]) if per else None
    return cfg["threshold"], arr


def length_sorted_batches(tok, texts, batch=32):
    """Yield (indices, encoded batch) with texts grouped by length so short lines
    aren't padded to the longest one. Callers write results back by index."""
    order = sorted(range(len(texts)), key=lambda i: len(texts[i]))
    for start in range(0, len(order), batch):
        idx = order[start:start + batch]
        yield idx, tok([texts[i] for i in idx], truncation=True, max_length=MAX_LEN, padding=True, return_tensors="pt")


class SarcasmModel:
    def __init__(self, model_dir: str):
        d = Path(model_dir)
        self.tok = AutoTokenizer.from_pretrained(d)
        self.model = AutoModelForSequenceClassification.from_pretrained(d).eval()
        threshold, _ = _load_thresholds(d / "thresholds.json", SARCASM_FALLBACK_THRESHOLD)
        # The tuned threshold favours precision, so never let it drop below a
        # coin flip (a weak model can tune to a very low value and flag everything).
        self.threshold = max(threshold, SARCASM_MIN_THRESHOLD)

    @torch.inference_mode()
    def probs(self, texts: list[str]) -> np.ndarray:
        out = np.zeros(len(texts))
        for idx, enc in length_sorted_batches(self.tok, texts):
            out[idx] = torch.softmax(self.model(**enc).logits, dim=-1)[:, 1].numpy()
        return out

    def score_lines(self, lines: list[str]) -> np.ndarray:
        """Sarcasm probability per line. Each line is scored alone and together
        with the preceding line (sarcasm often needs the setup); the two are
        averaged. Single-line entries use the line alone."""
        alone = self.probs(lines)
        if len(lines) < 2:
            return alone
        with_ctx = self.probs([lines[0]] + [f"{lines[i - 1]} {lines[i]}" for i in range(1, len(lines))])
        return (alone + with_ctx) / 2


class EmotionModel:
    def __init__(self, model_dir: str = "model", sarcasm_dir: str | None = "sarcasm_model"):
        d = Path(model_dir)
        self.tok = AutoTokenizer.from_pretrained(d)
        self.model = AutoModelForSequenceClassification.from_pretrained(d).eval()
        self.threshold, per_class = _load_thresholds(d / "thresholds.json", 0.3)
        self.thresholds = per_class if per_class is not None else self.threshold
        self.sarcasm = SarcasmModel(sarcasm_dir) if sarcasm_dir and Path(sarcasm_dir).exists() else None

    @torch.inference_mode()
    def _line_probs(self, lines: list[str]) -> np.ndarray:
        out = np.zeros((len(lines), len(LABELS)))
        for idx, enc in length_sorted_batches(self.tok, lines):
            out[idx] = torch.sigmoid(self.model(**enc).logits).numpy()
        return out

    @torch.inference_mode()
    def explain(self, text: str, label: str, top_k: int = 5) -> list[dict]:
        """Occlusion attribution: how much does the probability of `label` drop
        when each word is removed? Positive weight = the word pushed the model
        toward that emotion. Model-agnostic, no extra dependencies."""
        words = text.split()[:EXPLAIN_MAX_WORDS]
        if not words:
            return []
        idx = LABELS.index(label)
        variants = [" ".join(words)] + [" ".join(words[:i] + words[i + 1:]) for i in range(len(words))]
        enc = self.tok(variants, truncation=True, max_length=MAX_LEN, padding=True, return_tensors="pt")
        probs = torch.sigmoid(self.model(**enc).logits)[:, idx].numpy()
        drops = probs[0] - probs[1:]
        order = np.argsort(-drops)[:top_k]
        return [{"word": words[i], "weight": round(float(drops[i]), 4)} for i in order if drops[i] > 0]

    def analyze(self, text: str, explain: bool = False, sarcasm_confirmed=None, sarcasm_confirmed_texts=None) -> dict:
        """`sarcasm_confirmed`: indices of lines the person confirmed they meant
        sarcastically. A sarcasm flag NEVER changes a line's result on its own
        (about 1 in 10 sincere positive lines can be wrongly flagged); the
        corrected reading is offered as `ifSarcastic` and applied only on
        confirmation."""
        confirmed = set(sarcasm_confirmed or [])
        confirmed_keys = {norm_line(t) for t in (sarcasm_confirmed_texts or [])}
        spans = split_lines(text.strip()) or [{"text": text.strip(), "start": 0, "end": len(text.strip())}]
        total_lines = len(spans)
        spans = spans[:MAX_LINES]
        texts = [s["text"] for s in spans]
        probs = self._line_probs(texts)
        sarc = self.sarcasm.score_lines(texts) if self.sarcasm else np.zeros(len(texts))
        sarc_thr = self.sarcasm.threshold if self.sarcasm else 1.0

        lines, effective = [], []
        for i, (span, p, sp) in enumerate(zip(spans, probs, sarc)):
            literal = summarize(p, self.thresholds)
            flagged = bool(sp >= sarc_thr)
            # Only a positive surface reading can be corrected; sarcasm over a line
            # that is already negative is flagged but there is nothing to flip.
            correctable = flagged and p[POS_IDX].max() > p[NEG_IDX].max()
            is_confirmed = i in confirmed or norm_line(span["text"]) in confirmed_keys
            apply = correctable and is_confirmed
            eff = correct_for_sarcasm(p) if apply else p
            line = {**span, **summarize(eff, self.thresholds),
                    "sarcasm": {"probability": round(float(sp), 4), "flagged": flagged,
                                "confirmed": bool(flagged and is_confirmed), "needsReview": bool(correctable and not apply)},
                    "adjusted": bool(apply)}
            if apply:
                line["literal"] = {k: literal[k] for k in ("sentimentScore", "emotions", "mood")}
            elif correctable:
                alt = summarize(correct_for_sarcasm(p), self.thresholds)
                line["ifSarcastic"] = {k: alt[k] for k in ("sentimentScore", "emotions", "mood")}
            if explain and line["emotions"]:
                top = line["emotions"][0].lower()
                line["explanation"] = {"emotion": top, "words": self.explain(span["text"], top)}
            lines.append(line)
            effective.append(eff)

        # Entry level: dominant tone (mood, score) from the length-weighted mean of
        # the lines; what is present anywhere (emotions, mixed) from the per-label max.
        eff = np.stack(effective)
        w = np.array([max(1, len(t.split())) for t in texts], dtype=float)
        w /= w.sum()
        tone = summarize((eff * w[:, None]).sum(0), self.thresholds)
        presence = summarize(eff.max(0), self.thresholds)
        flagged_lines = [i for i, l in enumerate(lines) if l["sarcasm"]["flagged"]]
        return {
            "sentimentScore": tone["sentimentScore"],
            "mood": tone["mood"],
            "emotions": presence["emotions"],
            "mixed": presence["mixed"],
            "scores": presence["scores"],
            "sarcasm": {
                "detected": bool(flagged_lines),
                "lines": flagged_lines,
                "needsReview": [i for i, l in enumerate(lines) if l["sarcasm"]["needsReview"]],
                "maxProbability": round(float(sarc.max()), 4) if len(sarc) else 0.0,
                "available": self.sarcasm is not None,
            },
            "lines": lines,
            "truncated": total_lines > MAX_LINES,
            "totalLines": total_lines,
        }
