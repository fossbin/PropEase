from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

analyzer = SentimentIntensityAnalyzer()

def classify_sentiment(text: str) -> str:
    try:
        text = text[:512]  # Limit input length
        scores = analyzer.polarity_scores(text)
        compound = scores["compound"]

        if compound >= 0.05:
            return "Positive"
        elif compound <= -0.05:
            return "Negative"
        else:
            return "Neutral"
    except Exception as e:
        print(f"VADER sentiment error: {e}")
        return "Neutral"
