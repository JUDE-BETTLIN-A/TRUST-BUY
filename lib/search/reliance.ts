import axios from 'axios';
import { UnifiedSearchResult } from './types';

// Reliance Digital API
export async function searchReliance(query: string): Promise<UnifiedSearchResult[]> {
    const results: UnifiedSearchResult[] = [];
    // API endpoint often used by their frontend
    const url = `https://www.reliancedigital.in/r/v2/search?q=${encodeURIComponent(query)}&page=0&size=20`;

    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 5000
        });

        if (data && data.data && data.data.products && Array.isArray(data.data.products)) {
            data.data.products.forEach((p: any) => {
                results.push({
                    title: p.name,
                    price: parseFloat(p.price?.value || 0),
                    mrp: parseFloat(p.mrp?.value || 0),
                    discount: 0, // Reliance API might not explicitly send %
                    image: `https://www.reliancedigital.in${p.images?.[0]?.url || ""}`,
                    rating: parseFloat(p.averageRating) || 0,
                    rating_count: 0,
                    seller: 'Reliance Digital',
                    source: 'Reliance',
                    product_url: `https://www.reliancedigital.in${p.url}`
                });
            });
        }

    } catch (e) {
        console.warn("[Reliance] Failed:", e instanceof Error ? e.message : e);
    }

    return results;
}
