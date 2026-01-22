
import axios from 'axios';
import * as fs from 'fs';

async function debugBing() {
    try {
        // Bing Shopping URL
        const url = `https://www.bing.com/shop?q=laptop`;
        console.log(`Fetching ${url}...`);

        const { data } = await axios.get(url, {
            headers: {
                // Use a standard browser user agent
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
            }
        });

        console.log("Response length:", data.length);
        fs.writeFileSync('debug_bing.html', data);
        console.log("Saved to debug_bing.html");

    } catch (e: any) {
        console.error("Error fetching Bing:", e.message);
        if (e.response) {
            console.error("Status:", e.response.status);
            fs.writeFileSync('debug_bing_error.html', e.response.data);
        }
    }
}

debugBing();
