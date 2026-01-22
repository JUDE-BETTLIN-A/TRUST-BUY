
import axios from 'axios';
import * as cheerio from 'cheerio';

async function debugBingSellers() {
    const query = "iphone 13";
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
        const items = $('.br-item');
        console.log(`Found ${items.length} items`);

        items.each((i, el) => {
            if (i > 5) return;

            console.log(`\n--- Item ${i} ---`);
            const title = $(el).find('.br-title').text().trim();
            console.log("Title:", title);

            // Debug all class names with text that might be a seller
            console.log("Potential Sellers:");
            $(el).find('*').each((j, child) => {
                const cls = $(child).attr('class');
                const txt = $(child).text().trim();
                // Heuristic: Short text, no numbers (prices), looks like a name
                if (txt.length > 2 && txt.length < 30 && !txt.includes('$') && !txt.includes('₹')) {
                    if (cls && (cls.includes('seller') || cls.includes('retailer') || cls.includes('merchant') || cls.includes('text'))) {
                        console.log(`  [${cls}]: ${txt}`);
                    }
                }
            });

            const link = $(el).find('a').attr('href');
            console.log("Link:", link);
        });

    } catch (e) {
        console.error("Error:", e);
    }
}

debugBingSellers();
