import axios from 'axios';
import * as cheerio from 'cheerio';
import { UnifiedSearchResult } from './types';

export async function searchFlipkart(query: string): Promise<UnifiedSearchResult[]> {
    const url = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;
    const results: UnifiedSearchResult[] = [];

    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            timeout: 5000
        });

        const $ = cheerio.load(data);

        // Flipkart Grid Class (standard)
        // Try multiple container selectors as Flipkart changes classes weekly
        $('div._1AtVbE, div[data-id], div._13oc-S').each((_, el) => {
            try {
                // Title: Try multiple known classes from 2023-2024 layouts
                const title = $(el).find('div.KzDlHZ, a.wjcEIp, a.s1Q9rs, div._4rR01T, .IRpwTa').first().text().trim();

                // Price
                const priceText = $(el).find('div.Nx9bqj, div._30jeq3, div._25b18c ._30jeq3').first().text().replace(/[^0-9]/g, '');

                // MRP
                const mrpText = $(el).find('div.yRaY8j, div._3I9_wc').first().text().replace(/[^0-9]/g, '');

                // Image
                const image = $(el).find('img').attr('src') || '';

                // Link
                const linkSuffix = $(el).find('a').attr('href');

                // Rating
                const ratingText = $(el).find('div.XQDdHH, div._3LWZlK').first().text();

                if (title && priceText) {
                    const price = parseInt(priceText);
                    const mrp = mrpText ? parseInt(mrpText) : price;
                    const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

                    results.push({
                        title,
                        price,
                        mrp,
                        discount,
                        image: image || "",
                        rating: parseFloat(ratingText) || 0,
                        rating_count: 0, // Hard to extract reliably from grid
                        seller: 'Flipkart Seller',
                        source: 'Flipkart',
                        product_url: linkSuffix ? `https://www.flipkart.com${linkSuffix}` : url
                    });
                }
            } catch (inner) {
                // continue
            }
        });

    } catch (e) {
        console.warn(`[Flipkart] Scrape failed:`, e instanceof Error ? e.message : e);
    }
    return results;
}
