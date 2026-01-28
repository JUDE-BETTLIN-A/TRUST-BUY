import axios from 'axios';
import * as cheerio from 'cheerio';
import { UnifiedSearchResult } from './types';
import { getCromaFromBingShopping } from './bing-shop-fallback';

/**
 * Croma Scraper - Using Telegram bot techniques
 * 
 * Same approach as Flipkart:
 * 1. Firefox headers with Sec-Fetch headers
 * 2. Target data attributes
 * 3. DuckDuckGo fallback
 */

const CROMA_HEADERS = {
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

export async function searchCroma(query: string): Promise<UnifiedSearchResult[]> {
    const results: UnifiedSearchResult[] = [];
    const searchUrl = `https://www.croma.com/searchB?q=${encodeURIComponent(query)}%3Arelevance&page=0&text=${encodeURIComponent(query)}`;
    
    try {
        console.log(`[Croma] Searching: ${query}`);
        
        const { data: html } = await axios.get(searchUrl, {
            headers: CROMA_HEADERS,
            timeout: 15000,
            decompress: true,
        });

        // Check for bot detection - use BingShopping fallback
        if (html.includes('blocked') || html.includes('captcha')) {
            console.log('[Croma] Bot detected, trying BingShopping fallback');
            return getCromaFromBingShopping(query);
        }

        const $ = cheerio.load(html);

        // METHOD 1: Target product cards with data attributes (like Flipkart)
        $('[data-productcode], [data-product], .product-item, .cp-product').each((_, el) => {
            try {
                const $product = $(el);
                
                const $link = $product.find('a').first();
                let productLink = $link.attr('href') || '';
                if (productLink && !productLink.startsWith('http')) {
                    productLink = `https://www.croma.com${productLink}`;
                }

                const image = $product.find('img').first().attr('src') || 
                              $product.find('img').first().attr('data-src') || '';

                let title = $product.find('.product-title, .product-name, h3, h4').first().text().trim();
                if (!title) {
                    title = $link.attr('title') || $product.find('a[title]').attr('title') || '';
                }

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
                        seller: 'Croma',
                        source: 'Croma',
                        product_url: productLink || searchUrl
                    });
                }
            } catch (e) { /* Continue */ }
        });

        // METHOD 2: Try script JSON data
        if (results.length === 0) {
            const scriptContent = $('script#__NEXT_DATA__').text();
            if (scriptContent) {
                try {
                    const nextData = JSON.parse(scriptContent);
                    const products = nextData?.props?.pageProps?.products || 
                                   nextData?.props?.pageProps?.searchResult?.products || [];
                    
                    products.forEach((p: any) => {
                        const price = parseFloat(p.price || p.salePrice || 0);
                        if (p.name && price > 0) {
                            results.push({
                                title: p.name,
                                price,
                                mrp: parseFloat(p.mrp || price),
                                image: p.image || p.plpImage || '',
                                rating: parseFloat(p.rating) || 0,
                                rating_count: 0,
                                seller: 'Croma',
                                source: 'Croma',
                                product_url: p.url ? `https://www.croma.com${p.url}` : searchUrl
                            });
                        }
                    });
                } catch (e) { /* JSON parse failed */ }
            }
        }

        console.log(`[Croma] Found ${results.length} products`);

        if (results.length === 0) {
            console.log(`[Croma] Trying BingShopping fallback`);
            return getCromaFromBingShopping(query);
        }

    } catch (e) {
        console.warn(`[Croma] Scrape failed:`, e instanceof Error ? e.message : e);
        return getCromaFromBingShopping(query);
    }

    return results;
}

async function searchCromaViaDuckDuckGo(query: string): Promise<UnifiedSearchResult[]> {
    const results: UnifiedSearchResult[] = [];
    
    try {
        console.log(`[Croma] Using DuckDuckGo fallback`);
        
        const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' site:croma.com price')}`;
        
        const { data } = await axios.get(ddgUrl, {
            headers: CROMA_HEADERS,
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

                if (!href.includes('croma.com')) return;

                let productUrl = href;
                if (href.includes('uddg=')) {
                    const match = href.match(/uddg=([^&]+)/);
                    if (match) {
                        productUrl = decodeURIComponent(match[1]);
                    }
                }

                if (!productUrl.includes('/p/')) return;

                let price = 0;
                const priceMatch = snippet.match(/₹\s*([\d,]+)/);
                if (priceMatch) {
                    price = parseInt(priceMatch[1].replace(/,/g, ''));
                }

                if (title) {
                    results.push({
                        title: title.replace(' - Croma', '').trim(),
                        price: price || 0,
                        image: '',
                        rating: 0,
                        rating_count: 0,
                        seller: 'Croma',
                        source: 'Croma',
                        product_url: productUrl
                    });
                }
            } catch (e) { /* Continue */ }
        });

        console.log(`[Croma] DuckDuckGo found ${results.length} products`);
    } catch (e) {
        console.warn('[Croma] DuckDuckGo failed:', e instanceof Error ? e.message : e);
    }

    return results;
}
