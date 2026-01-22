
import { scrapeProductsReal } from '../lib/scraper';

async function test() {
    console.log("Testing scraper...");
    try {
        const results = await scrapeProductsReal("laptop", 1);
        console.log(`Found ${results.length} results.`);
        results.forEach((p, i) => {
            console.log(`[${i}] Title: ${p.title.substring(0, 30)}...`);
            console.log(`     Image: ${p.image}`);
            console.log(`     Price: ${p.price}`);
        });
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
