const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Test Google Search for product links from specific e-commerce sites
 */

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0';

async function testGoogleSearch(query, site) {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query + ' site:' + site + ' price')}&num=10`;
    console.log(`\n=== Testing Google site:${site} ===`);
    console.log('URL:', searchUrl);
    
    try {
        const { data } = await axios.get(searchUrl, {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'text/html',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            timeout: 15000
        });
        
        const $ = cheerio.load(data);
        
        // Count search results
        const results = [];
        $('div.g').each((i, el) => {
            const $result = $(el);
            const link = $result.find('a').first().attr('href') || '';
            const title = $result.find('h3').first().text().trim();
            
            if (link.includes(site.split('.')[0]) && title) {
                results.push({ title, link });
            }
        });
        
        console.log(`Found ${results.length} results from ${site}`);
        results.slice(0, 3).forEach((r, i) => {
            console.log(`  ${i+1}. ${r.title.substring(0, 60)}`);
        });
        
        // Check for CAPTCHA
        if (data.includes('unusual traffic') || data.includes('captcha')) {
            console.log('  ⚠️ Google is blocking - CAPTCHA detected');
        }
        
    } catch (err) {
        console.log('Error:', err.message);
    }
}

async function main() {
    const query = 'iphone 16';
    const sites = ['meesho.com', 'jiomart.com', 'tatacliq.com', 'shopclues.com'];
    
    for (const site of sites) {
        await testGoogleSearch(query, site);
        await new Promise(r => setTimeout(r, 2000)); // Delay between requests
    }
}

main();
