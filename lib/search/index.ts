import { searchAllAggregators } from './aggregator-sources';
import { searchFallbackSources } from './fallback-sources';
import { searchFlipkart } from './flipkart';
import { searchAmazon } from './amazon';
import { searchCroma } from './croma';
import { searchReliance } from './reliance';
import { searchSnapdeal } from './snapdeal';
import { searchTataCliq } from './tatacliq';
import { searchMeesho } from './meesho';
import { searchShopClues } from './shopclues';
import { searchJioMart } from './jiomart';
import { searchCache } from './cache';

import { UnifiedSearchResult } from './types';
import { calculateTrustScore } from './trust-score';
import { isAccessory } from './utils';

/**
 * The Aggregator Service - HYBRID VERSION
 * 
 * This service uses MULTIPLE sources in parallel:
 * 1. Direct e-commerce scrapers (Flipkart, Amazon, Croma, Reliance, Snapdeal, TataCliq, Meesho, ShopClues)
 *    - Using Telegram bot techniques (Firefox headers, data attributes, etc.)
 * 2. Price comparison aggregator sites (Bing Shopping for now)
 * 3. Fallback sources (Gadgets360, Indiamart, etc.)
 * 4. Caching to reduce requests and improve response times
 */
export async function searchAll(query: string): Promise<UnifiedSearchResult[]> {
    console.log(`[Aggregator] Hybrid search for: ${query}`);

    // Check cache first
    const cacheKey = `search:${query.toLowerCase().trim()}`;
    const cached = searchCache.get<UnifiedSearchResult[]>(cacheKey);
    if (cached) {
        console.log(`[Aggregator] Cache HIT for "${query}" - returning ${cached.length} results`);
        return cached;
    }

    console.log(`[Aggregator] Cache MISS for "${query}" - fetching from all sources`);

    // Run ALL sources in parallel for maximum coverage
    const sourcePromises = [
        // Direct e-commerce scrapers - Major sites
        searchFlipkart(query).catch(err => {
            console.warn('[Flipkart] Failed:', err instanceof Error ? err.message : err);
            return [] as UnifiedSearchResult[];
        }),
        searchAmazon(query).catch(err => {
            console.warn('[Amazon] Failed:', err instanceof Error ? err.message : err);
            return [] as UnifiedSearchResult[];
        }),
        searchCroma(query).catch(err => {
            console.warn('[Croma] Failed:', err instanceof Error ? err.message : err);
            return [] as UnifiedSearchResult[];
        }),
        searchReliance(query).catch(err => {
            console.warn('[Reliance] Failed:', err instanceof Error ? err.message : err);
            return [] as UnifiedSearchResult[];
        }),
        // Additional e-commerce scrapers
        searchSnapdeal(query).catch(err => {
            console.warn('[Snapdeal] Failed:', err instanceof Error ? err.message : err);
            return [] as UnifiedSearchResult[];
        }),
        searchTataCliq(query).catch(err => {
            console.warn('[TataCliq] Failed:', err instanceof Error ? err.message : err);
            return [] as UnifiedSearchResult[];
        }),
        searchMeesho(query).catch(err => {
            console.warn('[Meesho] Failed:', err instanceof Error ? err.message : err);
            return [] as UnifiedSearchResult[];
        }),
        searchShopClues(query).catch(err => {
            console.warn('[ShopClues] Failed:', err instanceof Error ? err.message : err);
            return [] as UnifiedSearchResult[];
        }),
        searchJioMart(query).catch(err => {
            console.warn('[JioMart] Failed:', err instanceof Error ? err.message : err);
            return [] as UnifiedSearchResult[];
        }),
        // Aggregator sources (Bing Shopping, etc.)
        searchAllAggregators(query).catch(err => {
            console.warn('[Aggregators] Failed:', err instanceof Error ? err.message : err);
            return [] as UnifiedSearchResult[];
        }),
    ];

    const results = await Promise.all(sourcePromises);
    
    // Log results from each source
    const sourceNames = ['Flipkart', 'Amazon', 'Croma', 'Reliance', 'Snapdeal', 'TataCliq', 'Meesho', 'ShopClues', 'JioMart', 'Aggregators'];
    results.forEach((res, idx) => {
        console.log(`[Search] ${sourceNames[idx]}: ${res.length} results`);
    });

    // Combine all results
    let allResults = results.flat();

    // If we got very few results, try fallback sources too
    if (allResults.length < 5) {
        console.log(`[Aggregator] Low results (${allResults.length}), trying fallback sources...`);
        try {
            const fallbackResults = await searchFallbackSources(query);
            console.log(`[Aggregator] Got ${fallbackResults.length} fallback results`);
            allResults = [...allResults, ...fallbackResults];
        } catch (error) {
            console.error('[Aggregator] Fallback sources failed:', error);
        }
    }

    // Clean and Filter
    const filtered = allResults.filter(item => {
        // 1. Filter out ₹0 or negative prices (Data Errors)
        if (item.price <= 0) return false;

        // 2. Relevance: Filter out accessories if the query looks like a device search
        if (isAccessory(item.title, query)) {
            return false;
        }

        return true;
    });

    // Remove duplicates based on title similarity - LESS AGGRESSIVE
    const seen = new Set<string>();
    const deduplicated = filtered.filter(item => {
        // Use shorter key for less aggressive dedup (only first 30 chars, normalized)
        const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    // Calculate Trust Scores & Sort
    const processed = deduplicated.map(item => ({
        ...item,
        trust_score: calculateTrustScore(item)
    })).sort((a, b) => (b.trust_score || 0) - (a.trust_score || 0));

    // Cache the results for 15 minutes
    if (processed.length > 0) {
        searchCache.set(cacheKey, processed);
        console.log(`[Aggregator] Cached ${processed.length} results for "${query}"`);
    }

    console.log(`[Aggregator] Found ${processed.length} valid results after filtering.`);
    return processed;
}
