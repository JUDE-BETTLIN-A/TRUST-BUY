
const axios = require('axios');
const cheerio = require('cheerio');

async function testGoogleScrape() {
    const query = "iphone";
    const url = `https://www.bing.com/shop?q=${encodeURIComponent(query)}`;
    // Trying the Indian domain as well if global redirect is the issue
    // const url = `https://www.google.co.in/search?tbm=shop&q=${encodeURIComponent(query)}`;

    console.log(`Fetching: ${url}`);

    try {
        const response = await axios.get(url, {
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'max-age=0',
                'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            validateStatus: () => true // Do not throw on 4xx/5xx
        });

        const { data, status } = response;
        console.log("Response Status:", status);
        console.log("Data length:", data.length);
        console.log("Response Preview:", data.substring(0, 500));

        const $ = cheerio.load(data);
        console.log("Page Title:", $('title').text());

        const gridItems = $('.br-item');
        console.log(`Found ${gridItems.length} items.`);

        if (gridItems.length > 0) {
            const first = $(gridItems[0]);
            console.log("First Item Title:", first.find('.br-title').text().trim());
            console.log("First Item Price:", first.find('.br-standardPrice, .br-focusPrice').text().trim());
            console.log("First Item Store:", first.find('.br-sellerName, .br-seller').text().trim());
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
}

testGoogleScrape();
