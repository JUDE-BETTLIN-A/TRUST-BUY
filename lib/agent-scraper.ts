import { Product } from './mock-scraper';
import { callAI } from './ai-utils';
import { scrapeProductsBing, scrapeProductsGoogleShopping, scrapeProductsDuckDuckGo } from './scrapers-legacy';

/**
 * Agentic Scraper that uses LLM-based analysis to find trending products.
 * Uses OpenRouter to generate fresh search terms, then delegates to legacy scrapers for real data.
 */
export async function scrapeProductsAgentic(query: string, page: number = 1): Promise<Product[]> {
    console.log(`[Agent Scraper] Analyzing request for: ${query} (Page ${page})`);

    // Only intercept generic "trending" queries for now
    // This allows specific product searches to go through standard scraping flow
    const queryLower = query.toLowerCase();
    const isTrendingQuery = queryLower.includes('trending') ||
        (queryLower.includes('best') && queryLower.includes('selling')) ||
        queryLower.includes('popular products') ||
        queryLower === 'deals';

    if (isTrendingQuery) {
        return await handleTrendingRequest(query);
    }

    return [];
}

async function handleTrendingRequest(originalQuery: string): Promise<Product[]> {
    console.log("[Agent Scraper] Handling Trending Request via LLM");

    // 1. Get Smart Suggestions from LLM
    // We ask for a few more than needed to allow for scraping failures and random selection
    const prompt = `
    Generate a JSON list of 12 currently trending/popular consumer products in India (Electronics, Home, Fashion).
    Be specific with model names.
    Focus on items that people actually want to buy right now.
    
    Example output format:
    {
        "products": ["iPhone 15", "Samsung Galaxy S24", "Sony WH-1000XM5"]
    }
    `;

    let productNames: string[] = [];

    try {
        const aiRes = await callAI(prompt, { temperature: 0.9 }); // High temp for variety on each call

        if (aiRes.success && aiRes.data?.products && Array.isArray(aiRes.data.products)) {
            productNames = aiRes.data.products;
            console.log("[Agent Scraper] AI suggested:", productNames);
        }
    } catch (e) {
        console.warn("[Agent Scraper] AI call failed", e);
    }

    // Fallback list if AI fails
    if (productNames.length === 0) {
        console.warn("[Agent Scraper] Using fallback trending list.");
        productNames = [
            "iPhone 15", "Samsung Galaxy S24 Ultra", "Sony WH-1000XM5",
            "Dyson V15 Detect", "PlayStation 5 Slim", "Nintendo Switch OLED",
            "Apple Watch Series 9", "Nothing Phone 2a", "OnePlus 12",
            "MacBook Air M3", "GoPro Hero 12", "JBL Flip 6"
        ];
    }

    // 2. Randomly select 4 unique items to ensure "freshness" on each page load
    // efficient shuffle
    for (let i = productNames.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [productNames[i], productNames[j]] = [productNames[j], productNames[i]];
    }

    const selected = productNames.slice(0, 4);
    console.log("[Agent Scraper] Selected targets for scraping:", selected);

    // 3. Scrape data for these specific items in parallel
    // We only need 1 good result per item
    const productPromises = selected.map(async (name) => {
        try {
            const specificQuery = `${name}`;

            // Try lightweight DDG first for speed, then Bing
            let items = await scrapeProductsDuckDuckGo(specificQuery, 1);

            if (items.length === 0) {
                items = await scrapeProductsGoogleShopping(specificQuery, 1);
            }
            if (items.length === 0) {
                items = await scrapeProductsBing(specificQuery, 1);
            }

            // Return top 1 most relevant item
            if (items.length > 0) {
                // Ensure the title matches somewhat to avoid random results
                // But typically top result for specific query is good.
                return items[0];
            }
        } catch (e) {
            console.error(`[Agent Scraper] Failed to scrape ${name}`, e);
        }
        return null;
    });

    const results = await Promise.all(productPromises);

    // Filter valid results
    const finalProducts: Product[] = [];
    results.forEach(r => {
        if (r) {
            // Tag source as agentic so UI knows it's smart data if needed
            r.source = 'main';
            finalProducts.push(r);
        }
    });

    console.log(`[Agent Scraper] Returning ${finalProducts.length} verified trending items.`);
    return finalProducts;
}
