"use server";

import { scrapeProductsReal } from '@/lib/scraper';
import { searchProducts as searchProductsMock } from '@/lib/mock-scraper';
import { discoverProducts } from '@/lib/discovery-engine';
import { Product } from '@/lib/mock-scraper';

import { aggregateProducts } from '@/lib/aggregator';

// Cache for discovery results across pages
let discoveryCache: { query: string; products: Product[]; lastPage: number } | null = null;

export async function searchProductsAction(query: string, page: number = 1): Promise<Product[]> {
    if (!query) return [];

    // Category-specific query expansion for better Indian e-commerce results
    // Using specific product names that search engines will return shopping results for
    const categoryExpansions: Record<string, string> = {
        'electronics': 'iPhone Samsung Galaxy laptop headphones smartwatch',
        'home': 'sofa bed mattress LED TV air conditioner refrigerator',
        'fashion': 'Nike shoes Adidas t-shirt Levis jeans jacket',
        'sports': 'cricket bat football shoes gym equipment yoga mat',
        'auto': 'car dash cam tyre inflator seat cover mobile holder',
    };

    const lowerQuery = query.toLowerCase().trim();
    const expandedQuery = categoryExpansions[lowerQuery] || query;

    console.log(`Searching for: "${query}" -> "${expandedQuery}" (Page ${page})`);

    let rawResults: Product[] = [];

    try {
        // For page 1, always try fresh scraping
        if (page === 1) {
            discoveryCache = null; // Reset cache for new searches

            try {
                const realProducts = await scrapeProductsReal(expandedQuery, page);

                if (realProducts.length > 0) {
                    // Backfill with mock if needed but prioritize real
                    if (realProducts.length < 4) {
                        console.log(`Real scraping found only ${realProducts.length} items. Backfilling.`);
                        const mockProducts = await searchProductsMock(expandedQuery, page);
                        rawResults = [...realProducts, ...mockProducts];
                    } else {
                        rawResults = realProducts;
                    }
                } else {
                    console.log("Using mock data fallback for page 1.");
                    rawResults = await searchProductsMock(expandedQuery, page);
                }

            } catch (error) {
                console.error("Real scraping failed:", error);
                rawResults = await searchProductsMock(expandedQuery, page);
            }

        } else {
            // Page 2+ logic with discovery engine
            const realProducts = await scrapeProductsReal(expandedQuery, page);

            if (realProducts.length >= 4) {
                rawResults = realProducts;
            } else {
                console.log(`[Page ${page}] Pagination sparse. Activating Discovery Engine...`);

                // Check cache
                if (discoveryCache && discoveryCache.query === expandedQuery) {
                    const startIdx = (page - 1) * 20;
                    const endIdx = page * 20;
                    const cachedSlice = discoveryCache.products.slice(startIdx, endIdx);
                    if (cachedSlice.length > 0) {
                        return aggregateProducts(cachedSlice); // Return cached aggregated
                    }
                }

                // Run discovery
                const { products: discoveredProducts } = await discoverProducts(expandedQuery, {
                    maxProducts: 50,
                    maxDepth: 2
                });

                if (discoveredProducts.length > 0) {
                    discoveryCache = { query: expandedQuery, products: discoveredProducts, lastPage: page };
                    const startIdx = (page - 1) * 20;
                    const endIdx = page * 20;
                    rawResults = discoveredProducts.slice(startIdx, endIdx);
                } else {
                    rawResults = await searchProductsMock(expandedQuery, page);
                }
            }
        }
    } catch (err) {
        console.error("Search action global error", err);
        rawResults = await searchProductsMock(expandedQuery, page);
    }

    // FINAL AGGREGATION & NORMALIZATION
    // This de-duplicates and normalizes data across all sources
    return aggregateProducts(rawResults);
}
