import cloudscraper
import re
import json
import pandas as pd
from datetime import datetime, timedelta
from duckduckgo_search import DDGS
from bs4 import BeautifulSoup

def log_debug(msg):
    with open("scraper_debug.log", "a", encoding="utf-8") as f:
        f.write(f"{datetime.now()} - {msg}\n")
    print(msg)

def extract_asin(url):
    if not url: return None
    match = re.search(r'/(?:dp|gp/product)/([A-Z0-9]{10})', url)
    if match: return match.group(1)
    return None

def fetch_pricehistoryapp_robust(product_url, product_name=None):
    """
    Scrapes PriceHistoryApp using direct ID/PID lookup and robust parsing (Nuxt/JSON).
    This mimics the backend logic of bots like PriceAlertAB9Bot/PriceTracker.
    """
    log_debug(f"Scraper(v2): Trying PriceHistoryApp (Robust) for '{product_name}'...")
    
    sess = cloudscraper.create_scraper()
    
    # Create requests session for API calls (used throughout)
    import requests
    s_req = requests.Session()
    s_req.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
    })
    
    try:
        # 1. ID Extraction
        target_id = extract_asin(product_url)
        
        # Flipkart PID extraction
        if not target_id and product_url:
             match = re.search(r'[?&]pid=([A-Z0-9]{16})', product_url)
             if match: target_id = match.group(1)
             
        page_url = None
        if target_id:
            log_debug(f"Scraper(v2): ID {target_id} extracted. Testing valid URLs...")
            
            # PriceHistoryApp uses /p/ format NOT /product/
            for url in [f"https://pricehistoryapp.com/p/{target_id}", f"https://pricehistoryapp.com/p/{target_id.lower()}"]:
                try:
                    log_debug(f"Scraper(v2): Checking {url}...")
                    # Try requests first
                    h = s_req.get(url, timeout=10, allow_redirects=True)
                    log_debug(f"Scraper(v2): Status {h.status_code}, Final URL: {h.url}")
                    
                    # Accept both /p/ and /product/ in final URL (they might redirect)
                    if h.status_code == 200 and ("pricehistoryapp.com/p/" in h.url or "pricehistoryapp.com/product/" in h.url):
                         page_url = h.url
                         log_debug(f"Scraper(v2): Direct URL valid: {page_url}")
                         r = h # Reuse response
                         break
                         
                except Exception as e: 
                    log_debug(f"Scraper(v2): Check failed: {e}")
        
        # 2. Fallback Search (URL & Name)
        if not page_url:
             log_debug("Scraper(v2): Direct ID failed. Attempting Search by URL strategy...")
             
             # STRATEGY A: Send full URL to their search endpoint
             # This mimics pasting the link in their search bar
             if product_url:
                 import urllib.parse
                 encoded_url = urllib.parse.quote(product_url)
                 search_url = f"https://pricehistoryapp.com/search?q={encoded_url}"
                 log_debug(f"Scraper(v2): Submitting URL to search: {search_url}")
                 
                 try:
                     h = s_req.get(search_url, timeout=10, allow_redirects=True)
                     # If they redirect us to the product page (e.g. /p/...), we win
                     if "/p/" in h.url or "/product/" in h.url:
                         page_url = h.url
                         log_debug(f"Scraper(v2): URL Search Redirected to: {page_url}")
                     else:
                         # Sometimes they show a search result page with the link
                         # Look for <a href="..."> that looks like a product
                         soup_search = BeautifulSoup(h.text, "html.parser")
                         # Find first link to /p/ or /product/
                         for a in soup_search.find_all('a', href=True):
                             if "/p/" in a['href'] or "/product/" in a['href']:
                                 page_url = a['href']
                                 if not page_url.startswith('http'):
                                     page_url = "https://pricehistoryapp.com" + page_url
                                 log_debug(f"Scraper(v2): Found link in search results: {page_url}")
                                 break
                 except Exception as e:
                     log_debug(f"Scraper(v2): URL Submit failed: {e}")

             # STRATEGY B: Name Search (Backup)
             if not page_url and product_name:
                 # Smart Name Cleaning
                 simple_name = product_name.split('(')[0].strip()
                 try:
                     with DDGS() as ddgs:
                         res = list(ddgs.text(f"site:pricehistoryapp.com {simple_name}", max_results=1))
                         if res: 
                             page_url = res[0].get('href')
                             log_debug(f"Scraper(v2): Found via Name search: {page_url}")
                 except Exception as e: 
                     log_debug(f"Scraper(v2): Name Search failed: {e}")

        if not page_url: return pd.DataFrame()

        # 3. Fetch & Parse
        log_debug(f"Scraper(v2): Fetching {page_url}")
        r = sess.get(page_url, timeout=15)
        
        # Parse Nuxt or JSON data
        data = None
        m = re.search(r':data="(\[.*?\])"', r.text)
        if m: 
             data = json.loads(m.group(1).replace('&quot;', '"'))
        else:
             # Pattern 1: Standard
             m = re.search(r'priceHistory"?\s*:\s*(\[.*?\])', r.text)
             # Pattern 2: ApexCharts/Canvas
             if not m: m = re.search(r':data="(\[{.*?\}\])"', r.text)
             # Pattern 3: Window prop
             if not m: m = re.search(r'window\.priceHistory\s*=\s*(\[.*?\])', r.text)
             
             if m: data = json.loads(m.group(1))

        if data:
             pts = []
             for p in data:
                 if isinstance(p, dict):
                     d, v = p.get('d') or p.get('date'), p.get('v') or p.get('price')
                     if d and v:
                         try:
                             dt = None
                             for f in ["%d %b %Y", "%Y-%m-%d", "%Y-%m-%dT%H:%M:%S.%fZ"]:
                                 try: dt = datetime.strptime(d, f); break
                                 except: pass
                             if dt: pts.append({'ds': dt, 'y': float(v)})
                         except: pass
                 elif isinstance(p, list) and len(p)>=2:
                     # Handle millis or seconds
                     ts = p[0]
                     if ts > 1000000000000: ts /= 1000
                     pts.append({'ds': datetime.fromtimestamp(ts), 'y': float(p[1])})
             
             if pts:
                 log_debug(f"✅ PriceHistoryApp(v2): {len(pts)} points found via JSON!")
                 return pd.DataFrame(pts)
                 
        # NOTE: We intentionally DO NOT fallback to synthesizing data from summary stats.
        # The old approach would scrape random prices (EMI, accessories, etc.) and create 
        # fake history, resulting in absurd graphs (e.g. iPhone at ₹1,783).
        # Only return REAL scraped time-series data.
        log_debug("Scraper(v2): No valid time-series data found. Returning empty.")
        
    except Exception as e:
        log_debug(f"Scraper(v2) Error: {e}")
        
    return pd.DataFrame()

def fetch_spendmitra_data(product_url, product_name=None):
    """
    Scrape SpendMitra.com by submitting URL
    """
    log_debug(f"Scraper(v2): Trying SpendMitra for '{product_name}'...")
    sess = cloudscraper.create_scraper()
    
    # Needs BeautifulSoup for finding the link
    from bs4 import BeautifulSoup
    
    try:
        page_url = None
        
        # STRATEGY: Submit URL to SpendMitra Search
        if product_url:
            import urllib.parse
            encoded_url = urllib.parse.quote(product_url)
            # SpendMitra search pattern (guessed, usually ?s=URL or similar)
            # But usually generic search bar: https://spendmitra.com/?s=...
            # The user image suggests a main page. We'll try generic search endpoint first.
            search_url = f"https://spendmitra.com/?s={encoded_url}&post_type=product"
            
            log_debug(f"Scraper(v2): SpendMitra Search: {search_url}")
            r_search = sess.get(search_url, timeout=10)
            
            # Find the product link in results
            soup = BeautifulSoup(r_search.text, "html.parser")
            # Look for links that contain 'price-history'
            for a in soup.find_all('a', href=True):
                 if "price-history" in a['href']:
                     page_url = a['href']
                     log_debug(f"Scraper(v2): Found SpendMitra Page: {page_url}")
                     break
        
        if not page_url: 
            log_debug("Scraper(v2): SpendMitra URL search failed. Trying generic name search...")
            # Fallback to name search via DDGS
            search_query = product_name.split('(')[0].strip()
            try:
                with DDGS() as ddgs:
                    res = list(ddgs.text(f"site:spendmitra.com {search_query}", max_results=1))
                    if res: page_url = res[0].get('href')
            except: pass

        if not page_url: return pd.DataFrame()
        
        log_debug(f"Scraper(v2): Fetching SpendMitra: {page_url}")
        r = sess.get(page_url, timeout=10)
        
        # SpendMitra Parsing
        dates = re.findall(r'"(\d{2}-[A-Za-z]{3}-\d{4})"', r.text)
        prices_match = re.search(r'data:\s*\[([\d,]+(?:,\s*[\d,]+)*)\]', r.text)
        
        if dates and prices_match:
             prices = [float(p.strip()) for p in prices_match.group(1).split(',')]
             if len(dates) == len(prices):
                 pts = []
                 for i in range(len(dates)):
                     try:
                         dt = datetime.strptime(dates[i], "%d-%b-%Y")
                         pts.append({'ds': dt, 'y': prices[i]})
                     except: pass
                 
                 if pts:
                     log_debug(f"✅ SpendMitra: {len(pts)} points found!")
                     return pd.DataFrame(pts)
                     
    except Exception as e:
        log_debug(f"Scraper(v2) SpendMitra Error: {e}")
        
    return pd.DataFrame()

