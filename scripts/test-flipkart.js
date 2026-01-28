const axios = require('axios');
const cheerio = require('cheerio');

async function testFlipkartWithDifferentUA() {
    console.log('=== Testing Flipkart with Googlebot UA ===\n');
    
    try {
        const url = 'https://www.flipkart.com/search?q=black+pant';
        const { data, status } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                'Accept': 'text/html',
            },
            timeout: 20000
        });
        
        console.log('Status:', status);
        console.log('Response length:', data.length);
        
        const $ = cheerio.load(data);
        console.log('Title:', $('title').text());
        
        // Check for products
        let count = 0;
        $('div._1AtVbE, div[data-id], div._13oc-S, div.tUxRFH').each((_, el) => {
            const title = $(el).find('div.KzDlHZ, a.wjcEIp, a.s1Q9rs, div._4rR01T, .IRpwTa').first().text().trim();
            if (title && count < 5) {
                count++;
                console.log(`${count}. ${title.slice(0, 60)}`);
            }
        });
        
        console.log('Products found:', count);
        
    } catch (e) {
        console.log('Error:', e.message);
    }
}

async function testFlipkartMobile() {
    console.log('\n=== Testing Flipkart Mobile ===\n');
    
    try {
        // Try mobile site
        const url = 'https://www.flipkart.com/search?q=black+pant&marketplace=FLIPKART';
        const { data, status } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15A372 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en-IN,en;q=0.9',
                'Cache-Control': 'no-cache',
            },
            timeout: 20000
        });
        
        console.log('Mobile Status:', status);
        console.log('Mobile Response length:', data.length);
        
    } catch (e) {
        console.log('Mobile Error:', e.message);
    }
}

async function testGoogleSearchFlipkart() {
    console.log('\n=== Testing Google Search for Flipkart ===\n');
    
    try {
        const url = 'https://www.google.com/search?q=black+pant+flipkart&tbm=shop';
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html',
                'Accept-Language': 'en-US,en;q=0.9'
            },
            timeout: 15000
        });
        
        const $ = cheerio.load(data);
        console.log('Google Title:', $('title').text());
        console.log('Response length:', data.length);
        
        // Look for Flipkart links
        let count = 0;
        $('a').each(function() {
            const href = $(this).attr('href') || '';
            if (href.includes('flipkart.com') && count < 5) {
                count++;
                const text = $(this).text().trim().slice(0, 50);
                console.log(`${count}. ${text || 'Link'}`);
            }
        });
        
        console.log('Flipkart links found:', count);
        
    } catch (e) {
        console.log('Google Error:', e.message);
    }
}

async function main() {
    await testFlipkartWithDifferentUA();
    await testFlipkartMobile();
    await testGoogleSearchFlipkart();
}

main().catch(e => console.log('Error:', e.message));
