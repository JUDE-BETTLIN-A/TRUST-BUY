import requests
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
import urllib.parse
import re
import json

def test_scrape(product_url):
    print(f"Testing direct web scraping for: {product_url}")
    
    # Use cloudscraper to bypass Cloudflare
    import cloudscraper
    scraper = cloudscraper.create_scraper()
    
    # Clean URL to get search query
    asin = None
    # 1. Try Amazon ASIN
    match = re.search(r'/(?:dp|gp/product)/([A-Z0-9]{10})', product_url)
    if match:
        asin = match.group(1)
        print(f"Extracted ASIN: {asin}")
    
    # 2. Try Flipkart PID
    if not asin:
        match_fk = re.search(r'pid=([A-Z0-9]+)', product_url)
        if match_fk:
            asin = match_fk.group(1)
            print(f"Extracted Flipkart PID: {asin}")

    query = asin if asin else product_url
    
    # If using full URL, it might be too long/complex for search. 
    # For Flipkart, just using the PID is usually best on tracking sites.
    
    search_url = f"https://pricehistoryapp.com/search?q={urllib.parse.quote(query)}"
    
    print(f"Searching: {search_url}...")
    
    try:
        resp = scraper.get(search_url)
        print(f"Search Status: {resp.status_code}")
        
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        # Debug: Save headers and content
        with open("debug_search.html", "w", encoding="utf-8") as f:
            f.write(resp.text)
            
        print("Saved debug_search.html")
        
        # Try to find product link - refined for Next.js structure
        # Often it's in a grid.
        link = soup.select_one('a[href*="/product/"]')
        
        # Fallback: Try to find ANY link that looks like a result
        if not link:
            # Maybe it's inside a div with class 'p-2' or similar?
            # Let's look for known structure from debug log (which we saw earlier was Next.js)
            # Search Results for B0CHX2F5QT - Price History
            pass
            
        if not link:
            print("❌ No product link found in search results.")
            
            # LAST RESORT: DIRECT URL CONSTRUCTION
            # Sometimes PH App uses /product/ASIN pattern? No, they use slug.
            # But maybe we can try scraping Google for the PriceHistory link?
            # "site:pricehistoryapp.com B0CHX2F5QT"
            print("🔄 Attempting Google Fallback...")
            try:
                google_search = f"https://www.google.com/search?q=site:pricehistoryapp.com+{query}"
                g_resp = scraper.get(google_search)
                g_soup = BeautifulSoup(g_resp.text, 'html.parser')
                # Find first link to pricehistoryapp
                for a in g_soup.find_all('a', href=True):
                    if "pricehistoryapp.com/product/" in a['href']:
                        link = a
                        print("✅ Found link via Google!")
                        break
            except:
                pass

        if not link:
             return
            
        product_page = "https://pricehistoryapp.com" + link['href']
        print(f"✅ Found Product Page: {product_page}")
        
        # 2. Scrape Product Page
        resp_prod = scraper.get(product_page)
        print(f"Product Page Status: {resp_prod.status_code}")
        
        if resp_prod.status_code == 200:
             # Look for Chart Data
             if "Highcharts.chart" in resp_prod.text:
                 print("✅ Found Highcharts data in source!")
             else:
                 print("⚠️ Highcharts data not immediately visible in text.")
                 
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # Test with a known product
    test_scrape("https://www.flipkart.com/apple-iphone-15-black-128-gb/p/itm6ac6485515ae4?pid=MOBGTAGPTB3VS24W&lid=LSTMOBGTAGPTB3VS24WKFODHL&marketplace=FLIPKART&store=tyy%2F4io&spotlightTagId=default_FkPickId_tyy%2F4io&srno=b_1_1&otracker=browse&fm=organic&iid=9e9e0197-8125-4dd8-83a1-9b6ba0b19ec3.MOBGTAGPTB3VS24W.SEARCH&ppt=browse&ppn=browse&ssid=hjqa5syc4g0000001769804431855")
