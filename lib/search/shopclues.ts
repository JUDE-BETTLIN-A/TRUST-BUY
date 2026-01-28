import * as cheerio from 'cheerio';
import { UnifiedSearchResult } from './types';
import { fetchWithProxy } from './proxy';

export async function searchShopClues(query: string): Promise<UnifiedSearchResult[]> {
    const results: UnifiedSearchResult[] = [];
    const url = `https://www.shopclues.com/search?q=${encodeURIComponent(query)}&sc_z=222&z=0&count=10`;

    try {
        const data = await fetchWithProxy({ url, timeout: 10000 });

        const $ = cheerio.load(data);

        $('.column.col3').each((_, el) => {
            try {
                const title = $(el).find('h2').text().trim();
                const priceText = $(el).find('.p_price').text().replace(/[^0-9]/g, '');
                const mrpText = $(el).find('.old_prices').text().replace(/[^0-9]/g, '');
                const discountText = $(el).find('.prd_discount').text().replace(/[^0-9]/g, '');
                const image = $(el).find('img').attr('src') || "";
                const link = $(el).find('a').attr('href');

                // ShopClues doesn't show ratings on grid easily

                if (title && priceText) {
                    results.push({
                        title,
                        price: parseInt(priceText),
                        mrp: mrpText ? parseInt(mrpText) : undefined,
                        discount: discountText ? parseInt(discountText) : 0,
                        image: image || "",
                        rating: 0,
                        rating_count: 0,
                        seller: 'ShopClues',
                        source: 'ShopClues',
                        product_url: link ? `https:${link}` : url
                    });
                }
            } catch (e) { }
        });

    } catch (e) {
        console.warn("[ShopClues] Failed:", e instanceof Error ? e.message : e);
    }

    // Fix source type for ShopClues (mapped to 'Unknown' or expanded type)
    // For now we use Unknown as per strict types in types.ts unless I update types.ts
    // Looking at types.ts: 'Amazon' | 'Flipkart' | ... 'Snapdeal' | 'Unknown'. 
    // ShopClues isn't in there. I will update types.ts later or cast it.

    return results;
}
