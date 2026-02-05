import requests
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
import pandas as pd
from extra_scrapers import fetch_pricehistoryapp_robust, fetch_spendmitra_data
import re
import json
from datetime import datetime
import urllib.parse

def extract_asin(url):
    if not url: return None
    # Support Amazon ASIN extraction
    match = re.search(r'/(?:dp|gp/product)/([A-Z0-9]{10})', url)
    if match:
        return match.group(1)
    return None

def fetch_pricehistoryapp_data(product_url, product_name=None):
    """
    Attempts to scrape historical data from pricehistoryapp.com
    """
    # Use cloudscraper to bypass Cloudflare
    import cloudscraper
    sess = cloudscraper.create_scraper()
    
    try:
        # EXTRACT ASIN/PID (The "Real" Product IDs)
        # Amazon ASIN
        asin = extract_asin(product_url)
        
        # Flipkart PID
        flipkart_pid = None
        if product_url:
            # Try 'pid=' pattern with stricter boundary
            pid_match = re.search(r'[?&]pid=([A-Z0-9]{16})', product_url)
            if pid_match:
                flipkart_pid = pid_match.group(1)
        
        target_id = asin or flipkart_pid
        page_url = None

        # 1. DIRECT URL STRATEGY (Most Accurate)
        # PriceHistoryApp usually uses the ID in the URL.
        if target_id:
            print(f"Scraper: Identified Product ID: {target_id}")
            # Try multiple URL formats for PriceHistoryApp
            # NOTE: PriceHistoryApp uses /p/ format NOT /product/
            test_urls = [
                f"https://pricehistoryapp.com/p/{target_id}",
                f"https://pricehistoryapp.com/p/{target_id.lower()}"
            ]
            
            for test_url in test_urls:
                try:
                    head = sess.head(test_url, timeout=5)
                    if head.status_code == 200:
                        page_url = test_url
                        print(f"Scraper: Direct URL valid: {page_url}")
                        break
                    elif head.status_code in [301, 302]:
                        page_url = head.headers.get('Location') or test_url
                        break
                except:
                    pass

        # 2. SEARCH STRATEGY (Fallback)
        if not page_url:
            print("Scraper: ID lookup failed. Trying web search...")
            search_queries = []
            if target_id: search_queries.append(target_id)
            if product_name: 
                # Very clean name for search
                clean = re.sub(r'[^a-zA-Z0-9\s]', '', product_name).split()
                search_queries.append(' '.join(clean[:5])) # First 5 words

            from duckduckgo_search import DDGS
            for q in search_queries:
                if page_url: break
                try:
                    with DDGS() as ddgs:
                        # Search for site-specific results
                        results = list(ddgs.text(f"site:pricehistoryapp.com {q}", max_results=2))
                        for r in results:
                            href = r.get('href', '')
                            if '/product/' in href or '/p/' in href:
                                page_url = href
                                print(f"Scraper: Found via Search: {page_url}")
                                break
                except Exception as e:
                    print(f"Scraper: Search failed: {e}")

        if not page_url:
            print("Scraper: Could not find external history page via any method.")
            return pd.DataFrame()
            
        # 3. Product Page Fetching ("page_url" is now set)
        print(f"Scraper: Fetching {page_url}...")
        
        prod_resp = sess.get(page_url, timeout=15)
        
        # 3. Intelligent Data Extraction
        # Even if we can't get the JSON Chart (which is often protected),
        # we can get the TEXT summary on the page: "Lowest Price: ₹X", "Highest: ₹Y"
        # We can uses these 3 anchor points (Current, Low, High) to build a valid dataset for Prophet.
        
        text_content = prod_resp.text.lower()
        
        # Helper to extract price
        def extract_price(pattern):
            match = re.search(pattern, text_content)
            if match:
                 raw = match.group(1).replace(',', '')
                 return float(raw)
            return None
            
        # Regex for standard PH format
        low_price = extract_price(r'lowest.*?₹\s?([\d,]+)')
        high_price = extract_price(r'highest.*?₹\s?([\d,]+)')
        curr_price = extract_price(r'current.*?₹\s?([\d,]+)')
        
        if not curr_price:
             curr_price = extract_price(r'price.*?₹\s?([\d,]+)')

        if low_price and high_price:
            print(f"Scraper Success: Low={low_price}, High={high_price}, Curr={curr_price}")
            
            # 4. ADVANCED: Try to extract the ACTUAL JSON Chart Data
            # This is the "Best Logic" to get real history without API
            try:
                # Common Next.js/React pattern
                next_data_match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', prod_resp.text)
                if next_data_match:
                     print("Scraper: Found __NEXT_DATA__, attempting to parse history...")
                     # If we could parse the schema, we would do it here. 
                     # For now, just logging it exists.
                
                # Look for Chart.js / Highcharts data variable
                # "data": [ ... ] pattern inside script
                # Often in these sites: "data":[[1678234234000, 399],[...]]
                chart_match = re.search(r'data\s*:\s*(\[\[\d+,\d+.*?\]\])', prod_resp.text)
                if chart_match:
                    raw_array = chart_match.group(1)
                    # This is often [timestamp, price] array
                    print("Scraper: Found Chart Data Array!")
                    data_points = json.loads(raw_array)
                    
                    real_history = []
                    for point in data_points:
                        # point[0] is usually timestamp (ms), point[1] is price
                        if isinstance(point, list) and len(point) >= 2:
                             ts = point[0]
                             price = point[1]
                             # Handle potential seconds vs milliseconds
                             if ts > 1000000000000: # ms
                                 ts = ts / 1000.0
                                 
                             dt = datetime.fromtimestamp(ts)
                             real_history.append({'ds': dt, 'y': price})
                    
                    if real_history:
                        print(f"✅ Success! Extracted {len(real_history)} real data points from chart source.")
                        return pd.DataFrame(real_history)

            except Exception as e:
                print(f"Scraper: Advanced extraction failed: {e}")

            # If we are here, we have Low/High stats but no Chart Data.
            # Returning empty DataFrame as per "100% Legitimate" rule.
            print("Scraper: Could not extract specific time-series data. Returning empty.")
            return pd.DataFrame()

        print("Scraper: Page reached, but could not parse price summary.")
        return pd.DataFrame() 
        
    except Exception as e:
        print(f"Scraper Error: {e}")
        
    return pd.DataFrame()

def fetch_pricebefore_data(product_name):
    """
    Scrape real history from PriceBefore.com (Secondary Source)
    """
    if not product_name: return pd.DataFrame()
    
    import cloudscraper
    sess = cloudscraper.create_scraper()
    
    try:
        print(f"Scraper: Trying PriceBefore.com for '{product_name}'...")
        
        # CLEANUP NAME: The input often contains garbage like "Ratings", "Reviews", "ROM", etc.
        # "Apple iPhone 13 (Starlight, 128 GB)4.62,95,119 Ratings..." -> "Apple iPhone 13"
        clean_name = product_name
        
        # 1. Cut at common separators
        for sep in ['(', '[', 'Ratings', 'Reviews', 'ROM', 'RAM', ' - ', '  ']:
            if sep in clean_name:
                clean_name = clean_name.split(sep)[0]
                
        # 2. Cut at numeric patterns that look like ratings/stats if not part of model
        # e.g. "4.62,95,119"
        clean_name = re.sub(r'\d+[.,]\d+.*', '', clean_name)
        
        clean_name = clean_name.strip()
        print(f"Scraper: Cleaned name: '{clean_name}' (Original: '{product_name[:30]}...')")
        
        # STEP 0: Try direct URL construction first (search often misses older products)
        # Convert "Apple iPhone 13" to "apple-iphone-13"
        slug_name = clean_name.lower()
        # Remove parenthetical content but keep important parts
        slug_name = re.sub(r'\([^)]*\)', '', slug_name)
        # Keep only alphanumeric and spaces
        slug_name = re.sub(r'[^a-z0-9\s]', '', slug_name)
        # Convert spaces to dashes
        slug_name = '-'.join(slug_name.split())
        
        direct_urls = [
            f"https://www.pricebefore.com/{slug_name}/",
            f"https://www.pricebefore.com/{slug_name.replace('-gb', 'gb')}/",
        ]
        
        for direct_url in direct_urls:
            try:
                print(f"   Trying direct URL: {direct_url}")
                resp = sess.get(direct_url, timeout=8)
                if resp.status_code == 200 and 'chartData' in resp.text:
                    print(f"✅ Direct URL success!")
                    # Parse the chart data
                    chart_match = re.search(r'chartData\s*=\s*(\[\[.*?\]\])', resp.text, re.DOTALL)
                    if chart_match:
                        chart_data = json.loads(chart_match.group(1))
                        if chart_data and len(chart_data) > 5:
                            dates = [datetime.fromtimestamp(x[0]/1000).strftime('%Y-%m-%d') for x in chart_data]
                            prices = [x[1] for x in chart_data]
                            df = pd.DataFrame({'ds': dates, 'y': prices})
                            df['ds'] = pd.to_datetime(df['ds'])
                            print(f"✅ PriceBefore Direct: Extracted {len(df)} real points!")
                            return df
            except Exception as e:
                continue
        
        # STEP 1: Fall back to search
        search_url = f"https://www.pricebefore.com/search/?q={urllib.parse.quote(product_name)}"
        resp = sess.get(search_url, timeout=10)
        
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        # Iterate through search results to find the best match
        # Selector: .product-grid .item .unit
        items = soup.select('.product-grid .item .unit')
        
        best_link = None
        best_ratio = 0.0
        
        import difflib
        
        print(f"Scraper: Found {len(items)} search results on PriceBefore.")
        
        for item in items:
            link_tag = item.select_one('.img-wrap a.link')
            title_tag = item.select_one('.txt-wrap .title a')
            
            if not link_tag or not title_tag: continue
            
            item_title = title_tag.get_text(strip=True).lower()
            item_url = link_tag['href']
            
            # Simple fuzzy match score
            ratio = difflib.SequenceMatcher(None, product_name.lower(), item_title).ratio()
            
            # Check for token overlap with punctuation cleaning
            # Use regex to split by non-alphanumeric characters to handle "(128GB)" -> "128gb"
            def get_clean_tokens(text):
                return set(part for part in re.split(r'[^a-zA-Z0-9]', text.lower()) if part)

            query_tokens = get_clean_tokens(product_name)
            title_tokens = get_clean_tokens(item_title)
            
            overlap = len(query_tokens.intersection(title_tokens)) / len(query_tokens) if query_tokens else 0
            
            # Extract numbers from tokens
            query_numbers = {t for t in query_tokens if any(c.isdigit() for c in t)}
            
            # PRODUCT CATEGORY KEYWORDS - These must match if present in query
            category_keywords = {
                'ddr5', 'ddr4', 'ddr3', 'ram', 'memory', 'dimm', 'sodimm',
                'ssd', 'hdd', 'nvme', 'm2',
                'pendrive', 'flashdrive', 'usb',
                'gpu', 'graphics', 'rtx', 'gtx',
                'phone', 'smartphone', 'mobile',
                'laptop', 'notebook',
                'tv', 'television', 'monitor',
                'headphone', 'earphone', 'earbuds', 'tws',
                'watch', 'smartwatch',
                'tablet', 'ipad'
            }
            
            query_categories = query_tokens.intersection(category_keywords)
            title_categories = title_tokens.intersection(category_keywords)
            
            # If query has category keywords, title MUST have at least one matching
            if query_categories and not query_categories.intersection(title_categories):
                # Special case: 'memory' can match 'ram' and vice versa
                memory_synonyms = {'memory', 'ram', 'ddr5', 'ddr4', 'dimm'}
                if not (query_categories.intersection(memory_synonyms) and title_categories.intersection(memory_synonyms)):
                    print(f"   - Match candidate: '{item_title[:50]}...' (REJECTED: Category mismatch {query_categories} vs {title_categories})")
                    continue
            
            # Check if main brand word is present
            brand_words = {'samsung', 'apple', 'iphone', 'oneplus', 'xiaomi', 'redmi', 'realme', 'vivo', 'oppo', 'nokia', 'motorola', 'sony', 'lg', 'hp', 'dell', 'lenovo', 'asus', 'acer', 'msi', 'corsair', 'logitech', 'razer', 'nvidia', 'amd', 'intel', 'jbl', 'boat', 'bose', 'sennheiser', 'nike', 'adidas', 'puma', 'kingston', 'crucial', 'gskill', 'adata'}
            query_brand = query_tokens.intersection(brand_words)
            title_brand = title_tokens.intersection(brand_words)
            
            brand_match = bool(query_brand and query_brand.issubset(title_brand))
            
            # STRICT MODEL NUMBER MATCHING
            # For iPhone 17, Galaxy S23, etc. - the MODEL NUMBER must EXACTLY match
            # "17" should NOT match "16" or "15"
            model_number_rejected = False
            if query_numbers:
                for qn in query_numbers:
                    # Check if this is a likely model number (1-2 digits)
                    if qn.isdigit() and len(qn) <= 2:
                        # This is likely a model number like "17", "23", "5"
                        # Search in original title text (not tokenized) for flexibility
                        # But ensure it's the RIGHT number, not part of another number
                        
                        # Check various patterns: "iphone 13", "iphone13", "(13)", "13 pro"
                        # Match the number with word boundaries or common separators
                        pattern = rf'(?:^|[\s\(\[\-])({qn})(?:[\s\)\]\-,]|$|pro|plus|max|mini|ultra)'
                        if not re.search(pattern, item_title, re.IGNORECASE):
                            # Also try simple substring check as fallback
                            # But make sure "13" doesn't match in "128" or "2013"
                            simple_found = False
                            for tn in title_tokens:
                                if tn == qn:
                                    simple_found = True
                                    break
                            
                            if not simple_found:
                                print(f"   - Match candidate: '{item_title[:50]}...' (REJECTED: Model '{qn}' not found)")
                                model_number_rejected = True
                                break
            
            if model_number_rejected:
                continue
            
            # For numbers - be lenient if we have brand match
            if query_numbers and not brand_match:
                # Still check numbers, but only reject if NONE match
                any_number_found = False
                for qn in query_numbers:
                    if any(qn in tn for tn in title_tokens):
                        any_number_found = True
                        break
                
                if not any_number_found and overlap < 0.5:
                    print(f"   - Match candidate: '{item_title[:50]}...' (REJECTED: No matching numbers)")
                    continue

            print(f"   - Match candidate: '{item_title[:50]}...' (Score: {ratio:.2f}, Overlap: {overlap:.2f}, Brand: {brand_match})")
            
            # Require higher thresholds now that we're being lenient elsewhere
            if ratio > 0.4 or overlap > 0.4 or brand_match:
                if ratio > best_ratio:
                    best_ratio = ratio
                    best_link = item_url
                
        if not best_link:
            print("Scraper: PriceBefore search found no RELEVANT results.")
            return pd.DataFrame()
            
        page_url = best_link
        if not page_url.startswith('http'):
            page_url = f"https://www.pricebefore.com{page_url}"
            
        print(f"Scraper: Selected Best Match Page: {page_url} (Score: {best_ratio:.2f})")
        
        # 2. Extract Data
        prod_resp = sess.get(page_url, timeout=10)
        
        # PriceBefore uses Chart.js with a 'var data = { ... }' object
        # Example: var data = {"dates":["28 Jan 2026",...],"prices":[15097,...],...};
        
        data_match = re.search(r'var data\s*=\s*(\{.*?\});', prod_resp.text)
        
        if data_match:
            raw_json = data_match.group(1)
            try:
                chart_data = json.loads(raw_json)
                
                dates = chart_data.get('dates', [])
                prices = chart_data.get('prices', [])
                
                if len(dates) == len(prices) and len(dates) > 0:
                     history_points = []
                     for i in range(len(dates)):
                         try:
                             # Date format: "28 Jan 2026"
                             d_str = dates[i]
                             p_val = prices[i]
                             
                             dt = datetime.strptime(d_str, "%d %b %Y")
                             history_points.append({'ds': dt, 'y': float(p_val)})
                         except Exception as parse_err:
                             print(f"Scraper: Date parse error '{d_str}': {parse_err}")
                             continue
                             
                     if history_points:
                        print(f"✅ PriceBefore Success: Extracted {len(history_points)} real points!")
                        return pd.DataFrame(history_points)
                        
            except Exception as json_err:
                print(f"Scraper: JSON parse error: {json_err}")

        print("Scraper: PriceBefore page found but no chart data extractable.")
        return pd.DataFrame()

    except Exception as e:
        print(f"Scraper: PriceBefore failed: {e}")
        return pd.DataFrame()

def fetch_camelcamelcamel_data(product_url):
    """
    Scrape from CamelCamelCamel (Amazon price tracker)
    """
    asin = extract_asin(product_url)
    if not asin:
        return pd.DataFrame()
    
    import cloudscraper
    sess = cloudscraper.create_scraper()
    
    try:
        print(f"Scraper: Trying CamelCamelCamel for ASIN: {asin}...")
        # CamelCamelCamel URL pattern
        camel_url = f"https://camelcamelcamel.com/product/{asin}"
        
        resp = sess.get(camel_url, timeout=15)
        
        if resp.status_code != 200:
            print(f"Scraper: CamelCamelCamel returned {resp.status_code}")
            return pd.DataFrame()
        
        # Look for chart data in the page
        # CamelCamelCamel embeds data in JavaScript
        # Pattern: var defined_price_drops = [{...}]
        chart_match = re.search(r'var\s+price_history\s*=\s*(\[.*?\]);', resp.text, re.DOTALL)
        
        if chart_match:
            try:
                data = json.loads(chart_match.group(1))
                history = []
                for point in data:
                    if isinstance(point, dict) and 'date' in point and 'price' in point:
                        dt = datetime.fromtimestamp(point['date'])
                        history.append({'ds': dt, 'y': float(point['price'])})
                    elif isinstance(point, list) and len(point) >= 2:
                        ts = point[0] / 1000 if point[0] > 1e12 else point[0]
                        history.append({'ds': datetime.fromtimestamp(ts), 'y': float(point[1])})
                
                if history:
                    print(f"✅ CamelCamelCamel Success: {len(history)} points!")
                    return pd.DataFrame(history)
            except Exception as e:
                print(f"Scraper: CamelCamelCamel parse error: {e}")
        
        # Alternative: Look for Highcharts series data
        highcharts_match = re.search(r'series:\s*\[\s*\{[^}]*data:\s*(\[\[.*?\]\])', resp.text, re.DOTALL)
        if highcharts_match:
            try:
                data = json.loads(highcharts_match.group(1))
                history = []
                for point in data:
                    if len(point) >= 2:
                        ts = point[0] / 1000 if point[0] > 1e12 else point[0]
                        history.append({'ds': datetime.fromtimestamp(ts), 'y': float(point[1])})
                if history:
                    print(f"✅ CamelCamelCamel Highcharts Success: {len(history)} points!")
                    return pd.DataFrame(history)
            except:
                pass
                
    except Exception as e:
        print(f"Scraper: CamelCamelCamel failed: {e}")
    
    return pd.DataFrame()


def fetch_pricehistory_in_data(product_name):
    """
    Scrape from PriceHistory.in (Indian price tracker)
    """
    if not product_name:
        return pd.DataFrame()
    
    import cloudscraper
    sess = cloudscraper.create_scraper()
    
    try:
        print(f"Scraper: Trying PriceHistory.in for '{product_name}'...")
        
        # Search on PriceHistory.in
        search_url = f"https://pricehistory.in/search?q={urllib.parse.quote(product_name)}"
        resp = sess.get(search_url, timeout=10)
        
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        # Find first product link
        product_link = soup.select_one('a.product-link, .product-item a, .search-result a')
        
        if product_link:
            page_url = product_link.get('href', '')
            if not page_url.startswith('http'):
                page_url = f"https://pricehistory.in{page_url}"
            
            print(f"Scraper: Found PriceHistory.in page: {page_url}")
            
            prod_resp = sess.get(page_url, timeout=10)
            
            # Look for chart data
            data_match = re.search(r'chartData\s*[=:]\s*(\[.*?\])', prod_resp.text, re.DOTALL)
            if data_match:
                try:
                    data = json.loads(data_match.group(1))
                    history = []
                    for point in data:
                        if isinstance(point, dict):
                            dt_str = point.get('date', point.get('x', ''))
                            price = point.get('price', point.get('y', 0))
                            if dt_str and price:
                                try:
                                    dt = datetime.strptime(dt_str, "%Y-%m-%d")
                                except:
                                    dt = datetime.now()
                                history.append({'ds': dt, 'y': float(price)})
                    
                    if history:
                        print(f"✅ PriceHistory.in Success: {len(history)} points!")
                        return pd.DataFrame(history)
                except Exception as e:
                    print(f"Scraper: PriceHistory.in parse error: {e}")
                    
    except Exception as e:
        print(f"Scraper: PriceHistory.in failed: {e}")
    
    return pd.DataFrame()


def fetch_buyhatke_data(product_url, product_name=None):
    """
    Scrape from BuyHatke (Popular Indian price tracker)
    """
    import cloudscraper
    sess = cloudscraper.create_scraper()
    
    try:
        print(f"Scraper: Trying BuyHatke...")
        
        # BuyHatke has an API-like endpoint
        asin = extract_asin(product_url)
        
        if asin:
            # For Amazon products
            api_url = f"https://compare.buyhatke.com/api/product/amazon/{asin}"
        elif product_name:
            # Search endpoint
            api_url = f"https://compare.buyhatke.com/api/search?q={urllib.parse.quote(product_name)}"
        else:
            return pd.DataFrame()
        
        resp = sess.get(api_url, timeout=10)
        
        if resp.status_code == 200:
            try:
                data = resp.json()
                
                # BuyHatke returns price history in 'priceHistory' or 'history' field
                history_data = data.get('priceHistory', data.get('history', []))
                
                if history_data:
                    history = []
                    for point in history_data:
                        if isinstance(point, dict):
                            dt = datetime.fromtimestamp(point.get('timestamp', point.get('date', 0)))
                            price = point.get('price', point.get('value', 0))
                            history.append({'ds': dt, 'y': float(price)})
                        elif isinstance(point, list) and len(point) >= 2:
                            ts = point[0] / 1000 if point[0] > 1e12 else point[0]
                            history.append({'ds': datetime.fromtimestamp(ts), 'y': float(point[1])})
                    
                    if history:
                        print(f"✅ BuyHatke Success: {len(history)} points!")
                        return pd.DataFrame(history)
            except:
                pass
                
    except Exception as e:
        print(f"Scraper: BuyHatke failed: {e}")
    
    return pd.DataFrame()


def fetch_google_shopping_history(product_name):
    """
    Try to get price data from Google Shopping insights
    """
    if not product_name:
        return pd.DataFrame()
    
    import cloudscraper
    sess = cloudscraper.create_scraper()
    
    try:
        print(f"Scraper: Trying Google Shopping for '{product_name}'...")
        
        # Google Shopping search
        search_url = f"https://www.google.com/search?tbm=shop&q={urllib.parse.quote(product_name)}"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        resp = sess.get(search_url, headers=headers, timeout=10)
        
        # Look for price range data that Google sometimes shows
        # Pattern: "Price dropped" or price history hints
        price_match = re.search(r'₹([\d,]+)', resp.text)
        
        if price_match:
            current_price = float(price_match.group(1).replace(',', ''))
            
            # Google doesn't give full history, but we can create anchor points
            # from "typical price" mentions
            typical_match = re.search(r'typical.*?₹([\d,]+)', resp.text.lower())
            low_match = re.search(r'low.*?₹([\d,]+)', resp.text.lower())
            
            # If we find price context, we have SOME real data
            print(f"Scraper: Google Shopping found current price: ₹{current_price}")
            
    except Exception as e:
        print(f"Scraper: Google Shopping failed: {e}")
    
    return pd.DataFrame()


def fetch_external_history(product_url, product_name=None):
    """
    Main entry point for external history - tries ALL sources
    """
    print(f"\n🔍 STARTING COMPREHENSIVE PRICE HISTORY SEARCH")
    print(f"   URL: {product_url}")
    print(f"   Name: {product_name}")
    print("=" * 50)
    
    # 0. TRY BROWSER-BASED SCRAPER FIRST (Playwright - handles JavaScript)
    # This is the most reliable method for JS-rendered sites like PriceHistoryApp
    try:
        from browser_scraper import fetch_pricebefore_browser
        print("🌐 Attempting Browser Scraper (Playwright + PriceBefore)...")
        df = fetch_pricebefore_browser(product_url, product_name)
        if not df.empty:
            print(f"✅ SOURCE 0: Browser Scraper (PriceBefore) returned {len(df)} points!")
            return df
        print("   Browser scraper returned empty, trying fallbacks...")
    except Exception as e:
        print(f"⚠️ Browser scraper failed: {e}, trying fallbacks...")
    
    # 1. Try PriceHistoryApp (cloudscraper fallback)
    df = fetch_pricehistoryapp_robust(product_url, product_name)
    if not df.empty:
        print(f"✅ SOURCE 1: PriceHistoryApp (Robust) returned {len(df)} points")
        return df
        
    # 1b. Try SpendMitra (User Requested)
    df = fetch_spendmitra_data(product_url, product_name)
    if not df.empty:
        print(f"✅ SOURCE 1b: SpendMitra returned {len(df)} points")
        return df
    
    # 2. Try CamelCamelCamel (Amazon)
    if product_url and 'amazon' in product_url.lower():
        df = fetch_camelcamelcamel_data(product_url)
        if not df.empty:
            print(f"✅ SOURCE 2: CamelCamelCamel returned {len(df)} points")
            return df
    
    # 3. Try BuyHatke (Indian tracker)
    df = fetch_buyhatke_data(product_url, product_name)
    if not df.empty:
        print(f"✅ SOURCE 3: BuyHatke returned {len(df)} points")
        return df
    
    # 4. Try PriceBefore (Text search based - RELAXED matching)
    if product_name:
        df = fetch_pricebefore_data(product_name)
        if not df.empty:
            print(f"✅ SOURCE 4: PriceBefore returned {len(df)} points")
            return df
    
    # 5. Try PriceHistory.in
    if product_name:
        df = fetch_pricehistory_in_data(product_name)
        if not df.empty:
            print(f"✅ SOURCE 5: PriceHistory.in returned {len(df)} points")
            return df
    
    # 6. Last resort: Try with simplified product name
    if product_name:
        # Simplify the name (just brand + model)
        simple_name = ' '.join(product_name.split()[:3])
        if simple_name != product_name:
            print(f"Scraper: Trying simplified name: '{simple_name}'")
            df = fetch_pricebefore_data(simple_name)
            if not df.empty:
                print(f"✅ SOURCE 6: PriceBefore (simplified) returned {len(df)} points")
                return df
    
    print("❌ NO DATA FOUND FROM ANY SOURCE")
    return pd.DataFrame()
