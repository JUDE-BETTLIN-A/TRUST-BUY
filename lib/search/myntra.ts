import * as cheerio from 'cheerio';
import { UnifiedSearchResult } from './types';
import { fetchWithProxy, isProxyConfigured } from './proxy';

// Myntra uses client-side rendering with window.__myx data
export async function searchMyntra(query: string): Promise<UnifiedSearchResult[]> {
    const results: UnifiedSearchResult[] = [];
    const url = `https://www.myntra.com/${encodeURIComponent(query)}`;

    try {
        // Myntra requires JS rendering, use proxy with render option
        const data = await fetchWithProxy({ 
            url, 
            timeout: 15000, 
            renderJs: isProxyConfigured() // Only render JS if proxy available
        });

        // Try extracting JSON data from script
        const match = data.match(/window\\.__myx\\s*=\\s*({[\\s\\S]+?});/);
        if (match && match[1]) {
            try {
                const json = JSON.parse(match[1]);
                const products = json.searchData?.results?.products;
                if (products && Array.isArray(products)) {
                    products.forEach((p: any) => {
                        results.push({
                            title: p.productName || p.brand,
                            price: p.price,
                            mrp: p.mrp,
                            discount: p.discount,
                            image: p.searchImage || "",
                            rating: p.rating || 0,
                            rating_count: p.ratingCount || 0,
                            seller: 'Myntra',
                            source: 'Myntra',
                            product_url: `https://www.myntra.com/${p.landingPageUrl}`
                        });
                    });
                }
            } catch (jsonErr) {
                // Parsing failed
            }
        }

        // Alternative: Try to find product data in HTML
        if (results.length === 0) {
            const $ = cheerio.load(data);
            $('.product-base').each((_, el) => {
                try {
                    const title = $(el).find('.product-brand, .product-product').text().trim();
                    const priceText = $(el).find('.product-discountedPrice, .product-price').text().replace(/[^0-9]/g, '');
                    const image = $(el).find('img').attr('src') || '';
                    const link = $(el).find('a').attr('href') || '';

                    if (title && priceText) {
                        results.push({
                            title,
                            price: parseInt(priceText),
                            image,
                            rating: 0,
                            rating_count: 0,
                            seller: 'Myntra',
                            source: 'Myntra',
                            product_url: link.startsWith('http') ? link : `https://www.myntra.com${link}`
                        });
                    }
                } catch (e) { /* skip */ }
            });
        }

    } catch (e) {
        console.warn("[Myntra] Failed:", e instanceof Error ? e.message : e);
    }

    return results;
}
