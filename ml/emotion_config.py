"""Shared label definitions and the mapping from GoEmotions labels to the app's
mood buckets and sentiment score. Used by both training and serving."""

# GoEmotions "simplified" label order (28 classes, index == dataset label id).
LABELS = [
    "admiration", "amusement", "anger", "annoyance", "approval", "caring",
    "confusion", "curiosity", "desire", "disappointment", "disapproval",
    "disgust", "embarrassment", "excitement", "fear", "gratitude", "grief",
    "joy", "love", "nervousness", "optimism", "pride", "realization",
    "relief", "remorse", "sadness", "surprise", "neutral",
]

# App mood buckets (must match MOOD_KEYS in frontend-new/src/lib/gemini.js).
MOOD_BUCKETS = {
    "happy": [
        "admiration", "amusement", "approval", "caring", "desire", "excitement",
        "gratitude", "joy", "love", "optimism", "pride", "relief",
    ],
    "sad": ["disappointment", "embarrassment", "grief", "remorse", "sadness"],
    "angry": ["anger", "annoyance", "disapproval", "disgust"],
    "anxious": ["fear", "nervousness", "confusion"],
    "neutral": ["neutral", "realization", "curiosity", "surprise"],
}

# Per-emotion valence used for the -10..10 sentiment score
# (follows GoEmotions' own positive / negative / ambiguous grouping).
POSITIVE = set(MOOD_BUCKETS["happy"])
NEGATIVE = {
    "anger", "annoyance", "disapproval", "disgust", "fear", "nervousness",
    "disappointment", "embarrassment", "grief", "remorse", "sadness", "confusion",
}

LABEL_TO_MOOD = {l: m for m, labels in MOOD_BUCKETS.items() for l in labels}


def valence(label: str) -> int:
    """+1 positive, -1 negative, 0 neutral/ambiguous."""
    return 1 if label in POSITIVE else -1 if label in NEGATIVE else 0


# Human-readable names for the `emotions` array shown in the UI.
def display_name(label: str) -> str:
    return label.capitalize()
