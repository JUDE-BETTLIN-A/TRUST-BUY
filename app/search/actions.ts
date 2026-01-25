"use server";

import { scrapeProductsReal } from '@/lib/scraper';
// Mock imported removed as per user request to rely on real data
// import { searchProducts as searchProductsMock } from '@/lib/mock-scraper';
import { Product } from '@/lib/mock-scraper';
import { aggregateProducts } from '@/lib/aggregator';
import { searchAll } from '@/lib/search'; // NEW Aggregator

/**
 * Search for products - simplified and direct
 * No query expansion, no AI enhancement - just search what the user typed
 */
export async function searchProductsAction(query: string, page: number = 1): Promise<Product[]> {
    if (!query || query.trim().length === 0) return [];

    const cleanQuery = query.trim();
    console.log(`[Search] Searching for: "${cleanQuery}" (Page ${page})`);

    let results: Product[] = [];

    try {
        // 1. New Parallel Aggregator System (Amazon, Flipkart, etc.)
        const aggregatorResults = await searchAll(cleanQuery);

        if (aggregatorResults.length > 0) {
            // Map UnifiedSearchResult -> Product (Frontend Legacy Type)
            results = aggregatorResults.map(item => ({
                id: `real-${item.source}-${Math.random().toString(36).slice(2)}`,
                title: item.title,
                price: `₹${item.price.toLocaleString('en-IN')}`,
                originalPrice: item.mrp ? `₹${item.mrp.toLocaleString('en-IN')}` : undefined,
                image: item.image,
                storeName: item.source,
                model: "N/A",
                category: "General",
                brand: "Generic",
                bestPrice: false,
                rating: item.rating,
                trustScoreBadge: (item.trust_score || 0) > 80 ? "Excellent" : "Good",
                link: item.product_url,
                source: 'main'
            }));
            console.log(`[Search] Aggregator found ${results.length} items.`);
        }

        // 2. Legacy Scraper Fallback (Bing/DDG)
        // Only if aggregator yields low results (blocked or empty)
        if (results.length < 5) {
            console.log("[Search] Aggregator low results, fetching legacy fallback...");
            const legacyResults = await scrapeProductsReal(cleanQuery, page);
            results = [...results, ...legacyResults];
        }

        if (results.length === 0) {
            console.log("[Search] No real products found.");
            // No mock fallback requested
        }

    } catch (error) {
        console.error("[Search] Error:", error);
        // No mock fallback on error
    }

    // Aggregate and return
    return aggregateProducts(results);
}
