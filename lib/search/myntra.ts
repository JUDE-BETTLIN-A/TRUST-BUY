import axios from 'axios';
import * as cheerio from 'cheerio';
import { UnifiedSearchResult } from './types';

// Myntra uses client-side rendering with window.__myx data
export async function searchMyntra(query: string): Promise<UnifiedSearchResult[]> {
    const results: UnifiedSearchResult[] = [];
    const url = `https://www.myntra.com/${encodeURIComponent(query)}`;

    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                // Cookie helps sometimes
            },
            timeout: 5000
        });

        // Try extracting JSON data from script
        const match = data.match(/window\.__myx\s*=\s*({[\s\S]+?});/);
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
        } else {
            // Fallback to Cheerio if classes exist (unlikely on myntra SSR but possible)
        }

    } catch (e) {
        console.warn("[Myntra] Failed:", e instanceof Error ? e.message : e);
    }

    return results;
}
