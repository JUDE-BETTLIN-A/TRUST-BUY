import axios from 'axios';
import { UnifiedSearchResult } from './types';

// AJIO API Strategy
export async function searchAjio(query: string): Promise<UnifiedSearchResult[]> {
    const results: UnifiedSearchResult[] = [];
    const url = `https://www.ajio.com/api/search/v3?query=${encodeURIComponent(query)}&text=${encodeURIComponent(query)}&gridType=3&curated=true&curatedid=search&pageSize=30&currentPage=0`;

    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 5000
        });

        if (data && data.products && Array.isArray(data.products)) {
            data.products.forEach((p: any) => {
                results.push({
                    title: p.name || p.fnlColorVariantData?.brandName + " " + p.name,
                    price: p.price?.value || 0,
                    mrp: p.wasPriceData?.value,
                    discount: p.discountPercent ? parseInt(p.discountPercent.replace('%', '')) : 0,
                    image: p.images?.[0]?.url || "",
                    rating: p.averageRating || 0,
                    rating_count: p.ratingCount || 0,
                    seller: 'Ajio',
                    source: 'Ajio',
                    product_url: `https://www.ajio.com${p.url}`
                });
            });
        }

    } catch (e) {
        console.warn("[Ajio] Failed:", e instanceof Error ? e.message : e);
    }

    return results;
}
