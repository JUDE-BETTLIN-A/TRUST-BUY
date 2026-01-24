"use server";

import { scrapeProductsReal } from '@/lib/scraper';
import { searchProducts as searchProductsMock } from '@/lib/mock-scraper';
import { Product } from '@/lib/mock-scraper';
import { aggregateProducts } from '@/lib/aggregator';

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
        // Try real scraping first
        const realProducts = await scrapeProductsReal(cleanQuery, page);

        if (realProducts.length > 0) {
            console.log(`[Search] Found ${realProducts.length} real products`);
            results = realProducts;
        } else {
            // Fallback to mock data
            console.log("[Search] No real products found, using mock data");
            results = await searchProductsMock(cleanQuery, page);
        }

    } catch (error) {
        console.error("[Search] Error:", error);
        // Fallback to mock on error
        results = await searchProductsMock(cleanQuery, page);
    }

    // Aggregate and return
    return aggregateProducts(results);
}
