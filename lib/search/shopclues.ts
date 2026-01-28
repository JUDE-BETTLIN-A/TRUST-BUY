import axios from 'axios';
import * as cheerio from 'cheerio';
import { UnifiedSearchResult } from './types';
import { getShopCluesFromBingShopping } from './bing-shop-fallback';

/**
 * ShopClues Scraper - Using Telegram bot techniques
 * 
 * Same approach as Flipkart:
 * 1. Firefox headers with Sec-Fetch headers
 * 2. Target data attributes and ₹ symbol
 * 3. DuckDuckGo fallback
 */

const SHOPCLUES_HEADERS = {
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

export async function searchShopClues(query: string): Promise<UnifiedSearchResult[]> {
    const results: UnifiedSearchResult[] = [];
    const searchUrl = `https://www.shopclues.com/search?q=${encodeURIComponent(query)}&sc_z=222&z=0&count=40`;

    try {
        console.log(`[ShopClues] Searching: ${query}`);
        
        const { data: html } = await axios.get(searchUrl, {
            headers: SHOPCLUES_HEADERS,
            timeout: 15000,
            decompress: true,
        });

        // Check for bot detection - use BingShopping fallback
        if (html.includes('blocked') || html.includes('captcha') || html.includes('Access Denied')) {
            console.log('[ShopClues] Bot detected, trying BingShopping fallback');
            return getShopCluesFromBingShopping(query);
        }

        const $ = cheerio.load(html);

        // Target product cards with data attributes
        $('.column.col3, .product_box, [data-productid], .prd_grid, .product-item').each((_, el) => {
            try {
                const $product = $(el);
                
                const $link = $product.find('a').first();
                let productLink = $link.attr('href') || '';
                if (productLink && !productLink.startsWith('http')) {
                    productLink = `https://www.shopclues.com${productLink}`;
                }

                const image = $product.find('img').first().attr('src') || 
                              $product.find('img').first().attr('data-src') || '';

                let title = $product.find('h2, .prd_name, .product_name, h3').first().text().trim();

                // Extract prices - look for ₹ symbol or price classes
                let currentPrice: number | null = null;
                let originalPrice: number | null = null;

                // First try specific price classes
                const priceText = $product.find('.p_price, .prd_price, .final_price').first().text().replace(/[^0-9]/g, '');
                const mrpText = $product.find('.old_prices, .mrp_price, .original_price').first().text().replace(/[^0-9]/g, '');
                
                if (priceText) {
                    currentPrice = parseInt(priceText);
                }
                if (mrpText) {
                    originalPrice = parseInt(mrpText);
                }

                // Fallback: look for ₹ symbol
                if (!currentPrice) {
                    $product.find('span, div').each((_, priceEl) => {
                        const text = $(priceEl).text().trim();
                        if (text.includes('₹')) {
                            const priceMatch = text.match(/₹\s*([\d,]+)/);
                            if (priceMatch && currentPrice === null) {
                                currentPrice = parseInt(priceMatch[1].replace(/,/g, ''));
                            }
                        }
                    });
                }

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
                        seller: 'ShopClues',
                        source: 'ShopClues',
                        product_url: productLink || searchUrl
                    });
                }
            } catch (e) { /* Continue */ }
        });

        console.log(`[ShopClues] Found ${results.length} products`);

        if (results.length === 0) {
            console.log(`[ShopClues] Trying BingShopping fallback`);
            return getShopCluesFromBingShopping(query);
        }

    } catch (e) {
        console.warn(`[ShopClues] Scrape failed:`, e instanceof Error ? e.message : e);
        return getShopCluesFromBingShopping(query);
    }

    return results;
}

async function searchShopCluesViaDuckDuckGo(query: string): Promise<UnifiedSearchResult[]> {
    const results: UnifiedSearchResult[] = [];
    
    try {
        console.log(`[ShopClues] Using DuckDuckGo fallback`);
        
        const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' site:shopclues.com')}`;
        
        const { data } = await axios.get(ddgUrl, {
            headers: SHOPCLUES_HEADERS,
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

                if (!href.includes('shopclues.com')) return;

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
                        title: title.replace(' - ShopClues', '').trim(),
                        price: price || 0,
                        image: '',
                        rating: 0,
                        rating_count: 0,
                        seller: 'ShopClues',
                        source: 'ShopClues',
                        product_url: productUrl
                    });
                }
            } catch (e) { /* Continue */ }
        });

        console.log(`[ShopClues] DuckDuckGo found ${results.length} products`);
    } catch (e) {
        console.warn('[ShopClues] DuckDuckGo failed:', e instanceof Error ? e.message : e);
    }

    return results;
}
