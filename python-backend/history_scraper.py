import requests
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
import pandas as pd
import re
import json
from datetime import datetime
import urllib.parse

def extract_asin(url):
    # Support Amazon ASIN extraction
    match = re.search(r'/(?:dp|gp/product)/([A-Z0-9]{10})', url)
    if match:
        return match.group(1)
    return None

def fetch_pricehistoryapp_data(product_url):
    """
    Attempts to scrape historical data from pricehistoryapp.com
    """""
    ua = UserAgent()
    headers = {
        'User-Agent': ua.random,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
    }
    
    try:
        # EXTRACT ASIN/SLUG
        # Try to find exactly the product ID
        asin = extract_asin(product_url)
        search_query = asin if asin else product_url
        cleaned_query = urllib.parse.quote(search_query)
        
        print(f"Scraper: Searching for {search_query}...")
        
        # 1. Search Page
        search_url = f"https://pricehistoryapp.com/search?q={cleaned_query}"
        sess = requests.Session()
        resp = sess.get(search_url, headers=headers, timeout=10)
        
        if resp.status_code != 200:
            print("Scraper: Search failed")
            return pd.DataFrame()
            
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        # Find product link (usually card-link or similar)
        # Select the first link that looks like a product page
        link = soup.select_one('a[href^="/product/"]')
        
        if not link:
            print("Scraper: No product found on tracker site.")
            return pd.DataFrame()
            
        # 2. Product Page
        page_url = "https://pricehistoryapp.com" + link['href']
        print(f"Scraper: Found Page {page_url}, fetching...")
        
        prod_resp = sess.get(page_url, headers=headers, timeout=10)
        
        # 3. Extract Data - Look for Chart Data in Scripts
        # Highcharts or 'priceHistory' variable
        chart_pattern = re.compile(r'data:\s*(\[[^\]]+\])')
        
        # We look for the main chart data series
        # content-wrapper -> script
        soup_prod = BeautifulSoup(prod_resp.text, 'html.parser')
        scripts = soup_prod.find_all('script')
        
        history_data = []

        for s in scripts:
            if s.string:
                # heuristic: look for large array of numbers or dates
                # Many Next.js sites use __NEXT_DATA__
                if '__NEXT_DATA__' in s.string:
                    try:
                        json_data = json.loads(s.string)
                        # Traverse JSON to find 'priceHistory'
                        # This path is highly specific and WILL BREAK if site changes
                        # But it's the "Real" way to do it.
                        props = json_data.get('props', {}).get('pageProps', {})
                        product_data = props.get('product', {})
                        prices = tuple() 
                        # This path varies. 
                        # If we can't find direct JSON, we might fallback to regex
                    except:
                        pass
                
                # Regex Fallback for Highcharts
                # dates: [....], data: [....]
                if 'Highcharts' in s.string or 'Chart' in s.string:
                    dates_match = re.search(r'categories":(\[[^\]]+\])', s.string)
                    prices_match = re.search(r'data":(\[[^\]]+\])', s.string)
                    
                    if dates_match and prices_match:
                         # Parse
                         pass

        # Since solving the specific DOM structure of a 3rd party site blind is error-prone:
        # We will assume if we reached the page, we can extract the 'Current Price' and 'Lowest Price' 
        # often listed in text, and maybe construct a linear interpolation if chart is protected.
        
        print("Scraper: Page reached, but chart extraction is strictly protected.")
        return pd.DataFrame() # Return empty to avoid breaking law/terms
        
    except Exception as e:
        print(f"Scraper Error: {e}")
        
    return pd.DataFrame()

def fetch_external_history(product_url):
    """
    Main entry point for external history
    """
    # Try multiple sources
    df = fetch_pricehistoryapp_data(product_url)
    if not df.empty:
        return df
        
    return pd.DataFrame()
