import { scrapeProductsReal } from '../lib/scraper';

async function test() {
    console.log("Testing scraper for iPhone 15 Pro Max...");
    try {
        const results = await scrapeProductsReal('iPhone 15 Pro Max', 1);
        console.log(`Found ${results.length} results.`);
        results.slice(0, 5).forEach((p, i) => {
            console.log(`[${i}] Title: ${p.title.substring(0, 50)}...`);
            console.log(`     Price: ${p.price}`);
            console.log(`     Store: ${p.storeName}`);
        });
    } catch (e) {
        console.error("Error:", e);
    }
}

test();