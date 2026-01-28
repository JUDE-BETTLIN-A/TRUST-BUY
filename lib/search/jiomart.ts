import axios from 'axios';
import * as cheerio from 'cheerio';
import { UnifiedSearchResult } from './types';
import { getJioMartFromBingShopping } from './bing-shop-fallback';

/**
 * JioMart Scraper - Using Telegram bot techniques
 * 
 * Same approach as Flipkart:
 * 1. Firefox headers with Sec-Fetch headers
 * 2. Target data attributes and ₹ symbol
 * 3. DuckDuckGo fallback
 */

const JIOMART_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
};

export async function searchJioMart(query: string): Promise<UnifiedSearchResult[]> {
    const results: UnifiedSearchResult[] = [];
    const searchUrl = `https://www.jiomart.com/search/${encodeURIComponent(query)}`;
    
    try {
        console.log(`[JioMart] Searching: ${query}`);
        
        const { data: html } = await axios.get(searchUrl, {
            headers: JIOMART_HEADERS,
            timeout: 15000,
            decompress: true,
        });

        // Check for bot detection - use BingShopping fallback
        if (html.includes('blocked') || html.includes('captcha') || html.includes('Access Denied')) {
            console.log('[JioMart] Bot detected, trying BingShopping fallback');
            return getJioMartFromBingShopping(query);
        }

        const $ = cheerio.load(html);

        // METHOD 1: Try __NEXT_DATA__ JSON first (JioMart uses Next.js)
        const scriptContent = $('script#__NEXT_DATA__').text();
        if (scriptContent) {
            try {
                const nextData = JSON.parse(scriptContent);
                const products = nextData?.props?.pageProps?.data?.products || 
                               nextData?.props?.pageProps?.products ||
                               nextData?.props?.pageProps?.initialData?.products || [];
                
                products.forEach((p: any) => {
                    const price = parseFloat(p.selling_price || p.sellingPrice || p.price || 0);
                    const mrp = parseFloat(p.mrp || p.maximumRetailPrice || price);
                    const name = p.product_name || p.productName || p.name || '';
                    
                    if (name && price > 0) {
                        results.push({
                            title: name,
                            price,
                            mrp,
                            discount: mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0,
                            image: p.product_image || p.productImage || p.image || '',
                            rating: parseFloat(p.rating || p.average_rating) || 0,
                            rating_count: parseInt(p.rating_count || p.reviews) || 0,
                            seller: 'JioMart',
                            source: 'Jiomart',
                            product_url: p.pdp_link ? `https://www.jiomart.com${p.pdp_link}` : 
                                        p.url ? `https://www.jiomart.com${p.url}` : searchUrl
                        });
                    }
                });
                
                if (results.length > 0) {
                    console.log(`[JioMart] Found ${results.length} products from __NEXT_DATA__`);
                    return results;
                }
            } catch (e) { /* JSON parse failed */ }
        }

        // METHOD 2: Target product cards with data attributes
        $('[data-sku], [data-product-id], .plp-card-wrapper, .product-card').each((_, el) => {
            try {
                const $product = $(el);
                
                const $link = $product.find('a').first();
                let productLink = $link.attr('href') || '';
                if (productLink && !productLink.startsWith('http')) {
                    productLink = `https://www.jiomart.com${productLink}`;
                }

                const image = $product.find('img').first().attr('src') || 
                              $product.find('img').first().attr('data-src') || '';

                let title = $product.find('.plp-card-details-name, .product-title, h3, [class*="name"]').first().text().trim();
                if (!title) {
                    title = $link.attr('title') || '';
                }

                // Extract prices - look for ₹ symbol
                let currentPrice: number | null = null;
                let originalPrice: number | null = null;

                $product.find('span, div').each((_, priceEl) => {
                    const text = $(priceEl).text().trim();
                    if (text.includes('₹')) {
                        const priceMatch = text.match(/₹\s*([\d,]+)/);
                        if (priceMatch) {
                            const price = parseInt(priceMatch[1].replace(/,/g, ''));
                            if (!isNaN(price) && price > 0) {
                                if (currentPrice === null) {
                                    currentPrice = price;
                                } else if (originalPrice === null && price !== currentPrice) {
                                    originalPrice = price;
                                }
                            }
                        }
                    }
                });

                if (title && currentPrice && title.length > 3) {
                    results.push({
                        title,
                        price: currentPrice,
                        mrp: originalPrice || currentPrice,
                        discount: originalPrice && originalPrice > currentPrice 
                            ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) 
                            : 0,
                        image: image.startsWith('//') ? `https:${image}` : image,
                        rating: 0,
                        rating_count: 0,
                        seller: 'JioMart',
                        source: 'Jiomart',
                        product_url: productLink || searchUrl
                    });
                }
            } catch (e) { /* Continue */ }
        });

        console.log(`[JioMart] Found ${results.length} products`);

        if (results.length === 0) {
            console.log(`[JioMart] Trying BingShopping fallback`);
            return getJioMartFromBingShopping(query);
        }

    } catch (e) {
        console.warn(`[JioMart] Scrape failed:`, e instanceof Error ? e.message : e);
        return getJioMartFromBingShopping(query);
    }

    return results;
}

async function searchJioMartViaDuckDuckGo(query: string): Promise<UnifiedSearchResult[]> {
    const results: UnifiedSearchResult[] = [];
    
    try {
        console.log(`[JioMart] Using DuckDuckGo fallback`);
        
        const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' site:jiomart.com price')}`;
        
        const { data } = await axios.get(ddgUrl, {
            headers: JIOMART_HEADERS,
            timeout: 10000,
        });

        const $ = cheerio.load(data);

        $('.result').each((_, el) => {
            try {
                const $result = $(el);
                const $link = $result.find('.result__a');
                const href = $link.attr('href') || '';
                const title = $link.text().trim();
                const snippet = $result.find('.result__snippet').text().trim();

                if (!href.includes('jiomart.com')) return;

                let productUrl = href;
                if (href.includes('uddg=')) {
                    const match = href.match(/uddg=([^&]+)/);
                    if (match) {
                        productUrl = decodeURIComponent(match[1]);
                    }
                }

                // Skip non-product pages
                if (productUrl.includes('/search') || productUrl.includes('/category')) return;

                let price = 0;
                const priceMatch = snippet.match(/₹\s*([\d,]+)/);
                if (priceMatch) {
                    price = parseInt(priceMatch[1].replace(/,/g, ''));
                }

                if (title) {
                    results.push({
                        title: title.replace(' - JioMart', '').replace('| JioMart', '').trim(),
                        price: price || 0,
                        image: '',
                        rating: 0,
                        rating_count: 0,
                        seller: 'JioMart',
                        source: 'Jiomart',
                        product_url: productUrl
                    });
                }
            } catch (e) { /* Continue */ }
        });

        console.log(`[JioMart] DuckDuckGo found ${results.length} products`);
    } catch (e) {
        console.warn('[JioMart] DuckDuckGo failed:', e instanceof Error ? e.message : e);
    }

    return results;
}
