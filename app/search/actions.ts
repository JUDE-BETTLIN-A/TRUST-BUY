"use server";

import { scrapeProductsReal } from '@/lib/scraper';
import { searchProducts as searchProductsMock } from '@/lib/mock-scraper';
import { Product } from '@/lib/mock-scraper';

export async function searchProductsAction(query: string, page: number = 1): Promise<Product[]> {
    if (!query) return [];

    console.log(`Searching for: ${query} (Page ${page})`);

    // Try real scraping first
    try {
        const realProducts = await scrapeProductsReal(query, page);
        if (realProducts.length >= 4) {
            return realProducts;
        }

        // If we found some real products but not enough to fill a row (4),
        // let's backfill with high-quality mock data (especially for 'trending' queries).
        if (realProducts.length > 0) {
            console.log(`Real scraping found only ${realProducts.length} items. Backfilling with mock data.`);
            const mockProducts = await searchProductsMock(query, page);

            // Filter out duplicates based on title similarity
            const uniqueMock = mockProducts.filter(m =>
                !realProducts.some(r => r.title.includes(m.title) || m.title.includes(r.title))
            );

            return [...realProducts, ...uniqueMock];
        }

    } catch (error) {
        console.error("Real scraping failed, falling back to mock:", error);
    }

    // Fallback to mock if real scraping returns nothing or fails
    console.log("Using mock data fallback.");
    return await searchProductsMock(query, page);
}
