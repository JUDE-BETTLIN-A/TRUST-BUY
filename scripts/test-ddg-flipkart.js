// Test the full Flipkart scraper with TypeScript
const { execSync } = require('child_process');

console.log('Testing Flipkart scraper via tsx...\n');

try {
    const result = execSync(`npx tsx -e "
        import { searchFlipkart } from './lib/search/flipkart';
        
        (async () => {
            console.log('Searching for: headphones');
            const results = await searchFlipkart('headphones');
            console.log('Results:', results.length);
            
            results.slice(0, 5).forEach((r, i) => {
                console.log(\\\`\\\${i+1}. \\\${r.title.substring(0, 50)}\\\`);
                console.log(\\\`   Price: ₹\\\${r.price}\\\`);
                console.log(\\\`   URL: \\\${r.product_url.substring(0, 60)}...\\\`);
            });
        })();
    "`, { encoding: 'utf-8', cwd: process.cwd() });
    console.log(result);
} catch (e) {
    console.log('Error:', e.message);
    if (e.stdout) console.log(e.stdout.toString());
    if (e.stderr) console.log(e.stderr.toString());
}
