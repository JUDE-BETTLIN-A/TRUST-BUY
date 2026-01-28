import * as cheerio from 'cheerio';
import { UnifiedSearchResult } from './types';
import { fetchWithProxy } from './proxy';

export async function searchCroma(query: string): Promise<UnifiedSearchResult[]> {
    const results: UnifiedSearchResult[] = [];
    // Use the main search page
    const url = `https://www.croma.com/search/?text=${encodeURIComponent(query)}`;

    try {
        console.log(`[Croma] Scraping: ${url}`);

        const data = await fetchWithProxy({ url, timeout: 10000 });

        const $ = cheerio.load(data);

        // Strategy 1: Look for JSON-LD (Structured Data)
        // Croma often embeds product list schemas
        $('script[type="application/ld+json"]').each((_, el) => {
            try {
                const json = JSON.parse($(el).html() || '{}');
                if (json['@type'] === 'ItemList' && Array.isArray(json.itemListElement)) {
                    json.itemListElement.forEach((item: any) => {
                        // JSON-LD usually has minimal info, mostly Name and URL
                        // We might need to guess price or text match if not present
                        if (item.name && item.url) {
                            results.push({
                                title: item.name,
                                price: 0, // Often missing in List JSON-LD, will need fallback or update
                                image: item.image || "",
                                rating: 0,
                                rating_count: 0,
                                seller: 'Croma',
                                source: 'Croma',
                                product_url: item.url
                            });
                        }
                    });
                }
            } catch (e) { /* ignore */ }
        });

        // Strategy 2: HTML Scraping (Selectors subject to change)
        // Common Croma classes: .product-item, .cp-product, .product-card
        if (results.length === 0) {
            $('.product-item, .cp-product, li[data-product-id]').each((_, el) => {
                try {
                    const title = $(el).find('h3.product-title, .product-title, a.product-title').text().trim();
                    const priceText = $(el).find('.product-price, .amount, .new-price').text().replace(/[^0-9]/g, '');
                    const image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
                    const link = $(el).find('a').attr('href');

                    if (title && priceText) {
                        results.push({
                            title,
                            price: parseInt(priceText),
                            mrp: parseInt(priceText) * 1.1, // Estimate if missing
                            discount: 10,
                            image: image || "",
                            rating: 0,
                            rating_count: 0,
                            seller: 'Croma',
                            source: 'Croma',
                            product_url: link ? (link.startsWith('http') ? link : `https://www.croma.com${link}`) : url
                        });
                    }
                } catch (e) { /* ignore */ }
            });
        }

        // Filter out bad data
        return results.filter(r => r.price > 0 || r.title.length > 5);

    } catch (e) {
        console.warn(`[Croma] Scraping failed:`, e instanceof Error ? e.message : e);
        return [];
    }
}
