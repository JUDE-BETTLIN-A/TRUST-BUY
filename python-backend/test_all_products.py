"""
Test browser scraper with multiple product types
"""
import asyncio
from browser_scraper import fetch_pricebefore_browser

test_products = [
    {
        "name": "Samsung Galaxy S24",
        "url": "https://www.flipkart.com/samsung-galaxy-s24-ultra-5g-titanium-black-256-gb/p/itm12345"
    },
    {
        "name": "Sony WH-1000XM5 Headphones", 
        "url": "https://www.amazon.in/Sony-WH-1000XM5-Cancelling-Headphones-Bluetooth/dp/B09XS7JWHH"
    },
    {
        "name": "MacBook Air M2",
        "url": "https://www.flipkart.com/apple-2022-macbook-air-m2-8-gb-256-gb-ssd-mac-os-monterey-mly33hn-a/p/itm1234"
    },
    {
        "name": "Kingston RAM",
        "url": "https://www.amazon.in/Kingston-FURY-Beast-5600MT-Desktop/dp/B0BHJFQFH7"
    },
    {
        "name": "Redmi Note 13 Pro",
        "url": "https://www.flipkart.com/redmi-note-13-pro-5g-fusion-purple-128-gb/p/itmfcd3f85484d35"
    }
]

print("=" * 60)
print("TESTING BROWSER SCRAPER WITH MULTIPLE PRODUCTS")
print("=" * 60)

for product in test_products:
    print(f"\n📱 Testing: {product['name']}")
    print("-" * 40)
    
    try:
        df = fetch_pricebefore_browser(product['url'], product['name'])
        if not df.empty:
            min_price = df['y'].min()
            max_price = df['y'].max()
            avg_price = df['y'].mean()
            print(f"   ✅ SUCCESS: {len(df)} data points")
            print(f"   Prices: ₹{min_price:,.0f} - ₹{max_price:,.0f} (avg: ₹{avg_price:,.0f})")
        else:
            print(f"   ❌ NO DATA FOUND")
    except Exception as e:
        print(f"   ❌ ERROR: {e}")

print("\n" + "=" * 60)
print("TESTING COMPLETE")
print("=" * 60)
