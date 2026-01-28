import axios from 'axios';
import * as cheerio from 'cheerio';
import { UnifiedSearchResult } from './types';
import { cleanProductUrl } from '@/lib/url-utils';

/**
 * Amazon India Scraper - Using Telegram bot techniques
 * 
 * Key techniques:
 * 1. Firefox User-Agent (more reliable than Chrome)
 * 2. Target data-component-type="s-search-result" attribute
 * 3. Multiple fallback selectors
 */

// Firefox headers - same pattern as Flipkart scraper
const AMAZON_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
};

export async function searchAmazon(query: string): Promise<UnifiedSearchResult[]> {
    const url = `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;
    const results: UnifiedSearchResult[] = [];

    try {
        console.log(`[Amazon] Searching: ${query}`);
        
        const { data } = await axios.get(url, {
            headers: AMAZON_HEADERS,
            timeout: 15000,
            decompress: true,
        });

        // Check for CAPTCHA
        if (data.includes('Enter the characters you see below') || data.includes('captcha')) {
            console.warn('[Amazon] CAPTCHA detected, returning empty');
            return [];
        }

        const $ = cheerio.load(data);

        // METHOD 1: Target elements with data-component-type="s-search-result" (most reliable)
        $('[data-component-type="s-search-result"]').each((_, el) => {
            try {
                const $product = $(el);
                const asin = $product.attr('data-asin');
                
                if (!asin) return; // Skip if no ASIN
                
                // Title
                const title = $product.find('h2 span, h2 a span').first().text().trim();
                
                // Price - look for a-price-whole
                const priceText = $product.find('.a-price-whole').first().text().replace(/[^0-9]/g, '');
                
                // MRP (strikethrough price)
                const mrpText = $product.find('.a-text-price .a-offscreen').first().text().replace(/[^0-9]/g, '');
                
                // Image
                const image = $product.find('img.s-image').attr('src') || '';
                
                // Link
                const linkHref = $product.find('h2 a, a.a-link-normal.s-no-outline').first().attr('href');
                const productUrl = linkHref ? 
                    (linkHref.startsWith('http') ? linkHref : `https://www.amazon.in${linkHref}`) : 
                    `https://www.amazon.in/dp/${asin}`;

                // Rating
                const ratingText = $product.find('.a-icon-star-small .a-icon-alt, .a-icon-star .a-icon-alt').first().text();
                const rating = parseFloat(ratingText.split(' ')[0]) || 0;
                
                // Rating count
                const ratingCountText = $product.find('span[aria-label*="ratings"], .a-size-base.s-underline-text').first().text().replace(/[^0-9]/g, '');

                if (title && priceText) {
                    const price = parseInt(priceText);
                    const mrp = mrpText ? parseInt(mrpText) : price;
                    const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

                    results.push({
                        title,
                        price,
                        mrp,
                        discount,
                        image,
                        rating,
                        rating_count: parseInt(ratingCountText) || 0,
                        seller: 'Amazon',
                        source: 'Amazon',
                        product_url: cleanProductUrl(productUrl)
                    });
                }
            } catch (err) {
                // Continue to next product
            }
        });

        console.log(`[Amazon] Found ${results.length} products`);

        // METHOD 2: Fallback to older selectors if data-component-type failed
        if (results.length === 0) {
            console.log('[Amazon] Primary method returned 0 results, trying fallback selectors...');
            
            $('.s-result-item').each((_, el) => {
                try {
                    const $el = $(el);
                    const title = $el.find('h2 span').text().trim();
                    const priceText = $el.find('.a-price-whole').first().text().replace(/[^0-9]/g, '');
                    const image = $el.find('img').first().attr('src') || '';
                    const link = $el.find('a').first().attr('href');

                    if (title && priceText && title.length > 5) {
                        results.push({
                            title,
                            price: parseInt(priceText),
                            image,
                            rating: 0,
                            rating_count: 0,
                            seller: 'Amazon',
                            source: 'Amazon',
                            product_url: link ? cleanProductUrl(`https://www.amazon.in${link}`) : url
                        });
                    }
                } catch (err) {
                    // Continue
                }
            });
            
            console.log(`[Amazon] Fallback found ${results.length} products`);
        }

    } catch (e) {
        console.warn(`[Amazon] Scrape failed:`, e instanceof Error ? e.message : e);
    }

    return results;
}
