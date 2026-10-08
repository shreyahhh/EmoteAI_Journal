# Emote emotion model

Two fine-tuned RoBERTa models read a journal entry **line by line** and return,
for every sentence and for the entry as a whole: emotions (28 GoEmotions
labels), mood, a -10..10 sentiment score, a mixed-sentiment flag and a sarcasm
check. They replace the Gemini prompt that `analyzeEntry` used. Themes,
summaries, chat and resources still use Gemini.

| Model | Task | Trained on | Script |
|---|---|---|---|
| Emotion | 28-way multi-label emotion detection, per-class thresholds | GoEmotions (58k Reddit comments) | `train.py` |
| Sarcasm | binary sarcasm / irony detection, precision-tuned threshold | iSarcasmEval (self-labelled, first-person) + tweet_eval irony + Reddit | `train_sarcasm.py` |

## Design basis

Follows the recommendations in K. Anwar, Shreya, M. Sharma and K. Saanvi,
*A Review of Multimodal Sentiment Analysis: Taxonomy, Issues, Challenges, and
Future Perspectives* (Computers and Electrical Engineering). Entries are text
only, so none of the fusion machinery applies. What carries over:

| Paper | Here |
|---|---|
| §4, §7.13: transformer text features, transfer learning and fine-tuning | fine-tuned RoBERTa (large by default) |
| §7.8: detect multiple, mixed sentiments | multi-label head plus a `mixed` flag |
| §7.6: mood detection | five-way `mood` output |
| §5.2, §7.4: sarcasm and subtle tone shifts | dedicated sarcasm model, per line |
| §4, §7.3: explainability | `explain: true` returns the words that drove each line's top emotion (occlusion attribution) |
| §6.2, §6.3: accuracy, F1, precision, recall, MAE, correlation, calibration, efficiency | `evaluate.py` |

## How an entry is analysed

1. The entry is split into sentences (offsets are returned so the UI can
   highlight each line in place).
2. Each line is scored by the emotion model and the sarcasm model. Sarcasm is
   scored on the line alone and with the preceding line, then averaged.
3. A sarcasm flag **never changes a line's result by itself**. About 1 in 10
   sincere positive lines can be wrongly flagged (measured, see below), so a
   flagged line that reads positive is marked `needsReview` and returned with
   an `ifSarcastic` alternative (positive strength moved to *Annoyance*). Only
   when the client sends the line's index in `sarcasm_confirmed` is the
   correction applied (`adjusted: true`, with the original under `literal`).
   Sarcasm over an already negative line is flagged but there is nothing to flip.
   Each confirm or reject is also the start of a labelled, journal-style
   sarcasm dataset for retraining.
4. Entry level: mood and score come from the length-weighted mean of the lines
   (dominant tone); emotions and `mixed` come from the per-label maximum
   (anything strongly present anywhere).

## Usage

Train on a GPU (Colab: open `colab_train.ipynb`), unzip the result into `ml/`
so you have `ml/model/` and `ml/sarcasm_model/`, then:

```
pip install -r requirements.txt
python evaluate.py --model model --sarcasm sarcasm_model   # writes model/eval_report.json
.\run_dev.ps1                                               # model server with the login check ON
```

**Login check.** `/analyze` only answers signed-in users: the browser sends the Supabase access token and the server asks
Supabase Auth whether it is valid (cached for up to 60 s, never past the token's own expiry). If Supabase can't be reached the
request is refused (503), not let through. Each user is also limited to `EMOTE_RATE_PER_MIN` analyses a minute (default 20, 429 with
`Retry-After`). `run_dev.ps1` fills in `SUPABASE_URL` / `SUPABASE_ANON_KEY` from `frontend-new/.env.local` (public values). To run
elsewhere set those two variables, and `EMOTE_ALLOWED_ORIGINS` to your site's origin. The server refuses to start without them unless
you explicitly set `EMOTE_AUTH=off` (local experiments only). Tests: `python -m unittest test_server_auth`.

CPU smoke test of the scripts (fast, not accurate):
`python train.py --base distilroberta-base --max-train 320 --epochs 1 --out smoke_emo`

`POST /analyze {"text": "...", "explain": true, "sarcasm_confirmed": [2]}`:

```json
{
  "sentimentScore": -2.1, "mood": "angry", "mixed": false,
  "emotions": ["Annoyance", "Disappointment"],
  "sarcasm": {"detected": true, "lines": [1], "maxProbability": 0.91, "available": true},
  "lines": [
    {"text": "Spent all day on the report.", "start": 0, "end": 28, "mood": "neutral",
     "sentimentScore": 0.4, "emotions": ["Realization", "Caring"],
     "sarcasm": {"probability": 0.08, "flagged": false}, "adjusted": false},
    {"text": "Great, my boss loved it so much he rewrote everything.", "start": 29, "end": 83,
     "mood": "angry", "sentimentScore": -6.8, "emotions": ["Annoyance", "Disapproval"],
     "sarcasm": {"probability": 0.91, "flagged": true}, "adjusted": true,
     "literal": {"sentimentScore": 6.8, "emotions": ["Admiration", "Joy"], "mood": "happy"}}
  ]
}
```

(Illustrative shape; real numbers come from the trained models.)

## Cross-checking against an independent LLM

`crosscheck.py` runs the same entries through this model and through Groq, then reports where they
agree (mood, polarity, score correlation, emotion overlap, sarcastic lines) and lists the disagreements
to review by hand. Agreement is not accuracy: the LLM is a second opinion, not ground truth.

```
$env:GROQ_API_KEY = "your_groq_key"        # PowerShell
python crosscheck.py --texts crosscheck_samples.txt --out crosscheck_report.json
```

Every text is sent to Groq, so use sample or test text (`crosscheck_samples.txt` has 23 made-up entries),
not other people's private entries.

## Honest limits

- **Emotion accuracy has a ceiling.** GoEmotions labels are noisy and
  subjective, and published fine-tuned models reach roughly 0.5 macro-F1, not
  90%. Expect strong results on common emotions (joy, gratitude, anger) and weak
  results on rare ones.
- **Sarcasm from text alone is hard.** On self-labelled first-person text
  (iSarcasmEval) even strong models score only moderate F1 on the sarcastic
  class. The threshold is tuned for precision, so some sarcasm will be missed in
  exchange for fewer wrong flips. `metrics.json` in `sarcasm_model/` reports each
  source separately; trust the iSarcasmEval number for journal-like text.
- **Domain shift.** Training text is Reddit and Twitter; journals are longer and
  more personal.
- Mood and the score are derived from emotion probabilities with fixed rules
  (`emotion_config.py`), so their reported metrics measure agreement with those
  rules applied to the gold labels.
- The previous-line context window for sarcasm is a heuristic, not separately
  validated.
- Sarcasm over-triggers on enthusiastic sincere lines ("I finally got the
  promotion I worked so hard for!" scored 0.97). In a small hand-written probe at
  threshold 0.92, 2 of 20 sincere positive lines were flagged and 9 of 12
  sarcastic lines caught. Hence confirm-before-correct.
- Not a clinical tool.
