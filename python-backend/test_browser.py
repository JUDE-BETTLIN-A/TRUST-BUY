import asyncio
from playwright.async_api import async_playwright
import re
import urllib.parse

async def debug_search():
    # Try just "iphone 13" without the storage
    search_terms = [
        "Apple iPhone 13",
        "iPhone 13 128GB",
        "iphone 13 flipkart",
        "apple iphone 13 starlight"
    ]
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        for term in search_terms:
            search_url = f"https://www.pricebefore.com/search/?q={urllib.parse.quote(term)}"
            print(f"\n=== Searching: {term} ===")
            
            await page.goto(search_url, timeout=30000)
            await page.wait_for_load_state('networkidle', timeout=15000)
            await asyncio.sleep(2)
            
            # Get all anchor tags with iphone in href
            links = await page.query_selector_all('a')
            
            iphone_13_found = False
            for link in links:
                href = await link.get_attribute('href')
                if href and 'iphone-13' in href.lower():
                    text = await link.inner_text()
                    print(f"  ✅ FOUND: {text.strip()[:50]}")
                    print(f"     URL: {href}")
                    iphone_13_found = True
                    break
            
            if not iphone_13_found:
                # Check if there's ANY iphone result
                for link in links:
                    href = await link.get_attribute('href')
                    text = await link.inner_text()
                    if href and 'iphone' in href.lower() and len(text.strip()) > 10:
                        print(f"  ❌ Other: {text.strip()[:50]}")
                        break
                else:
                    print("  No iPhone results")
        
        await browser.close()

asyncio.run(debug_search())
