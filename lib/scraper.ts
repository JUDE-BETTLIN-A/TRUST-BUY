import { Product } from './mock-scraper';
import { scrapeProductsAgentic } from './agent-scraper';
import {
    scrapeProductsBing,
    scrapeProductsDuckDuckGo,
    scrapeProductsGoogleShopping,
    scrapeProductsEbay,
    ScrapedProduct
} from './scrapers-legacy';

import { isAccessory } from './search/utils';

export type { ScrapedProduct };

export async function scrapeProductsReal(query: string, page: number = 1): Promise<Product[]> {
    let results: Product[] = [];

    // 0. PRIORITY: Agentic Scraper (LLM-based validation)
    try {
        console.log(`[Scraper] Attempting Agentic Scrape for: ${query}`);
        const agentResults = await scrapeProductsAgentic(query, page);
        if (agentResults.length > 0) {
            console.log(`[Scraper] Agentic scrape successful. Found ${agentResults.length} items.`);
            return agentResults.filter((p: Product) => !isAccessory(p.title, query));
        }
    } catch (e) {
        console.warn("[Scraper] Agentic scrape failed, falling back to legacy:", e);
    }

    // 1. Fallback: Bing Shopping (Legacy)
    const bingProducts = await scrapeProductsBing(query, page);
    if (bingProducts.length > 0) {
        results = bingProducts;
    } else {
        // 2. Fallback to DuckDuckGo HTML
        const ddgProducts = await scrapeProductsDuckDuckGo(query, page);
        if (ddgProducts.length > 0) {
            results = ddgProducts;
        } else {
            // 3. Last resort: Google Shopping
            const googleProducts = await scrapeProductsGoogleShopping(query, page);
            if (googleProducts.length > 0) {
                results = googleProducts;
            } else {
                // 4. Fallback to eBay
                results = await scrapeProductsEbay(query, page);
            }
        }
    }

    // STRICT FILTER: 
    // 1. Remove any product without a valid image URL
    // 2. Remove accessories if the query looks like a device search (wallet cases, etc.)
    return results.filter(p =>
        p.image &&
        p.image.length > 10 &&
        (p.image.startsWith("http") || p.image.startsWith("data:image")) &&
        !isAccessory(p.title, query)
    );
}
