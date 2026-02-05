#!/usr/bin/env python3
import requests
import json

# Test the Prophet prediction endpoint
url = "http://localhost:8000/predict"
data = {
    "product_name": "iPhone 15",
    "current_price": 70000,
    "product_url": "https://example.com"
}

try:
    response = requests.post(url, json=data, timeout=10)
    if response.status_code == 200:
        result = response.json()
        print("✅ Prophet Prediction Success!")
        print(f"Trend: {result.get('trend')}")
        print(f"Recommendation: {result.get('recommendation')}")
        print(f"Forecast points: {len(result.get('forecast', []))}")
        print(f"Data source: {result.get('data_source')}")
    else:
        print(f"❌ HTTP Error: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"❌ Connection Error: {e}")