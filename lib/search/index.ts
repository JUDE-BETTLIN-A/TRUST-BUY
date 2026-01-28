import { searchAmazon } from './amazon';
import { searchFlipkart } from './flipkart';
import { searchCroma } from './croma';
import { searchMyntra } from './myntra';
import { searchAjio } from './ajio';
import { searchReliance } from './reliance';
import { searchTataCliq } from './tatacliq';
import { searchSnapdeal } from './snapdeal';
import { searchShopClues } from './shopclues';
import { searchMeesho } from './meesho';
import { searchFallbackSources } from './fallback-sources';
import { isProxyConfigured } from './proxy';

import { UnifiedSearchResult } from './types';
import { calculateTrustScore } from './trust-score';
import { isAccessory } from './utils';

// Wrapper for Meesho - it already returns UnifiedSearchResult[]
async function searchMeeshoWrapper(query: string): Promise<UnifiedSearchResult[]> {
    return searchMeesho(query);
}

/**
 * The Aggregator Service
 * Executes all scrapers in parallel and normalizes results
 * Falls back to alternative sources (91mobiles, Smartprix, etc.) when primary sources fail
 */
export async function searchAll(query: string): Promise<UnifiedSearchResult[]> {
    console.log(`[Aggregator] Parallel search for: ${query}`);
    console.log(`[Aggregator] Proxy configured: ${isProxyConfigured()}`);

    // Primary sources - direct e-commerce sites
    const primarySources = [
        { name: 'Amazon', fn: searchAmazon },
        { name: 'Flipkart', fn: searchFlipkart },
        { name: 'Croma', fn: searchCroma },
        { name: 'Myntra', fn: searchMyntra },
        { name: 'Ajio', fn: searchAjio },
        { name: 'Reliance', fn: searchReliance },
        { name: 'TataCliq', fn: searchTataCliq },
        { name: 'Snapdeal', fn: searchSnapdeal },
        { name: 'ShopClues', fn: searchShopClues },
        { name: 'Meesho', fn: searchMeeshoWrapper }
    ];

    // Execute primary sources in parallel
    const primaryPromises = primarySources.map(async ({ name, fn }) => {
        try {
            const res = await fn(query);
            console.log(`[Aggregator] ${name}: ${res.length} results`);
            return { name, results: res, failed: res.length === 0 };
        } catch (e) {
            console.error(`[Aggregator] ${name} FAILED`, e);
            return { name, results: [], failed: true };
        }
    });

    const primaryResults = await Promise.all(primaryPromises);

    // Count failed sources
    const failedSources = primaryResults.filter(r => r.failed).map(r => r.name);
    const successfulResults = primaryResults.flatMap(r => r.results);

    console.log(`[Aggregator] Primary sources completed. Failed: ${failedSources.length}/${primarySources.length}`);

    // If more than half failed, use fallback sources
    let fallbackResults: UnifiedSearchResult[] = [];
    if (failedSources.length >= 4 || successfulResults.length < 20) {
        console.log(`[Aggregator] Triggering fallback sources (${failedSources.join(', ')} failed)`);
        fallbackResults = await searchFallbackSources(query);
    }

    // Combine all results
    const allResults = [...successfulResults, ...fallbackResults];

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

    // Remove duplicates based on title similarity
    const seen = new Set<string>();
    const deduplicated = filtered.filter(item => {
        const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    // Calculate Trust Scores & Sort
    const processed = deduplicated.map(item => ({
        ...item,
        trust_score: calculateTrustScore(item)
    })).sort((a, b) => (b.trust_score || 0) - (a.trust_score || 0));

    console.log(`[Aggregator] Found ${processed.length} valid results after filtering.`);
    return processed;
}
