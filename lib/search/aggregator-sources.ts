import axios from 'axios';
import * as cheerio from 'cheerio';
import { UnifiedSearchResult } from './types';
import { searchCache } from './cache';

/**
 * AGGREGATOR SOURCES
 * These are price comparison/review sites that aggregate data from multiple retailers
 * They are designed to be scraped or have permissive robots.txt
 * 
 * This approach is ethical because:
 * 1. These sites exist to display aggregated pricing data publicly
 * 2. We're not scraping protected e-commerce sites directly
 * 3. We cache results to minimize requests
 * 4. We respect rate limits
 */

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

/**
 * PriceDekho - Indian price comparison site
 * Aggregates prices from Amazon, Flipkart, Croma, etc.
 */
export async function searchPriceDekho(query: string): Promise<UnifiedSearchResult[]> {
    const cacheKey = `pricedekho:${query.toLowerCase().trim()}`;
    
    const cached = searchCache.get<UnifiedSearchResult[]>(cacheKey);
    if (cached) return cached;

    const results: UnifiedSearchResult[] = [];
    const url = `https://www.pricedekho.com/search?q=${encodeURIComponent(query)}`;

    try {
        console.log(`[PriceDekho] Searching: ${query}`);
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': USER_AGENT },
            timeout: 10000
        });

        const $ = cheerio.load(data);

        // PriceDekho product cards
        $('.product-box, .product-item, .search-product').each((_, el) => {
            try {
                const $el = $(el);
                const title = $el.find('.product-title, .prd-title, h3 a, h2 a').text().trim();
                const priceText = $el.find('.price, .product-price, .prd-price').first().text().replace(/[^0-9]/g, '');
                const image = $el.find('img').attr('src') || $el.find('img').attr('data-src') || '';
                const link = $el.find('a').first().attr('href') || '';

                if (title && priceText) {
                    results.push({
                        title,
                        price: parseInt(priceText),
                        image: image.startsWith('http') ? image : `https://www.pricedekho.com${image}`,
                        rating: 0,
                        rating_count: 0,
                        seller: 'PriceDekho',
                        source: 'PriceDekho',
                        product_url: link.startsWith('http') ? link : `https://www.pricedekho.com${link}`
                    });
                }
            } catch {}
        });

        if (results.length > 0) {
            searchCache.set(cacheKey, results);
        }
        console.log(`[PriceDekho] Found ${results.length} results`);
    } catch (e) {
        console.warn(`[PriceDekho] Failed:`, e instanceof Error ? e.message : e);
    }

    return results;
}

/**
 * MySmartPrice - Popular Indian price comparison
 */
export async function searchMySmartPrice(query: string): Promise<UnifiedSearchResult[]> {
    const cacheKey = `mysmartprice:${query.toLowerCase()}`;
    const cached = searchCache.get<UnifiedSearchResult[]>(cacheKey);
    if (cached) return cached;

    const results: UnifiedSearchResult[] = [];
    const url = `https://www.mysmartprice.com/gear/search/?q=${encodeURIComponent(query)}`;

    try {
        console.log(`[MySmartPrice] Searching: ${query}`);
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': USER_AGENT },
            timeout: 10000
        });

        const $ = cheerio.load(data);

        // MySmartPrice search results
        $('.prdct-item, .product-card, .msp-product').each((_, el) => {
            try {
                const $el = $(el);
                const title = $el.find('.prdct-ttl, .product-name, h3').text().trim();
                const priceText = $el.find('.prdct-price, .price, .best-price').first().text().replace(/[^0-9]/g, '');
                const image = $el.find('img').attr('src') || $el.find('img').attr('data-lazy-src') || '';
                const link = $el.find('a').first().attr('href') || '';

                if (title && priceText) {
                    results.push({
                        title,
                        price: parseInt(priceText),
                        image,
                        rating: 0,
                        rating_count: 0,
                        seller: 'MySmartPrice',
                        source: 'MySmartPrice',
                        product_url: link.startsWith('http') ? link : `https://www.mysmartprice.com${link}`
                    });
                }
            } catch {}
        });

        if (results.length > 0) {
            searchCache.set(cacheKey, results);
        }
        console.log(`[MySmartPrice] Found ${results.length} results`);
    } catch (e) {
        console.warn(`[MySmartPrice] Failed:`, e instanceof Error ? e.message : e);
    }

    return results;
}

/**
 * 91Mobiles - Tech product prices
 */
export async function search91Mobiles(query: string): Promise<UnifiedSearchResult[]> {
    const cacheKey = `91mobiles:${query.toLowerCase()}`;
    const cached = searchCache.get<UnifiedSearchResult[]>(cacheKey);
    if (cached) return cached;

    const results: UnifiedSearchResult[] = [];
    const url = `https://www.91mobiles.com/search.php?s=${encodeURIComponent(query)}`;

    try {
        console.log(`[91Mobiles] Searching: ${query}`);
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': USER_AGENT },
            timeout: 10000
        });

        const $ = cheerio.load(data);

        // 91mobiles search results
        $('.search_results .search_item, .finder_snpt, .product-item').each((_, el) => {
            try {
                const $el = $(el);
                const title = $el.find('.name a, .prd_name, h3').text().trim();
                const priceText = $el.find('.price, .prd_price').first().text().replace(/[^0-9]/g, '');
                const image = $el.find('img').attr('src') || $el.find('img').attr('data-src') || '';
                const link = $el.find('a').first().attr('href') || '';

                if (title && title.length > 5) {
                    results.push({
                        title,
                        price: parseInt(priceText) || 0,
                        image,
                        rating: 0,
                        rating_count: 0,
                        seller: '91Mobiles',
                        source: '91Mobiles',
                        product_url: link.startsWith('http') ? link : `https://www.91mobiles.com${link}`
                    });
                }
            } catch {}
        });

        if (results.length > 0) {
            searchCache.set(cacheKey, results);
        }
        console.log(`[91Mobiles] Found ${results.length} results`);
    } catch (e) {
        console.warn(`[91Mobiles] Failed:`, e instanceof Error ? e.message : e);
    }

    return results;
}

/**
 * Smartprix - Another popular Indian price aggregator
 */
export async function searchSmartprix(query: string): Promise<UnifiedSearchResult[]> {
    const cacheKey = `smartprix:${query.toLowerCase()}`;
    const cached = searchCache.get<UnifiedSearchResult[]>(cacheKey);
    if (cached) return cached;

    const results: UnifiedSearchResult[] = [];
    const url = `https://www.smartprix.com/products/?q=${encodeURIComponent(query)}`;

    try {
        console.log(`[Smartprix] Searching: ${query}`);
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': USER_AGENT },
            timeout: 10000
        });

        const $ = cheerio.load(data);

        // Smartprix product cards
        $('.sm-product, .product-card, [class*="product"]').each((_, el) => {
            try {
                const $el = $(el);
                const title = $el.find('.name, .product-name, h2, h3').first().text().trim();
                const priceText = $el.find('.price, .sm-price, [class*="price"]').first().text().replace(/[^0-9]/g, '');
                const image = $el.find('img').attr('src') || $el.find('img').attr('data-src') || '';
                const link = $el.find('a').first().attr('href') || '';

                if (title && title.length > 5) {
                    results.push({
                        title,
                        price: parseInt(priceText) || 0,
                        image,
                        rating: 0,
                        rating_count: 0,
                        seller: 'Smartprix',
                        source: 'Smartprix',
                        product_url: link.startsWith('http') ? link : `https://www.smartprix.com${link}`
                    });
                }
            } catch {}
        });

        if (results.length > 0) {
            searchCache.set(cacheKey, results);
        }
        console.log(`[Smartprix] Found ${results.length} results`);
    } catch (e) {
        console.warn(`[Smartprix] Failed:`, e instanceof Error ? e.message : e);
    }

    return results;
}

/**
 * PriceHunt - Price comparison aggregator
 */
export async function searchPriceHunt(query: string): Promise<UnifiedSearchResult[]> {
    const cacheKey = `pricehunt:${query.toLowerCase()}`;
    const cached = searchCache.get<UnifiedSearchResult[]>(cacheKey);
    if (cached) return cached;

    const results: UnifiedSearchResult[] = [];
    const url = `https://pricehunt.in/search?q=${encodeURIComponent(query)}`;

    try {
        console.log(`[PriceHunt] Searching: ${query}`);
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': USER_AGENT },
            timeout: 10000
        });

        const $ = cheerio.load(data);

        $('.product-card, .product-item, .search-result').each((_, el) => {
            try {
                const $el = $(el);
                const title = $el.find('.product-title, .title, h3, h4').text().trim();
                const priceText = $el.find('.price, .product-price').first().text().replace(/[^0-9]/g, '');
                const image = $el.find('img').attr('src') || '';
                const link = $el.find('a').first().attr('href') || '';

                if (title && priceText) {
                    results.push({
                        title,
                        price: parseInt(priceText),
                        image,
                        rating: 0,
                        rating_count: 0,
                        seller: 'PriceHunt',
                        source: 'PriceHunt',
                        product_url: link.startsWith('http') ? link : `https://pricehunt.in${link}`
                    });
                }
            } catch {}
        });

        if (results.length > 0) {
            searchCache.set(cacheKey, results);
        }
        console.log(`[PriceHunt] Found ${results.length} results`);
    } catch (e) {
        console.warn(`[PriceHunt] Failed:`, e instanceof Error ? e.message : e);
    }

    return results;
}

/**
 * Bing Shopping - Search engine aggregator
 * This aggregates prices from multiple stores
 */
// Helper function to map seller names to source types
function mapSellerToSource(sellerName: string): UnifiedSearchResult['source'] {
    const seller = sellerName.toLowerCase();
    
    // Map to known sources
    if (seller.includes('amazon')) return 'Amazon';
    if (seller.includes('flipkart')) return 'Flipkart';
    if (seller.includes('croma')) return 'Croma';
    if (seller.includes('reliance')) return 'Reliance';
    if (seller.includes('jiomart') || seller.includes('jio mart')) return 'Jiomart';
    if (seller.includes('tatacliq') || seller.includes('tata cliq')) return 'TataCliq';
    if (seller.includes('meesho')) return 'Meesho';
    if (seller.includes('shopclues')) return 'ShopClues';
    if (seller.includes('snapdeal')) return 'Snapdeal';
    if (seller.includes('myntra')) return 'Myntra';
    if (seller.includes('ajio')) return 'Ajio';
    if (seller.includes('vijay sales')) return 'Croma'; // Group with Croma (electronics)
    if (seller.includes('paytm')) return 'PaytmMall';
    
    return 'BingShopping';
}

export async function searchBingShopping(query: string): Promise<UnifiedSearchResult[]> {
    const cacheKey = `bing:${query.toLowerCase()}`;
    const cached = searchCache.get<UnifiedSearchResult[]>(cacheKey);
    if (cached) return cached;

    const results: UnifiedSearchResult[] = [];
    const url = `https://www.bing.com/shop?q=${encodeURIComponent(query)}&FORM=SHOPTB`;

    try {
        console.log(`[BingShopping] Searching: ${query}`);
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'text/html',
                'Accept-Language': 'en-IN,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
            },
            timeout: 15000,
            decompress: true
        });

        const $ = cheerio.load(data);

        // Bing Shopping cards - .br-item is the main selector that works
        $('.br-item, [data-prodtitle], .br-productCard').each((_, el) => {
            try {
                const $el = $(el);
                
                // Get title - try multiple methods
                let title = $el.attr('data-prodtitle') || '';
                if (!title) {
                    // Find the main product link's title attribute or text
                    const $titleLink = $el.find('a[title]').first();
                    title = $titleLink.attr('title') || $titleLink.text().trim();
                }
                if (!title) {
                    title = $el.find('.br-title, .title, h3, h4').first().text().trim();
                }
                
                // Get price - handle the ₹ symbol properly
                const priceText = $el.find('.br-price, .price').first().text();
                const priceMatch = priceText.match(/[\d,]+(?:\.\d{2})?/);
                const price = priceMatch ? parseInt(priceMatch[0].replace(/[,\.]/g, '').substring(0, 10)) : 0;
                
                // Get image - prefer data-src or src
                const $img = $el.find('img').first();
                const image = $img.attr('data-src') || $img.attr('src') || '';
                
                // Get link - find the first product link
                const link = $el.find('a[href*="bing.com/aclick"], a[href]').first().attr('href') || '';
                
                // Get seller/store name
                const store = $el.find('.br-seller, .seller, .store').text().trim() || 'Bing Shopping';

                if (title && title.length > 5 && price > 0) {
                    const source = mapSellerToSource(store);
                    
                    results.push({
                        title: title.substring(0, 200), // Limit title length
                        price: price,
                        image,
                        rating: 0,
                        rating_count: 0,
                        seller: store,
                        source,
                        product_url: link
                    });
                }
            } catch {}
        });

        if (results.length > 0) {
            searchCache.set(cacheKey, results);
        }
        
        // Log source breakdown
        const sourceCount: Record<string, number> = {};
        results.forEach(r => {
            sourceCount[r.source] = (sourceCount[r.source] || 0) + 1;
        });
        console.log(`[BingShopping] Found ${results.length} results:`, sourceCount);
    } catch (e) {
        console.warn(`[BingShopping] Failed:`, e instanceof Error ? e.message : e);
    }

    return results;
}

/**
 * DuckDuckGo Shopping - Privacy-focused search aggregator
 */
export async function searchDuckDuckGo(query: string): Promise<UnifiedSearchResult[]> {
    const cacheKey = `ddg:${query.toLowerCase()}`;
    const cached = searchCache.get<UnifiedSearchResult[]>(cacheKey);
    if (cached) return cached;

    const results: UnifiedSearchResult[] = [];
    
    // DuckDuckGo HTML search with shopping intent
    const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query + ' price india buy')}`;

    try {
        console.log(`[DuckDuckGo] Searching: ${query}`);
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': USER_AGENT },
            timeout: 10000
        });

        const $ = cheerio.load(data);

        $('.result').each((_, el) => {
            try {
                const $el = $(el);
                const title = $el.find('.result__a').text().trim();
                let href = $el.find('.result__a').attr('href') || '';
                const snippet = $el.find('.result__snippet').text().trim();

                // Extract actual URL from DDG redirect
                if (href.includes('uddg=')) {
                    const match = href.match(/uddg=([^&]+)/);
                    if (match) href = decodeURIComponent(match[1]);
                }

                // Extract price from snippet
                const priceMatch = snippet.match(/₹\s*([0-9,]+)/);
                const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0;

                // Identify source from URL - map to valid source types
                let source: UnifiedSearchResult['source'] = 'DuckDuckGo';
                if (href.includes('amazon')) source = 'Amazon';
                else if (href.includes('flipkart')) source = 'Flipkart';
                else if (href.includes('croma')) source = 'Croma';
                else if (href.includes('reliance')) source = 'Reliance';

                if (title && title.length > 10) {
                    results.push({
                        title,
                        price,
                        image: '',
                        rating: 0,
                        rating_count: 0,
                        seller: source,
                        source,
                        product_url: href
                    });
                }
            } catch {}
        });

        if (results.length > 0) {
            searchCache.set(cacheKey, results, 10 * 60 * 1000); // 10 min cache
        }
        console.log(`[DuckDuckGo] Found ${results.length} results`);
    } catch (e) {
        console.warn(`[DuckDuckGo] Failed:`, e instanceof Error ? e.message : e);
    }

    return results;
}

/**
 * Main function to search all aggregator sources in parallel
 */
export async function searchAllAggregators(query: string): Promise<UnifiedSearchResult[]> {
    console.log(`[Aggregators] Parallel search across price comparison sites for: ${query}`);

    const sources = [
        { name: 'PriceDekho', fn: searchPriceDekho },
        { name: 'MySmartPrice', fn: searchMySmartPrice },
        { name: '91Mobiles', fn: search91Mobiles },
        { name: 'Smartprix', fn: searchSmartprix },
        { name: 'PriceHunt', fn: searchPriceHunt },
        { name: 'BingShopping', fn: searchBingShopping },
        { name: 'DuckDuckGo', fn: searchDuckDuckGo }
    ];

    const promises = sources.map(async ({ name, fn }) => {
        try {
            const res = await fn(query);
            return { name, results: res };
        } catch (e) {
            console.error(`[Aggregators] ${name} failed:`, e);
            return { name, results: [] };
        }
    });

    const allResults = await Promise.all(promises);

    // Combine all results
    const combined: UnifiedSearchResult[] = [];
    for (const { name, results } of allResults) {
        console.log(`[Aggregators] ${name}: ${results.length} results`);
        combined.push(...results);
    }

    // Filter out zero-price items and deduplicate
    const seen = new Set<string>();
    const filtered = combined.filter(item => {
        if (item.price <= 0) return false;
        const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    console.log(`[Aggregators] Total unique results: ${filtered.length}`);
    return filtered;
}
