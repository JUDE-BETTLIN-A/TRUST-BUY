
import axios from 'axios';
import * as cheerio from 'cheerio';

async function debugBingImages() {
    const query = "samsung s22";
    const url = `https://www.bing.com/shop?q=${encodeURIComponent(query)}`;

    console.log(`Fetching ${url}...`);

    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            }
        });

        const $ = cheerio.load(data);
        console.log("Page title:", $('title').text());

        const items = $('.br-item');
        console.log(`Found ${items.length} items`);

        items.each((i, el) => {
            if (i > 3) return; // check first 4

            console.log(`\n--- Item ${i} ---`);
            const title = $(el).find('.br-title').text().trim();
            console.log("Title:", title);

            const imgEl = $(el).find('img');
            if (imgEl.length > 0) {
                console.log("Image found. Attributes:");
                const attrs = imgEl.attr();
                for (const key in attrs) {
                    if (key === 'src' || key.includes('data')) {
                        console.log(`  ${key}: ${attrs[key]?.substring(0, 100)}...`);
                    }
                }
            } else {
                console.log("No <img> tag found in .br-item");
            }
        });

    } catch (e) {
        console.error("Error:", e);
    }
}

debugBingImages();
