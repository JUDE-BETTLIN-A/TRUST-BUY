import axios from 'axios';
import * as cheerio from 'cheerio';
import { UnifiedSearchResult } from './types';

/**
 * Fallback Sources - These aggregate product data from multiple retailers
 * Used when primary scrapers fail due to bot protection
 */

/**
 * Gadgets360 (NDTV) - Tech products with prices
 * Works without proxy!
 */
export async function searchGadgets360(query: string): Promise<UnifiedSearchResult[]> {
    const results: UnifiedSearchResult[] = [];
    const url = `https://gadgets.ndtv.com/search?searchtext=${encodeURIComponent(query)}`;

    try {
        console.log(`[Gadgets360] Searching: ${query}`);

        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
            },
            timeout: 15000
        });

        const $ = cheerio.load(data);

        // Gadgets360 search page structure
        $('.rvw_imgblk, .rivew_img, .gadget_itm_img').each(function() {
            if (results.length >= 20) return false;
            const $el = $(this);
            const $parent = $el.closest('.rvw_item, .rivew_cnt, .gadget_itm');
            
            const title = $el.find('a').first().attr('title') || $el.find('a').first().text().trim();
            const link = $el.find('a').first().attr('href') || '';
            const image = $el.find('img').attr('src') || $el.find('img').attr('data-src') || '';
            const priceText = $parent.find('.rvw_price, .gadget_price, [class*="price"]').text().replace(/[^0-9]/g, '');
            
            if (title && title.length > 5) {
                results.push({
                    title: title.trim(),
                    price: priceText ? parseInt(priceText) : 0,
                    image: image,
                    rating: 0,
                    rating_count: 0,
                    seller: 'Gadgets360',
                    source: 'Gadgets360',
                    product_url: link.startsWith('http') ? link : `https://gadgets.ndtv.com${link}`
                });
            }
        });

        // Alternative: Search result links
        if (results.length === 0) {
            $('a[href*="/mobiles/"], a[href*="/laptops/"], a[href*="/tablets/"]').each(function() {
                if (results.length >= 20) return false;
                const $el = $(this);
                const title = $el.text().trim() || $el.attr('title') || '';
                const link = $el.attr('href') || '';
                
                if (title.length > 10 && !title.toLowerCase().includes('compare')) {
                    results.push({
                        title,
                        price: 0,
                        image: '',
                        rating: 0,
                        rating_count: 0,
                        seller: 'Gadgets360',
                        source: 'Gadgets360',
                        product_url: link.startsWith('http') ? link : `https://gadgets.ndtv.com${link}`
                    });
                }
            });
        }

        console.log(`[Gadgets360] Found ${results.length} results`);
    } catch (e) {
        console.warn(`[Gadgets360] Failed:`, e instanceof Error ? e.message : e);
    }

    return results;
}

/**
 * Indiamart - Large B2B marketplace, works without proxy!
 */
export async function searchIndiamart(query: string): Promise<UnifiedSearchResult[]> {
    const results: UnifiedSearchResult[] = [];
    const url = `https://dir.indiamart.com/search.mp?ss=${encodeURIComponent(query)}&prdsrc=1`;

    try {
        console.log(`[Indiamart] Searching: ${query}`);

        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
            },
            timeout: 15000
        });

        const $ = cheerio.load(data);

        // Indiamart uses various card structures - extract price from HTML content
        $('div.lst, div.flx, .card, [class*="product"]').each(function() {
            if (results.length >= 30) return false;
            const $el = $(this);
            const html = $el.html() || '';
            
            // Extract price using regex - Indiamart shows ₹XX,XXX format
            const priceMatch = html.match(/₹\s*([\d,]+)/);
            const title = $el.find('a').first().text().trim() 
                       || $el.find('h2, h3').first().text().trim()
                       || $el.find('a').first().attr('title') || '';
            const image = $el.find('img').attr('data-src') || $el.find('img').attr('src') || '';
            const link = $el.find('a').first().attr('href') || '';
            
            // Only add if we have a title and preferably a price
            if (title && title.length > 3 && title.length < 150 && !title.toLowerCase().includes('seller') && !title.toLowerCase().includes('contact')) {
                const priceValue = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0;
                
                // Avoid duplicates
                if (!results.some(r => r.title.toLowerCase() === title.toLowerCase())) {
                    results.push({
                        title: title.slice(0, 100),
                        price: priceValue,
                        image: image,
                        rating: 0,
                        rating_count: 0,
                        seller: 'Indiamart',
                        source: 'Indiamart' as any,
                        product_url: link.startsWith('http') ? link : (link ? `https://www.indiamart.com${link}` : url)
                    });
                }
            }
        });

        console.log(`[Indiamart] Found ${results.length} results`);
    } catch (e) {
        console.warn(`[Indiamart] Failed:`, e instanceof Error ? e.message : e);
    }

    return results;
}

/**
 * Jiomart - Reliance retail, may work
 */
export async function searchJiomart(query: string): Promise<UnifiedSearchResult[]> {
    const results: UnifiedSearchResult[] = [];
    const url = `https://www.jiomart.com/search/${encodeURIComponent(query)}`;

    try {
        console.log(`[Jiomart] Searching: ${query}`);

        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html',
            },
            timeout: 10000
        });

        const $ = cheerio.load(data);

        // Try JSON-LD first
        $('script[type="application/ld+json"]').each(function() {
            try {
                const json = JSON.parse($(this).html() || '{}');
                if (json['@type'] === 'ItemList' && Array.isArray(json.itemListElement)) {
                    json.itemListElement.forEach((item: any) => {
                        if (results.length >= 20) return;
                        if (item.name) {
                            results.push({
                                title: item.name,
                                price: item.offers?.price || 0,
                                image: item.image || '',
                                rating: 0,
                                rating_count: 0,
                                seller: 'Jiomart',
                                source: 'Jiomart' as any,
                                product_url: item.url || url
                            });
                        }
                    });
                }
            } catch (e) { /* ignore */ }
        });

        // HTML fallback
        if (results.length === 0) {
            $('.product-card, .plp-card, [class*="product"]').each(function() {
                if (results.length >= 20) return false;
                const $el = $(this);
                const title = $el.find('.product-name, h3, .title').first().text().trim();
                const priceText = $el.find('.price, [class*="price"]').first().text().replace(/[^0-9]/g, '');
                const image = $el.find('img').attr('src') || '';
                const link = $el.find('a').first().attr('href') || '';

                if (title && title.length > 3) {
                    results.push({
                        title,
                        price: priceText ? parseInt(priceText) : 0,
                        image,
                        rating: 0,
                        rating_count: 0,
                        seller: 'Jiomart',
                        source: 'Jiomart' as any,
                        product_url: link.startsWith('http') ? link : `https://www.jiomart.com${link}`
                    });
                }
            });
        }

        console.log(`[Jiomart] Found ${results.length} results`);
    } catch (e) {
        console.warn(`[Jiomart] Failed:`, e instanceof Error ? e.message : e);
    }

    return results;
}

/**
 * Paytm Mall - May work for some products
 */
export async function searchPaytmMall(query: string): Promise<UnifiedSearchResult[]> {
    const results: UnifiedSearchResult[] = [];
    const url = `https://paytmmall.com/shop/search?q=${encodeURIComponent(query)}`;

    try {
        console.log(`[PaytmMall] Searching: ${query}`);

        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html',
            },
            timeout: 10000
        });

        const $ = cheerio.load(data);

        $('.product-grid-item, .product-card, [class*="product"]').each(function() {
            if (results.length >= 20) return false;
            const $el = $(this);
            const title = $el.find('.product-name, h3, .title, a').first().text().trim();
            const priceText = $el.find('.price, [class*="price"]').first().text().replace(/[^0-9]/g, '');
            const image = $el.find('img').attr('src') || '';
            const link = $el.find('a').first().attr('href') || '';

            if (title && title.length > 5) {
                results.push({
                    title,
                    price: priceText ? parseInt(priceText) : 0,
                    image,
                    rating: 0,
                    rating_count: 0,
                    seller: 'Paytm Mall',
                    source: 'PaytmMall' as any,
                    product_url: link.startsWith('http') ? link : `https://paytmmall.com${link}`
                });
            }
        });

        console.log(`[PaytmMall] Found ${results.length} results`);
    } catch (e) {
        console.warn(`[PaytmMall] Failed:`, e instanceof Error ? e.message : e);
    }

    return results;
}

/**
 * Master fallback function - tries all fallback sources
 * Prioritizes sources that work without proxy
 */
export async function searchFallbackSources(query: string): Promise<UnifiedSearchResult[]> {
    console.log(`[Fallback] Searching alternative sources for: ${query}`);

    // Run in parallel - these sources work without proxy
    const fallbackPromises = [
        searchGadgets360(query),
        searchIndiamart(query),
        searchJiomart(query),
        searchPaytmMall(query),
    ];

    const results = await Promise.allSettled(fallbackPromises);
    
    const allResults: UnifiedSearchResult[] = [];
    const sources = ['Gadgets360', 'Indiamart', 'Jiomart', 'PaytmMall'];
    
    results.forEach((result, idx) => {
        if (result.status === 'fulfilled' && result.value.length > 0) {
            console.log(`[Fallback] ${sources[idx]}: ${result.value.length} results`);
            allResults.push(...result.value);
        } else if (result.status === 'rejected') {
            console.warn(`[Fallback] ${sources[idx]} failed`);
        }
    });

    // Remove items with no price (less useful)
    const withPrice = allResults.filter(r => r.price > 0);
    const withoutPrice = allResults.filter(r => r.price === 0);
    
    // Prioritize items with prices
    const combined = [...withPrice, ...withoutPrice.slice(0, 10)];

    console.log(`[Fallback] Total from alternatives: ${combined.length} results (${withPrice.length} with prices)`);
    return combined;
}
