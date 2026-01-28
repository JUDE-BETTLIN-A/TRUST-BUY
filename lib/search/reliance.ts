import axios from 'axios';
import * as cheerio from 'cheerio';
import { UnifiedSearchResult } from './types';
import { fetchWithProxy, isProxyConfigured } from './proxy';

// Reliance Digital API
export async function searchReliance(query: string): Promise<UnifiedSearchResult[]> {
    const results: UnifiedSearchResult[] = [];
    // API endpoint often used by their frontend
    const apiUrl = `https://www.reliancedigital.in/rildigitalws/v2/rrldigital/cms/pagedata?pageType=searchPage&q=${encodeURIComponent(query)}`;
    const searchUrl = `https://www.reliancedigital.in/search?q=${encodeURIComponent(query)}`;

    try {
        // Try API first
        try {
            const { data } = await axios.get(apiUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json'
                },
                timeout: 5000
            });

            if (data && data.productListData && Array.isArray(data.productListData)) {
                data.productListData.forEach((p: any) => {
                    results.push({
                        title: p.name || p.productName,
                        price: parseFloat(p.price?.value || p.finalPrice || 0),
                        mrp: parseFloat(p.mrp?.value || p.mrp || 0),
                        discount: 0,
                        image: p.plpImage || p.image || "",
                        rating: parseFloat(p.averageRating) || 0,
                        rating_count: 0,
                        seller: 'Reliance Digital',
                        source: 'Reliance',
                        product_url: p.url ? `https://www.reliancedigital.in${p.url}` : searchUrl
                    });
                });
            }
        } catch (apiError) {
            // API failed, try HTML scraping with proxy
            if (isProxyConfigured()) {
                const htmlData = await fetchWithProxy({ url: searchUrl, timeout: 10000 });
                const $ = cheerio.load(htmlData);
                
                $('.sp__product, .product-item, [data-product-id]').each((_, el) => {
                    try {
                        const title = $(el).find('.sp__name, .product-title').text().trim();
                        const priceText = $(el).find('.sp__price, .product-price').text().replace(/[^0-9]/g, '');
                        const image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || '';
                        const link = $(el).find('a').attr('href') || '';

                        if (title && priceText) {
                            results.push({
                                title,
                                price: parseInt(priceText),
                                image,
                                rating: 0,
                                rating_count: 0,
                                seller: 'Reliance Digital',
                                source: 'Reliance',
                                product_url: link.startsWith('http') ? link : `https://www.reliancedigital.in${link}`
                            });
                        }
                    } catch (e) { /* skip */ }
                });
            }
        }

    } catch (e) {
        console.warn("[Reliance] Failed:", e instanceof Error ? e.message : e);
    }

    return results;
}
