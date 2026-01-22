
import axios from 'axios';
import * as fs from 'fs';

async function debug() {
    try {
        const url = `https://www.etsy.com/search?q=laptop`;
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            }
        });
        console.log("Length:", data.length);
        fs.writeFileSync('debug_etsy.html', data);
        console.log("Wrote debug_etsy.html");
    } catch (e) {
        console.error(e);
    }
}
debug();
