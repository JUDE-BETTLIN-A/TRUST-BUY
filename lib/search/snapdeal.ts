import axios from 'axios';
import * as cheerio from 'cheerio';
import { UnifiedSearchResult } from './types';

/**
 * Snapdeal Scraper - Using Telegram bot techniques
 * 
 * Snapdeal is generally easier to scrape than Amazon/Flipkart
 */

// Firefox headers
const SNAPDEAL_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-IN,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Referer': 'https://www.snapdeal.com/',
};

export async function searchSnapdeal(query: string): Promise<UnifiedSearchResult[]> {
    const results: UnifiedSearchResult[] = [];
    const url = `https://www.snapdeal.com/search?keyword=${encodeURIComponent(query)}&sort=rlvncy`;

    try {
        console.log(`[Snapdeal] Searching: ${query}`);
        
        const { data } = await axios.get(url, {
            headers: SNAPDEAL_HEADERS,
            timeout: 15000,
            decompress: true,
        });

        const $ = cheerio.load(data);

        // METHOD 1: Product tuple listing (main method)
        $('.product-tuple-listing, [data-widget-type="widget"], .product-item').each((_, el) => {
            try {
                const $product = $(el);
                
                // Title
                const title = $product.find('.product-title, .product-name, h4').first().text().trim();
                
                // Price
                const priceText = $product.find('.product-price, .lfloat.product-price').first().text().replace(/[^0-9]/g, '');
                
                // MRP
                const mrpText = $product.find('.product-desc-price, .pdp-mrp').first().text().replace(/[^0-9]/g, '');
                
                // Discount
                const discountText = $product.find('.product-discount, .discount-percent').first().text().replace(/[^0-9]/g, '');
                
                // Image
                const image = $product.find('img.product-image').attr('src') || 
                             $product.find('source').attr('srcset') || 
                             $product.find('img').first().attr('src') || '';
                
                // Link
                const link = $product.find('a.dp-widget-link, a').first().attr('href') || '';
                
                // Rating count
                const ratingCount = $product.find('.product-rating-count, .rating-count').text().replace(/[^0-9]/g, '');

                // Snapdeal uses width % for rating (e.g. width: 80% = 4 stars)
                const ratingStyle = $product.find('.filled-stars').attr('style') || '';
                const widthMatch = ratingStyle.match(/width:([0-9.]+)%/);
                let rating = 0;
                if (widthMatch) {
                    rating = (parseFloat(widthMatch[1]) / 100) * 5;
                }

                if (title && priceText) {
                    const price = parseInt(priceText);
                    const mrp = mrpText ? parseInt(mrpText) : price;
                    
                    results.push({
                        title,
                        price,
                        mrp,
                        discount: discountText ? parseInt(discountText) : (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0),
                        image: image || '',
                        rating: Number(rating.toFixed(1)),
                        rating_count: parseInt(ratingCount) || 0,
                        seller: 'Snapdeal',
                        source: 'Snapdeal',
                        product_url: link.startsWith('http') ? link : (link ? `https://www.snapdeal.com${link}` : url)
                    });
                }
            } catch (e) {
                // Skip
            }
        });

        console.log(`[Snapdeal] Found ${results.length} products`);

    } catch (e) {
        console.warn(`[Snapdeal] Scrape failed:`, e instanceof Error ? e.message : e);
    }

    return results;
}
