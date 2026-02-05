import sys
import os
import pandas as pd
from history_scraper import fetch_external_history

# Add current dir to path to find modules if needed
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_url(url, name):
    print(f"\n--- Testing {name} ---")
    print(f"URL: {url}")
    try:
        df = fetch_external_history(url, name)
        if not df.empty:
            print(f"✅ SUCCESS! Found {len(df)} real data points.")
            print(df.head())
            print(df.tail())
        else:
            print("❌ NO DATA FOUND (as expected if strict mode is on and site blocks us/no data)")
    except Exception as e:
        print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    # iPhone 15 on Flipkart (Real PID: MOBGTAGPAQNVFZZY)
    test_url(
        "https://www.flipkart.com/apple-iphone-15-blue-128-gb/p/itmbf14ef54f645d?pid=MOBGTAGPAQNVFZZY", 
        "Flipkart iPhone 15"
    )
    
    # Amazon Example (Real ASIN: B0CHX1W6VV - iPhone 15)
    test_url(
        "https://www.amazon.in/Apple-iPhone-15-128-GB/dp/B0CHX1W6VV", 
        "Amazon iPhone 15"
    )
