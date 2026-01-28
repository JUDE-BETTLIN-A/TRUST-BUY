/**
 * Bing Shopping Fallback - Extract products from specific stores via BingShopping
 * 
 * Since direct scraping of Croma, Reliance, JioMart, etc. gets blocked,
 * and Bing site: search is unreliable, we use Bing Shopping API
 * which aggregates products from multiple stores.
 * 
 * This module provides fallback functions that:
 * 1. Search BingShopping for the query
 * 2. Filter results by seller/source
 * 3. Return products from the specific store
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { UnifiedSearchResult } from './types';
import { searchCache } from './cache';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0';

// Cache key for the BingShopping response
function getCacheKey(query: string): string {
    return `bing-shop-fallback:${query.toLowerCase().trim()}`;
}

// Get all products from Bing Shopping for a query (cached)
async function fetchBingShoppingProducts(query: string): Promise<UnifiedSearchResult[]> {
    const cacheKey = getCacheKey(query);
    const cached = searchCache.get<UnifiedSearchResult[]>(cacheKey);
    if (cached) {
        return cached;
    }

    const results: UnifiedSearchResult[] = [];
    const url = `https://www.bing.com/shop?q=${encodeURIComponent(query)}&FORM=SHOPTB`;

    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-IN,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
            },
            timeout: 15000,
            decompress: true
        });

        const $ = cheerio.load(data);

        // .br-item is the main selector that works for Bing Shopping
        $('.br-item, [data-prodtitle], .br-productCard').each((_, el) => {
            try {
                const $el = $(el);
                
                // Get title
                let title = $el.attr('data-prodtitle') || '';
                if (!title) {
                    const $titleLink = $el.find('a[title]').first();
                    title = $titleLink.attr('title') || $titleLink.text().trim();
                }
                if (!title) {
                    title = $el.find('.br-title, .title, h3, h4').first().text().trim();
                }
                
                // Get price
                const priceText = $el.find('.br-price, .price').first().text();
                const priceMatch = priceText.match(/[\d,]+(?:\.\d{2})?/);
                const price = priceMatch 
                    ? parseInt(priceMatch[0].replace(/[,\.]/g, '').substring(0, 10)) 
                    : 0;
                
                // Get image
                const $img = $el.find('img').first();
                const image = $img.attr('data-src') || $img.attr('src') || '';
                
                // Get link
                const link = $el.find('a[href]').first().attr('href') || '';
                
                // Get seller/store name
                const store = $el.find('.br-seller, .seller, .store').text().trim().toLowerCase();

                if (title && title.length > 5 && price > 0) {
                    results.push({
                        title: title.substring(0, 200),
                        price,
                        image,
                        rating: 0,
                        rating_count: 0,
                        seller: store,
                        source: 'BingShopping',
                        product_url: link
                    });
                }
            } catch {}
        });

        if (results.length > 0) {
            searchCache.set(cacheKey, results, 900 * 1000); // 15 min cache
        }
    } catch (e) {
        console.warn('[BingShopFallback] Failed:', e instanceof Error ? e.message : e);
    }

    return results;
}

// Filter products by seller keywords
function filterBySeller(products: UnifiedSearchResult[], keywords: string[]): UnifiedSearchResult[] {
    return products.filter(p => {
        const seller = (p.seller || '').toLowerCase();
        return keywords.some(kw => seller.includes(kw.toLowerCase()));
    });
}

// === CROMA FALLBACK ===
export async function getCromaFromBingShopping(query: string): Promise<UnifiedSearchResult[]> {
    const allProducts = await fetchBingShoppingProducts(query);
    const filtered = filterBySeller(allProducts, ['croma']);
    
    // Update source
    return filtered.map(p => ({
        ...p,
        source: 'Croma' as const,
        seller: 'Croma'
    }));
}

// === RELIANCE FALLBACK ===
export async function getRelianceFromBingShopping(query: string): Promise<UnifiedSearchResult[]> {
    const allProducts = await fetchBingShoppingProducts(query);
    const filtered = filterBySeller(allProducts, ['reliance', 'reliance digital']);
    
    return filtered.map(p => ({
        ...p,
        source: 'Reliance' as const,
        seller: 'Reliance Digital'
    }));
}

// === JIOMART FALLBACK ===
export async function getJioMartFromBingShopping(query: string): Promise<UnifiedSearchResult[]> {
    const allProducts = await fetchBingShoppingProducts(query);
    const filtered = filterBySeller(allProducts, ['jiomart', 'jio mart', 'jio']);
    
    return filtered.map(p => ({
        ...p,
        source: 'Jiomart' as const,
        seller: 'JioMart'
    }));
}

// === MEESHO FALLBACK ===
export async function getMeeshoFromBingShopping(query: string): Promise<UnifiedSearchResult[]> {
    const allProducts = await fetchBingShoppingProducts(query);
    const filtered = filterBySeller(allProducts, ['meesho']);
    
    return filtered.map(p => ({
        ...p,
        source: 'Meesho' as const,
        seller: 'Meesho'
    }));
}

// === TATACLIQ FALLBACK ===
export async function getTataCliqFromBingShopping(query: string): Promise<UnifiedSearchResult[]> {
    const allProducts = await fetchBingShoppingProducts(query);
    const filtered = filterBySeller(allProducts, ['tatacliq', 'tata cliq', 'tata']);
    
    return filtered.map(p => ({
        ...p,
        source: 'TataCliq' as const,
        seller: 'TataCliq'
    }));
}

// === SHOPCLUES FALLBACK ===
export async function getShopCluesFromBingShopping(query: string): Promise<UnifiedSearchResult[]> {
    const allProducts = await fetchBingShoppingProducts(query);
    const filtered = filterBySeller(allProducts, ['shopclues']);
    
    return filtered.map(p => ({
        ...p,
        source: 'ShopClues' as const,
        seller: 'ShopClues'
    }));
}

// === VIJAY SALES (maps to Croma for electronics category) ===
export async function getVijaySalesFromBingShopping(query: string): Promise<UnifiedSearchResult[]> {
    const allProducts = await fetchBingShoppingProducts(query);
    const filtered = filterBySeller(allProducts, ['vijay sales', 'vijaysales']);
    
    return filtered.map(p => ({
        ...p,
        source: 'Croma' as const, // Group with Croma as electronics retailer
        seller: 'Vijay Sales'
    }));
}
