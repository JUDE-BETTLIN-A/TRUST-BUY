import feedparser
from textblob import TextBlob
import urllib.parse
import re

def fetch_market_sentiment(product_name):
    """
    Fetches news via Google News RSS and deduces a 'Price Sentiment Score'.
    Score > 0 : Expect Price Rise (Inflation/Shortage)
    Score < 0 : Expect Price Drop (Discounts/Glut)
    """
    try:
        # 1. Cleaner Query
        # Remove specific specs to get broader category trends if needed, 
        # or keep it specific. e.g. "Intel i7 price trends"
        # Let's try to identify category keywords (RAM, SSD, Processor, GPU)
        keywords = []
        full_lower = product_name.lower()
        if 'ram' in full_lower or 'memory' in full_lower: keywords.append("DRAM price trend")
        elif 'ssd' in full_lower or 'storage' in full_lower: keywords.append("NAND flash price trend")
        elif 'processor' in full_lower or 'cpu' in full_lower or 'intel' in full_lower or 'amd' in full_lower: keywords.append("CPU price forecast")
        elif 'card' in full_lower or 'gpu' in full_lower or 'rtx' in full_lower: keywords.append("GPU price trend")
        else: keywords.append(f"{product_name} price")
        
        query = keywords[0]
        encoded = urllib.parse.quote(query)
        rss_url = f"https://news.google.com/rss/search?q={encoded}+when:30d&hl=en-IN&gl=IN&ceid=IN:en"
        
        print(f"News Analyzer: Checking '{query}'...")
        feed = feedparser.parse(rss_url)
        
        if not feed.entries:
            return {"score": 0, "summary": "No specific news found."}

        sentiment_score = 0
        headline_count = 0
        reasons = []

        # Keywords that specifically mean PRICE INCREASE
        inflation_words = ["hike", "surge", "jump", "soar", "increase", "shortage", "crisis", "expensive", "inflation", "climb"]
        # Keywords that specifically mean PRICE DECREASE
        deflation_words = ["drop", "fall", "plunge", "slash", "cut", "cheaper", "discount", "surplus", "glut", "low", "down"]

        for entry in feed.entries[:10]: # Check top 10 news
            title = entry.title.lower()
            
            # Simple Keyword Heuristic (More accurate than generic NLP for this specific domain)
            score = 0
            if any(w in title for w in inflation_words):
                score += 1
            if any(w in title for w in deflation_words):
                score -= 1
                
            if score != 0:
                sentiment_score += score
                headline_count += 1
                reasons.append(entry.title)

        # Normalize
        final_signal = "Neutral"
        if sentiment_score > 0: final_signal = "Inflationary (Prices Rising)"
        if sentiment_score < 0: final_signal = "Deflationary (Prices Falling)"

        print(f"News Analysis: Score {sentiment_score} from {headline_count} relevant articles.")
        
        return {
            "score": sentiment_score, 
            "signal": final_signal,
            "top_news": reasons[:2]
        }

    except Exception as e:
        print(f"News Error: {e}")
        return {"score": 0, "signal": "Error", "top_news": []}
