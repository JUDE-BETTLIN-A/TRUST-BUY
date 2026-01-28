import axios from 'axios';
import * as cheerio from 'cheerio';
import { UnifiedSearchResult } from './types';
import { getRelianceFromBingShopping } from './bing-shop-fallback';

/**
 * Reliance Digital Scraper - Using Telegram bot techniques
 * 
 * Same approach as Flipkart:
 * 1. Firefox headers with Sec-Fetch headers
 * 2. Target data attributes and ₹ symbol
 * 3. DuckDuckGo fallback
 */

const RELIANCE_HEADERS = {
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

export async function searchReliance(query: string): Promise<UnifiedSearchResult[]> {
    const results: UnifiedSearchResult[] = [];
    const searchUrl = `https://www.reliancedigital.in/search?q=${encodeURIComponent(query)}`;

    try {
        console.log(`[Reliance] Searching: ${query}`);
        
        const { data: html } = await axios.get(searchUrl, {
            headers: RELIANCE_HEADERS,
            timeout: 15000,
            decompress: true,
        });

        // Check for bot detection - use BingShopping fallback instead
        if (html.includes('blocked') || html.includes('captcha') || html.includes('Access Denied')) {
            console.log('[Reliance] Bot detected, trying BingShopping fallback');
            return getRelianceFromBingShopping(query);
        }

        const $ = cheerio.load(html);

        // METHOD 1: Target product cards with data attributes (like Flipkart)
        $('[data-testid*="product"], [data-product-id], .sp__product, .product-item').each((_, el) => {
            try {
                const $product = $(el);
                
                const $link = $product.find('a').first();
                let productLink = $link.attr('href') || '';
                if (productLink && !productLink.startsWith('http')) {
                    productLink = `https://www.reliancedigital.in${productLink}`;
                }

                const image = $product.find('img').first().attr('src') || 
                              $product.find('img').first().attr('data-src') || '';

                let title = $product.find('.sp__name, .product-title, h3, h4, [class*="name"]').first().text().trim();
                if (!title) {
                    title = $link.attr('title') || '';
                }

                // Extract prices - look for ₹ symbol
                let currentPrice: number | null = null;
                let originalPrice: number | null = null;

                $product.find('span, div, p').each((_, priceEl) => {
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
                        seller: 'Reliance Digital',
                        source: 'Reliance',
                        product_url: productLink || searchUrl
                    });
                }
            } catch (e) { /* Continue */ }
        });

        // METHOD 2: Try __NEXT_DATA__ JSON
        if (results.length === 0) {
            const scriptContent = $('script#__NEXT_DATA__').text();
            if (scriptContent) {
                try {
                    const nextData = JSON.parse(scriptContent);
                    const products = nextData?.props?.pageProps?.products || 
                                   nextData?.props?.pageProps?.searchData?.products ||
                                   nextData?.props?.pageProps?.initialData?.products || [];
                    
                    products.forEach((p: any) => {
                        const price = parseFloat(p.price || p.sellingPrice || p.salePrice || 0);
                        if (p.name && price > 0) {
                            results.push({
                                title: p.name,
                                price,
                                mrp: parseFloat(p.mrp || price),
                                image: p.image || p.plpImage || '',
                                rating: parseFloat(p.rating) || 0,
                                rating_count: 0,
                                seller: 'Reliance Digital',
                                source: 'Reliance',
                                product_url: p.url ? `https://www.reliancedigital.in${p.url}` : searchUrl
                            });
                        }
                    });
                } catch (e) { /* JSON parse failed */ }
            }
        }

        // METHOD 3: Look for any links with prices
        if (results.length === 0) {
            $('a[href*="/p/"]').each((_, el) => {
                try {
                    const $link = $(el);
                    const href = $link.attr('href') || '';
                    const $container = $link.closest('li, div').first();
                    
                    const title = $link.text().trim() || $link.attr('title') || '';
                    
                    let price = 0;
                    $container.find('*').each((_, priceEl) => {
                        const text = $(priceEl).text();
                        const match = text.match(/₹\s*([\d,]+)/);
                        if (match && !price) {
                            price = parseInt(match[1].replace(/,/g, ''));
                        }
                    });

                    const image = $container.find('img').first().attr('src') || '';

                    if (title && price > 0 && title.length > 5) {
                        results.push({
                            title,
                            price,
                            image,
                            rating: 0,
                            rating_count: 0,
                            seller: 'Reliance Digital',
                            source: 'Reliance',
                            product_url: href.startsWith('http') ? href : `https://www.reliancedigital.in${href}`
                        });
                    }
                } catch (e) { /* Continue */ }
            });
        }

        console.log(`[Reliance] Found ${results.length} products`);

        if (results.length === 0) {
            console.log(`[Reliance] Trying BingShopping fallback`);
            return getRelianceFromBingShopping(query);
        }

    } catch (e) {
        console.warn(`[Reliance] Scrape failed:`, e instanceof Error ? e.message : e);
        return getRelianceFromBingShopping(query);
    }

    return results;
}

async function searchRelianceViaDuckDuckGo(query: string): Promise<UnifiedSearchResult[]> {
    const results: UnifiedSearchResult[] = [];
    
    try {
        console.log(`[Reliance] Using DuckDuckGo fallback`);
        
        const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' site:reliancedigital.in price')}`;
        
        const { data } = await axios.get(ddgUrl, {
            headers: RELIANCE_HEADERS,
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

                if (!href.includes('reliancedigital.in')) return;

                let productUrl = href;
                if (href.includes('uddg=')) {
                    const match = href.match(/uddg=([^&]+)/);
                    if (match) {
                        productUrl = decodeURIComponent(match[1]);
                    }
                }

                // Skip non-product pages
                if (!productUrl.includes('/p/') && !productUrl.includes('product')) return;

                let price = 0;
                const priceMatch = snippet.match(/₹\s*([\d,]+)/);
                if (priceMatch) {
                    price = parseInt(priceMatch[1].replace(/,/g, ''));
                }

                if (title) {
                    results.push({
                        title: title.replace(' - Reliance Digital', '').replace('| Reliance Digital', '').trim(),
                        price: price || 0,
                        image: '',
                        rating: 0,
                        rating_count: 0,
                        seller: 'Reliance Digital',
                        source: 'Reliance',
                        product_url: productUrl
                    });
                }
            } catch (e) { /* Continue */ }
        });

        console.log(`[Reliance] DuckDuckGo found ${results.length} products`);
    } catch (e) {
        console.warn('[Reliance] DuckDuckGo failed:', e instanceof Error ? e.message : e);
    }

    return results;
}
