import axios from 'axios';
import * as cheerio from 'cheerio';
import { UnifiedSearchResult } from './types';
import { searchCache } from './cache';

/**
 * Bing Site Search - Uses Bing to find products from specific e-commerce sites
 * 
 * This is the technique used by many Telegram bots:
 * - Use search engines as a proxy to find products
 * - Avoids direct scraping which triggers bot detection
 * - More reliable than hitting e-commerce sites directly
 */

const BING_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
};

interface SiteConfig {
    site: string;
    source: string;
    seller: string;
}

const SITE_CONFIGS: SiteConfig[] = [
    { site: 'croma.com', source: 'Croma', seller: 'Croma' },
    { site: 'reliancedigital.in', source: 'Reliance', seller: 'Reliance Digital' },
    { site: 'jiomart.com', source: 'Jiomart', seller: 'JioMart' },
    { site: 'tatacliq.com', source: 'TataCliq', seller: 'TataCliq' },
    { site: 'meesho.com', source: 'Meesho', seller: 'Meesho' },
    { site: 'shopclues.com', source: 'ShopClues', seller: 'ShopClues' },
];

export async function searchViaBing(query: string, siteConfig: SiteConfig): Promise<UnifiedSearchResult[]> {
    const results: UnifiedSearchResult[] = [];
    const cacheKey = `bing-site:${siteConfig.site}:${query.toLowerCase().trim()}`;
    
    const cached = searchCache.get<UnifiedSearchResult[]>(cacheKey);
    if (cached) {
        console.log(`[Bing-${siteConfig.source}] Cache HIT - ${cached.length} results`);
        return cached;
    }
    
    try {
        // Use Bing with site: operator
        const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query + ' site:' + siteConfig.site + ' price')}&count=30`;
        
        const { data } = await axios.get(searchUrl, {
            headers: BING_HEADERS,
            timeout: 12000,
        });

        const $ = cheerio.load(data);

        // Bing search results
        $('#b_results .b_algo').each((_, el) => {
            try {
                const $result = $(el);
                const $link = $result.find('h2 a');
                const href = $link.attr('href') || '';
                const title = $link.text().trim();
                const snippet = $result.find('.b_caption p').text().trim();

                // Skip if not from our target site
                if (!href.includes(siteConfig.site)) return;

                // Try to extract price from snippet or title
                let price = 0;
                const pricePatterns = [
                    /₹\s*([\d,]+)/,
                    /Rs\.?\s*([\d,]+)/i,
                    /INR\s*([\d,]+)/i,
                    /(\d{2,6})\s*(?:only|price)/i,
                ];
                
                for (const pattern of pricePatterns) {
                    const match = snippet.match(pattern) || title.match(pattern);
                    if (match) {
                        price = parseInt(match[1].replace(/,/g, ''));
                        break;
                    }
                }

                // Get image if available
                const image = $result.find('img').first().attr('src') || '';

                if (title && href) {
                    // Clean title
                    const cleanTitle = title
                        .replace(new RegExp(`\\s*[-|]\\s*${siteConfig.source}.*$`, 'i'), '')
                        .replace(/\s*[-|]\s*Buy.*$/i, '')
                        .trim();
                    
                    if (cleanTitle.length > 5) {
                        results.push({
                            title: cleanTitle,
                            price: price || 0,
                            image,
                            rating: 0,
                            rating_count: 0,
                            seller: siteConfig.seller,
                            source: siteConfig.source as any,
                            product_url: href
                        });
                    }
                }
            } catch (e) { /* Continue */ }
        });

        if (results.length > 0) {
            searchCache.set(cacheKey, results, 900); // 15 min cache
        }
        
        console.log(`[Bing-${siteConfig.source}] Found ${results.length} products`);
    } catch (e) {
        console.warn(`[Bing-${siteConfig.source}] Failed:`, e instanceof Error ? e.message : e);
    }

    return results;
}

// Search all sites via Bing in parallel
export async function searchAllSitesViaBing(query: string): Promise<UnifiedSearchResult[]> {
    console.log(`[Bing-Sites] Searching all sites for: ${query}`);
    
    const promises = SITE_CONFIGS.map(config => 
        searchViaBing(query, config).catch(e => {
            console.warn(`[Bing-${config.source}] Error:`, e instanceof Error ? e.message : e);
            return [] as UnifiedSearchResult[];
        })
    );
    
    const results = await Promise.all(promises);
    const allResults = results.flat();
    
    console.log(`[Bing-Sites] Total: ${allResults.length} products from ${SITE_CONFIGS.length} sites`);
    return allResults;
}

// Individual site search functions that use Bing as fallback
export async function searchCromaViaBing(query: string): Promise<UnifiedSearchResult[]> {
    return searchViaBing(query, { site: 'croma.com', source: 'Croma', seller: 'Croma' });
}

export async function searchRelianceViaBing(query: string): Promise<UnifiedSearchResult[]> {
    return searchViaBing(query, { site: 'reliancedigital.in', source: 'Reliance', seller: 'Reliance Digital' });
}

export async function searchJioMartViaBing(query: string): Promise<UnifiedSearchResult[]> {
    return searchViaBing(query, { site: 'jiomart.com', source: 'Jiomart', seller: 'JioMart' });
}

export async function searchTataCliqViaBing(query: string): Promise<UnifiedSearchResult[]> {
    return searchViaBing(query, { site: 'tatacliq.com', source: 'TataCliq', seller: 'TataCliq' });
}

export async function searchMeeshoViaBing(query: string): Promise<UnifiedSearchResult[]> {
    return searchViaBing(query, { site: 'meesho.com', source: 'Meesho', seller: 'Meesho' });
}

export async function searchShopCluesViaBing(query: string): Promise<UnifiedSearchResult[]> {
    return searchViaBing(query, { site: 'shopclues.com', source: 'ShopClues', seller: 'ShopClues' });
}
