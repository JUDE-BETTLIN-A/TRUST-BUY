import { searchAmazon } from './amazon';
import { searchFlipkart } from './flipkart';
import { searchCroma } from './croma';
import { searchMyntra } from './myntra';
import { searchAjio } from './ajio';
import { searchReliance } from './reliance';
import { searchTataCliq } from './tatacliq';
import { searchSnapdeal } from './snapdeal';
import { searchShopClues } from './shopclues';

import { UnifiedSearchResult } from './types';
import { calculateTrustScore } from './trust-score';
import { isAccessory } from './utils';

/**
 * The Aggregator Service
 * Executes all scrapers in parallel and normalizes results
 */
export async function searchAll(query: string): Promise<UnifiedSearchResult[]> {
    console.log(`[Aggregator] Parallel search for: ${query}`);

    // Execute in parallel with improved logging
    const searchPromises = [
        searchAmazon(query),
        searchFlipkart(query),
        searchCroma(query),
        searchMyntra(query),
        searchAjio(query),
        searchReliance(query),
        searchTataCliq(query),
        searchSnapdeal(query),
        searchShopClues(query)
    ].map(async (p, idx) => {
        const sources = ['Amazon', 'Flipkart', 'Croma', 'Myntra', 'Ajio', 'Reliance', 'TataCliq', 'Snapdeal', 'ShopClues'];
        try {
            const res = await p;
            console.log(`[Aggregator] ${sources[idx]}: ${res.length} results`);
            return res;
        } catch (e) {
            console.error(`[Aggregator] ${sources[idx]} FAILED`, e);
            return [];
        }
    });

    const results = await Promise.all(searchPromises);

    // Flatten results
    const flatResults = results.flat();

    // Clean and Filter
    const filtered = flatResults.filter(item => {
        // 1. Filter out ₹0 or negative prices (Data Errors)
        if (item.price <= 0) return false;

        // 2. Relevance: Filter out accessories if the query looks like a device search
        if (isAccessory(item.title, query)) {
            // We can either drop them or check if we have enough device results
            // For now, let's drop them to satisfy "fix this" (it showing wallet)
            return false;
        }

        return true;
    });

    // Calculate Trust Scores & Sort
    const processed = filtered.map(item => ({
        ...item,
        trust_score: calculateTrustScore(item)
    })).sort((a, b) => (b.trust_score || 0) - (a.trust_score || 0));

    console.log(`[Aggregator] Found ${processed.length} valid results after filtering.`);
    return processed;
}
