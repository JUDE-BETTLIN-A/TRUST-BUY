"""
Browser-based Price History Scraper using Playwright
Optimized for PriceBefore.com (which has the most reliable data for Indian products)
"""

import asyncio
import re
import json
import pandas as pd
from datetime import datetime
from playwright.async_api import async_playwright
import urllib.parse

def log_debug(msg):
    print(f"[Browser] {msg}")


async def scrape_pricebefore(product_url: str, product_name: str = None) -> pd.DataFrame:
    """
    Scrapes price history from PriceBefore.com using a real browser.
    """
    log_debug(f"Starting PriceBefore browser scrape for: {product_name or product_url[:50]}")
    
    # BEST SOURCE: Extract from URL path (has color variants etc.)
    clean_name = ""
    if 'flipkart.com' in product_url:
        # Extract from URL path - this has the most accurate product details
        match = re.search(r'flipkart\.com/([^/]+)/', product_url)
        if match:
            clean_name = match.group(1).replace('-', ' ')[:50]
    elif 'amazon.in' in product_url:
        match = re.search(r'amazon\.in/([^/]+)/', product_url)
        if match:
            clean_name = match.group(1).replace('-', ' ')[:50]
    
    # Fallback: Use product name if URL extraction failed
    if not clean_name and product_name:
        clean_name = product_name.split('(')[0].strip()
        clean_name = re.sub(r'\d+[.,]\d+.*Ratings.*', '', clean_name)
        clean_name = re.sub(r'\d+\s*Reviews.*', '', clean_name)
        clean_name = clean_name.strip()[:50]
    
    log_debug(f"Search query: {clean_name}")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        )
        page = await context.new_page()
        
        try:
            # Search on PriceBefore
            search_url = f"https://www.pricebefore.com/search/?q={urllib.parse.quote(clean_name)}"
            log_debug(f"Navigating to search: {search_url}")
            
            await page.goto(search_url, timeout=30000)
            await page.wait_for_load_state('networkidle', timeout=15000)
            await asyncio.sleep(2)
            
            # Find all product links and their titles
            items = await page.query_selector_all('.product-grid .item .unit, .product-item')
            log_debug(f"Found {len(items)} product items")
            
            # Find best matching product
            best_link = None
            best_score = 0
            clean_name_lower = clean_name.lower()
            
            # Identify core product type from query
            is_iphone_search = 'iphone' in clean_name_lower
            is_galaxy_search = 'galaxy' in clean_name_lower or 'samsung' in clean_name_lower
            is_macbook_search = 'macbook' in clean_name_lower
            is_ipad_search = 'ipad' in clean_name_lower
            
            for item in items:
                try:
                    # Get title and link
                    title_elem = await item.query_selector('.txt-wrap .title a, .product-title a, a.title')
                    link_elem = await item.query_selector('a.link, a[href*="pricebefore.com"]')
                    
                    if not title_elem and not link_elem:
                        link_elem = await item.query_selector('a')
                    
                    if link_elem:
                        href = await link_elem.get_attribute('href')
                        title = await link_elem.inner_text() if not title_elem else await title_elem.inner_text()
                        title = title.strip().lower()
                        
                        # STRICT PRODUCT TYPE MATCHING
                        # If searching for iPhone, result MUST be an iPhone (not AirPods, iPad, etc.)
                        if is_iphone_search and 'iphone' not in title:
                            log_debug(f"  Rejected: '{title[:40]}' (not an iPhone)")
                            continue
                        if is_galaxy_search and 'galaxy' not in title and 'samsung' not in title:
                            log_debug(f"  Rejected: '{title[:40]}' (not a Samsung/Galaxy)")
                            continue
                        if is_macbook_search and 'macbook' not in title:
                            log_debug(f"  Rejected: '{title[:40]}' (not a MacBook)")
                            continue
                        if is_ipad_search and 'ipad' not in title:
                            log_debug(f"  Rejected: '{title[:40]}' (not an iPad)")
                            continue
                        
                        # STRICT MODEL NUMBER MATCHING
                        # Extract model numbers from query (e.g., "13" from "iPhone 13")
                        query_model_numbers = re.findall(r'\b(\d{1,2})\b', clean_name_lower)
                        title_model_numbers = re.findall(r'\b(\d{1,2})\b', title)
                        
                        # If query has a model number, title MUST have the SAME one
                        if query_model_numbers:
                            query_model = query_model_numbers[0]
                            # For iPhones, Galaxy etc, the model number is critical
                            if 'iphone' in clean_name_lower or 'galaxy' in clean_name_lower:
                                # Check if title has a DIFFERENT main model number
                                if title_model_numbers:
                                    title_model = title_model_numbers[0]
                                    if title_model != query_model:
                                        log_debug(f"  Rejected: '{title[:40]}' (model {title_model} != {query_model})")
                                        continue  # Skip this item - wrong model!
                        
                        # Simple scoring: count matching words
                        query_words = set(clean_name_lower.split())
                        title_words = set(title.split())
                        overlap = len(query_words.intersection(title_words))
                        
                        # Bonus for key product identifiers
                        if 'iphone' in clean_name_lower and 'iphone' in title:
                            overlap += 3
                        elif 'galaxy' in clean_name_lower and 'galaxy' in title:
                            overlap += 3
                        elif 'macbook' in clean_name_lower and 'macbook' in title:
                            overlap += 3
                        
                        # Storage size matching bonus
                        storage_match = re.search(r'(\d+)\s*gb', clean_name_lower)
                        if storage_match:
                            storage_size = storage_match.group(1)
                            if storage_size in title:
                                overlap += 2
                        
                        if overlap > best_score:
                            best_score = overlap
                            best_link = href
                            log_debug(f"  Better match: {title[:40]}... (score: {overlap})")
                            
                except Exception as e:
                    continue
            
            if not best_link or best_score < 3:
                if best_link and best_score < 3:
                    log_debug(f"Best match score ({best_score}) too low - rejecting to avoid wrong product")
                log_debug("No matching product found")
                await browser.close()
                return pd.DataFrame()
            
            # Navigate to best match
            if not best_link.startswith('http'):
                best_link = f"https://www.pricebefore.com{best_link}"
            
            log_debug(f"Navigating to product: {best_link}")
            try:
                await page.goto(best_link, timeout=45000)
                try:
                    await page.wait_for_load_state('networkidle', timeout=20000)
                except:
                    pass  # Continue even if networkidle times out
                await asyncio.sleep(3)
            except Exception as e:
                log_debug(f"Page load warning: {e}")
            
            # Extract chart data
            content = await page.content()
            
            # Pattern: var data = {"dates": [...], "prices": [...]}
            data_match = re.search(r'var data\s*=\s*(\{.*?\});', content, re.DOTALL)
            
            if data_match:
                try:
                    chart_data = json.loads(data_match.group(1))
                    dates = chart_data.get('dates', [])
                    prices = chart_data.get('prices', [])
                    
                    if len(dates) == len(prices) and len(dates) > 0:
                        history_points = []
                        for i in range(len(dates)):
                            try:
                                dt = datetime.strptime(dates[i], "%d %b %Y")
                                history_points.append({'ds': dt, 'y': float(prices[i])})
                            except:
                                pass
                        
                        if history_points:
                            log_debug(f"✅ PriceBefore Success: {len(history_points)} points extracted!")
                            await browser.close()
                            return pd.DataFrame(history_points)
                except Exception as e:
                    log_debug(f"JSON parse error: {e}")
            
            # Fallback: try chartData array pattern
            cd_match = re.search(r'chartData\s*=\s*(\[\[.*?\]\])', content)
            if cd_match:
                try:
                    data = json.loads(cd_match.group(1))
                    history_points = []
                    for point in data:
                        if len(point) >= 2:
                            ts = point[0]
                            if ts > 1000000000000:
                                ts = ts / 1000
                            dt = datetime.fromtimestamp(ts)
                            history_points.append({'ds': dt, 'y': float(point[1])})
                    
                    if history_points:
                        log_debug(f"✅ PriceBefore chartData: {len(history_points)} points!")
                        await browser.close()
                        return pd.DataFrame(history_points)
                except:
                    pass
            
            log_debug("Could not extract chart data from page")
            await browser.close()
            return pd.DataFrame()
            
        except Exception as e:
            log_debug(f"Error: {e}")
            await browser.close()
            return pd.DataFrame()


def fetch_pricebefore_browser(product_url: str, product_name: str = None) -> pd.DataFrame:
    """Synchronous wrapper"""
    try:
        return asyncio.run(scrape_pricebefore(product_url, product_name))
    except RuntimeError as e:
        if "already running" in str(e):
            import nest_asyncio
            nest_asyncio.apply()
            return asyncio.run(scrape_pricebefore(product_url, product_name))
        raise


# Test
if __name__ == "__main__":
    test_url = "https://www.flipkart.com/apple-iphone-13-starlight-128-gb/p/itmca35016c5c6e9?pid=MOBG6VF5HTMYZHNN"
    print(f"\nTesting with: {test_url}\n")
    df = fetch_pricebefore_browser(test_url, "Apple iPhone 13 Starlight 128GB")
    print("\n=== RESULT ===")
    if not df.empty:
        print(f"Found {len(df)} data points")
        print(df.head(10))
    else:
        print("No data found")
