from transformers import pipeline
import nltk
from nltk.tokenize import sent_tokenize

# Download the sentence tokenizer models (only needs to be done once)
for resource in ("punkt", "punkt_tab"):
    try:
        nltk.data.find(f"tokenizers/{resource}")
    except LookupError:
        nltk.download(resource)

try:
    # Load emotion detection model
    emotion_classifier = pipeline(
        "text-classification",
        model="j-hartmann/emotion-english-distilroberta-base",
        top_k=None
    )

    # Load sentiment analysis model
    sentiment_classifier = pipeline(
        "sentiment-analysis",
        model="distilbert-base-uncased-finetuned-sst-2-english"
    )
except Exception as e:
    print(f"Error loading NLP models: {e}")
    emotion_classifier = None
    sentiment_classifier = None

def analyze_text_granularly(text: str):
    """
    Analyzes the given text for emotion and sentiment, sentence by sentence.
    """
    if not emotion_classifier or not sentiment_classifier:
        return {"error": "NLP models are not available."}

    sentences = sent_tokenize(text)
    results = []

    for sentence in sentences:
        if not sentence.strip():
            continue
            
        emotion_results = emotion_classifier(sentence)
        sentiment_results = sentiment_classifier(sentence)
        results.append({
            "sentence": sentence,
            "emotion": emotion_results[0],
            "sentiment": sentiment_results[0]
        })

    return results

def analyze_text(text: str):
    """
    Analyzes the given text for emotion and sentiment using the loaded models.
    """
    if not emotion_classifier or not sentiment_classifier:
        return {"error": "NLP models are not available."}

    emotion_results = emotion_classifier(text)
    sentiment_results = sentiment_classifier(text)

    return {
        "emotion": emotion_results[0],
        "sentiment": sentiment_results[0]
    } 