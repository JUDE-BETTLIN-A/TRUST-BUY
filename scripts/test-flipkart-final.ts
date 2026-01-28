import { searchFlipkart } from '../lib/search/flipkart';

async function test() {
    console.log('Testing Flipkart scraper...\n');
    
    // Test with a specific query
    const query = 'iphone 15';
    console.log(`Query: ${query}\n`);
    
    const results = await searchFlipkart(query);
    
    console.log(`Found ${results.length} products\n`);
    
    results.slice(0, 8).forEach((r, i) => {
        console.log(`${i+1}. ${r.title.substring(0, 55)}`);
        console.log(`   Price: ₹${r.price || 'N/A'}`);
        console.log(`   Source: ${r.source}`);
        console.log(`   URL: ${r.product_url.substring(0, 60)}...`);
        console.log('');
    });
}

test();
