import axios from 'axios';
import { UnifiedSearchResult } from './types';

export async function searchTataCliq(query: string): Promise<UnifiedSearchResult[]> {
    const results: UnifiedSearchResult[] = [];
    const url = `https://www.tatacliq.com/marketplacewebservices/v2/mpl/products/searchProducts/?searchText=${encodeURIComponent(query)}:relevance:inStockFlag:true&isKeywordRedirect=false&isKeywordRedirectEnabled=true&channel=WEB&isTextSearch=true&isFilter=false&page=0&isPwa=true&pageSize=20&typeID=all`;

    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 5000
        });

        if (data && data.searchresult && Array.isArray(data.searchresult)) {
            data.searchresult.forEach((p: any) => {
                results.push({
                    title: p.productname,
                    price: parseFloat(p.price?.sellingPrice?.value || 0),
                    mrp: parseFloat(p.mrpPrice?.value || 0),
                    discount: p.price?.discountPercent,
                    image: p.imageURL ? (p.imageURL.startsWith('//') ? `https:${p.imageURL}` : p.imageURL) : "",
                    rating: parseFloat(p.averageRating) || 0,
                    rating_count: p.ratingCount || 0,
                    seller: 'TataCliq',
                    source: 'TataCliq',
                    product_url: `https://www.tatacliq.com${p.webURL}`
                });
            });
        }
    } catch (e) {
        console.warn("[TataCliq] Failed:", e instanceof Error ? e.message : e);
    }

    return results;
}
