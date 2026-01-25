import axios from 'axios';
import * as cheerio from 'cheerio';
import { UnifiedSearchResult } from './types';

export async function searchSnapdeal(query: string): Promise<UnifiedSearchResult[]> {
    const results: UnifiedSearchResult[] = [];
    const url = `https://www.snapdeal.com/search?keyword=${encodeURIComponent(query)}&sort=rlvncy`;

    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 5000
        });

        const $ = cheerio.load(data);

        $('.product-tuple-listing').each((_, el) => {
            try {
                const title = $(el).find('.product-title').text().trim();
                const priceText = $(el).find('.product-price').text().replace(/[^0-9]/g, '');
                const mrpText = $(el).find('.product-desc-price').text().replace(/[^0-9]/g, '');
                const discountText = $(el).find('.product-discount').text().replace(/[^0-9]/g, '');
                const image = $(el).find('img.product-image').attr('src') || $(el).find('source').attr('srcset') || "";
                const link = $(el).find('a.dp-widget-link').attr('href');
                const ratingCount = $(el).find('.product-rating-count').text().replace(/[^0-9]/g, '');

                // Snapdeal uses width % for rating (e.g. width: 80% = 4 stars)
                // Simplified approx
                const ratingStyle = $(el).find('.filled-stars').attr('style') || "";
                const widthMatch = ratingStyle.match(/width:([0-9.]+)%/);
                let rating = 0;
                if (widthMatch) {
                    rating = (parseFloat(widthMatch[1]) / 100) * 5;
                }

                if (title && priceText) {
                    results.push({
                        title,
                        price: parseInt(priceText),
                        mrp: mrpText ? parseInt(mrpText) : undefined,
                        discount: discountText ? parseInt(discountText) : 0,
                        image: image || "",
                        rating: Number(rating.toFixed(1)),
                        rating_count: parseInt(ratingCount) || 0,
                        seller: 'Snapdeal Seller',
                        source: 'Snapdeal',
                        product_url: link || url
                    });
                }
            } catch (e) {
                // skip
            }
        });

    } catch (e) {
        console.warn("[Snapdeal] Failed:", e instanceof Error ? e.message : e);
    }

    return results;
}
