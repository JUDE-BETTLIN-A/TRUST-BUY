
import axios from 'axios';
import * as cheerio from 'cheerio';

async function testGoogleScrape() {
    const query = "iphone";
    const url = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}`;

    console.log(`Fetching: ${url}`);

    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            }
        });

        const $ = cheerio.load(data);
        console.log("Page Title:", $('title').text());

        // Count potential grid items
        const gridItems = $('.sh-dgr__grid-result, .sh-dlr__list-result, .sh-np__click-target');
        console.log(`Found ${gridItems.length} items using standard selectors.`);

        // Dump classes of first few divs to see what we are dealing with if standard selectors fail
        if (gridItems.length === 0) {
            console.log("No items found. Dumping first 500 characters of body:");
            console.log($('body').text().substring(0, 500));
        } else {
            const first = $(gridItems[0]);
            console.log("First Item Title:", first.find('h3').text());
            console.log("First Item Price:", first.find('.a83uyx, .OFFNJ, .HRLxBb').text());
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

testGoogleScrape();
