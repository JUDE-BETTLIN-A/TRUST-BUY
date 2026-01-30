import axios from 'axios';
import * as cheerio from 'cheerio';

async function debugDuckDuckGo() {
    const query = "iPhone 15 Pro Max";
    console.log(`Fetching DuckDuckGo shopping for: ${query}`);

    try {
        const url = `https://duckduckgo.com/?q=${encodeURIComponent(query)}+shopping&ia=shopping`;

        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache',
            },
            timeout: 8000
        });

        // Save the HTML for analysis
        const fs = require('fs');
        fs.writeFileSync('debug_duckduckgo_iphone.html', data);
        console.log('Saved debug_duckduckgo_iphone.html');

        const $ = cheerio.load(data);

        // Check for product containers
        const products: any[] = [];
        $('.product__body').each((i, el) => {
            const title = $(el).find('.product__title').text().trim();
            const price = $(el).find('.product__price').text().trim();
            const store = $(el).find('.product__merchant').text().trim();

            if (title && price) {
                products.push({ title, price, store });
            }
        });

        console.log(`Found ${products.length} products:`);
        products.slice(0, 5).forEach((p: any) => console.log(`- ${p.title}: ${p.price} (${p.store})`));

    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

debugDuckDuckGo();