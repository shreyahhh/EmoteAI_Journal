"""Cross-check the trained model against an independent LLM (Groq).

    set GROQ_API_KEY=...                       (PowerShell: $env:GROQ_API_KEY="...")
    python crosscheck.py --texts crosscheck_samples.txt --out crosscheck_report.json

Both read the same entries; the script reports where they agree and lists the
disagreements for a human to review. Agreement is NOT accuracy: the LLM is a second
opinion, not ground truth, and disagreements are as likely to be the LLM's mistake as
the model's. It is most useful for finding entry types to look at by hand.

PRIVACY: every text is sent to Groq. Use sample or test text, or entries whose owner
agreed to it, never other people's private journals.

Env: GROQ_API_KEY (required), GROQ_MODEL (default openai/gpt-oss-120b),
     GROQ_BASE_URL (default https://api.groq.com/openai/v1).
Texts: a .txt file with entries separated by a line containing only "---" (or one
entry per line if there are no separators), or a .json list of strings.
"""
import argparse
import json
import os
import statistics
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

from emotion_config import LABELS
from predict import EmotionModel, split_lines

MOODS = ["happy", "sad", "angry", "anxious", "neutral"]
DISAGREE_SCORE_GAP = 6.0  # points on the -10..10 scale


def load_texts(path: str) -> list[str]:
    raw = Path(path).read_text(encoding="utf-8")
    if path.endswith(".json"):
        return [str(t).strip() for t in json.loads(raw) if str(t).strip()]
    blocks = raw.split("\n---\n") if "\n---\n" in raw else raw.splitlines()
    return [b.strip() for b in blocks if b.strip()]


def build_prompt(text: str) -> str:
    lines = [l["text"] for l in split_lines(text)]
    numbered = "\n".join(f"{i}: {l}" for i, l in enumerate(lines))
    return (
        "You are an expert reader of personal journal entries. Read the entry below, "
        "line by line, and reply with JSON only, with exactly these keys:\n"
        '- "mood": one of "happy", "sad", "angry", "anxious", "neutral" (the overall tone)\n'
        '- "sentimentScore": a number from -10 (very negative) to 10 (very positive) for the whole entry\n'
        f'- "emotions": 2 to 4 of these labels, strongest first: {", ".join(LABELS)}\n'
        '- "sarcasticLines": the numbers of lines that are sarcastic or ironic, meaning the writer '
        "means the opposite of what the words literally say (empty list if none). Sincere enthusiasm is NOT sarcasm.\n\n"
        f"Entry (numbered lines):\n{numbered}"
    )


def ask_groq(text: str, retries: int = 4):
    base = os.environ.get("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
    body = {
        "model": os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b"),
        "messages": [{"role": "user", "content": build_prompt(text)}],
        "response_format": {"type": "json_object"},
        "temperature": 0,
        "max_tokens": 600,
    }
    if "gpt-oss" in body["model"]:
        body["reasoning_effort"] = "low"
        body["max_tokens"] = 1500  # the model's thinking counts toward this
    req = urllib.request.Request(
        f"{base}/chat/completions", data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {os.environ['GROQ_API_KEY']}"},
    )
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                content = json.load(r)["choices"][0]["message"]["content"]
            return json.loads(content)
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503) and attempt < retries - 1:
                time.sleep(float(e.headers.get("retry-after") or 2 ** (attempt + 1)))
                continue
            print(f"  Groq HTTP {e.code}", file=sys.stderr)
            return None
        except (urllib.error.URLError, json.JSONDecodeError, KeyError, TimeoutError) as e:
            print(f"  Groq error: {type(e).__name__}", file=sys.stderr)
            return None
    return None


def polarity(score: float) -> str:
    return "pos" if score > 1 else "neg" if score < -1 else "neu"


def normalise_llm(ans: dict, n_lines: int) -> dict:
    mood = str(ans.get("mood", "")).lower()
    try:
        score = max(-10.0, min(10.0, float(ans.get("sentimentScore"))))
    except (TypeError, ValueError):
        score = None
    emotions = [e.lower() for e in ans.get("emotions", []) if isinstance(e, str) and e.lower() in LABELS]
    sarc = sorted({int(i) for i in ans.get("sarcasticLines", []) if isinstance(i, (int, float)) and 0 <= int(i) < n_lines})
    return {"mood": mood if mood in MOODS else None, "score": score, "emotions": emotions, "sarcastic": sarc}


def summarise(rows: list[dict]) -> dict:
    ok = [r for r in rows if r["llm"] is not None]
    both_scores = [(r["ours"]["score"], r["llm"]["score"]) for r in ok if r["llm"]["score"] is not None]
    jacc = []
    for r in ok:
        a, b = set(e.lower() for e in r["ours"]["emotions"]), set(r["llm"]["emotions"])
        if a or b:
            jacc.append(len(a & b) / len(a | b))
    both_sarc = ours_only = llm_only = 0
    sarc_entry_agree = 0
    for r in ok:
        a, b = set(r["ours"]["sarcastic"]), set(r["llm"]["sarcastic"])
        both_sarc += len(a & b); ours_only += len(a - b); llm_only += len(b - a)
        sarc_entry_agree += bool(a) == bool(b)
    n = len(ok) or 1
    return {
        "entries": len(rows), "compared": len(ok), "llm_failed": len(rows) - len(ok),
        "mood_agreement": round(sum(r["ours"]["mood"] == r["llm"]["mood"] for r in ok) / n, 3),
        "polarity_agreement": round(sum(polarity(r["ours"]["score"]) == polarity(r["llm"]["score"]) for r in ok if r["llm"]["score"] is not None) / n, 3),
        "score_pearson_r": round(statistics.correlation(*zip(*both_scores)), 3) if len(both_scores) >= 3 else None,
        "score_mean_abs_diff": round(statistics.mean(abs(a - b) for a, b in both_scores), 2) if both_scores else None,
        "emotion_jaccard_mean": round(statistics.mean(jacc), 3) if jacc else None,
        "our_top_emotion_in_llm_set": round(sum(bool(r["ours"]["emotions"]) and r["ours"]["emotions"][0].lower() in r["llm"]["emotions"] for r in ok) / n, 3),
        "sarcasm": {"lines_both_flag": both_sarc, "ours_only": ours_only, "llm_only": llm_only, "entry_level_agreement": round(sarc_entry_agree / n, 3)},
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--texts", default="crosscheck_samples.txt")
    ap.add_argument("--out", default="crosscheck_report.json")
    ap.add_argument("--model", default="model")
    ap.add_argument("--sarcasm", default="sarcasm_model")
    ap.add_argument("--delay", type=float, default=0.5, help="seconds between Groq calls")
    ap.add_argument("--limit", type=int, default=0)
    args = ap.parse_args()
    if not os.environ.get("GROQ_API_KEY"):
        sys.exit("Set GROQ_API_KEY first (free key from console.groq.com).")

    texts = load_texts(args.texts)[: args.limit or None]
    ours_model = EmotionModel(args.model, args.sarcasm)
    rows = []
    for i, text in enumerate(texts, 1):
        print(f"[{i}/{len(texts)}] {text[:60]!r}")
        r = ours_model.analyze(text)
        ours = {"mood": r["mood"], "score": r["sentimentScore"], "emotions": r["emotions"],
                "sarcastic": [k for k, l in enumerate(r["lines"]) if l["sarcasm"]["flagged"]]}
        ans = ask_groq(text)
        rows.append({"text": text, "ours": ours, "llm": normalise_llm(ans, len(r["lines"])) if ans else None})
        time.sleep(args.delay)

    summary = summarise(rows)
    disagreements = []
    for r in rows:
        if r["llm"] is None:
            continue
        gap = abs(r["ours"]["score"] - r["llm"]["score"]) if r["llm"]["score"] is not None else 0
        why = []
        if r["ours"]["mood"] != r["llm"]["mood"]:
            why.append(f"mood: ours={r['ours']['mood']} llm={r['llm']['mood']}")
        if gap >= DISAGREE_SCORE_GAP:
            why.append(f"score gap {gap:.1f}: ours={r['ours']['score']} llm={r['llm']['score']}")
        if set(r["ours"]["sarcastic"]) != set(r["llm"]["sarcastic"]):
            why.append(f"sarcastic lines: ours={r['ours']['sarcastic']} llm={r['llm']['sarcastic']}")
        if why:
            disagreements.append({"text": r["text"][:300], "why": why, "ours": r["ours"], "llm": r["llm"], "_gap": gap})
    disagreements.sort(key=lambda d: -d["_gap"])
    for d in disagreements:
        d.pop("_gap")

    Path(args.out).write_text(json.dumps({"summary": summary, "disagreements": disagreements, "rows": rows}, indent=2, ensure_ascii=False), encoding="utf-8")
    print("\n=== Agreement with the LLM (a second opinion, not ground truth) ===")
    print(json.dumps(summary, indent=2))
    print(f"\n{len(disagreements)} entries to review by hand -> {args.out} (\"disagreements\")")


if __name__ == "__main__":
    main()
