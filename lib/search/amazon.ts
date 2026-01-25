import axios from 'axios';
import * as cheerio from 'cheerio';
import { UnifiedSearchResult } from './types';

// Amazon is extremely aggressive with anti-bot.
// We will use a "Search Aggregator" proxy approach via DuckDuckGo/Bing if direct fails,
// OR (crucially) return nothing if blocked to respect the prompt's "Real Scraping" request.
// For this environment, we implement the direct axios call but catch errors gracefully.

export async function searchAmazon(query: string): Promise<UnifiedSearchResult[]> {
    const url = `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;
    const results: UnifiedSearchResult[] = [];

    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Referer': 'https://www.amazon.in/'
            },
            timeout: 5000
        });

        const $ = cheerio.load(data);

        $('.s-result-item[data-component-type="s-search-result"]').each((_, el) => {
            try {
                const title = $(el).find('h2 span').text().trim();
                const priceText = $(el).find('.a-price-whole').first().text().replace(/[^0-9]/g, '');
                const mrpText = $(el).find('.a-text-price .a-offscreen').first().text().replace(/[^0-9]/g, '');
                const image = $(el).find('img.s-image').attr('src') || '';
                const link = $(el).find('a.a-link-normal').first().attr('href');

                const ratingText = $(el).find('.a-icon-star-small .a-icon-alt').text(); // "4.5 out of 5 stars"
                const rating = parseFloat(ratingText.split(' ')[0]) || 0;
                const ratingCountText = $(el).find('.a-size-base.s-underline-text').text().replace(/[^0-9]/g, '');

                if (title && priceText) {
                    const price = parseInt(priceText);
                    const mrp = mrpText ? parseInt(mrpText) : price; // Default to price if no MRP

                    // Simple discount calc if not present
                    let discount = 0;
                    if (mrp > price) {
                        discount = Math.round(((mrp - price) / mrp) * 100);
                    }

                    results.push({
                        title,
                        price,
                        mrp,
                        discount,
                        image,
                        rating,
                        rating_count: parseInt(ratingCountText) || 0,
                        seller: 'Amazon Seller', // Hard to get from search page without click
                        source: 'Amazon',
                        product_url: link ? `https://www.amazon.in${link}` : url
                    });
                }
            } catch (innerErr) {
                // Continue to next item
            }
        });

    } catch (e) {
        console.warn(`[Amazon] Blocked or failed:`, e instanceof Error ? e.message : e);
        // Fallback to null logic or just return empty as per "Live Data Only" (if can't get it, return empty)
    }

    return results;
}
