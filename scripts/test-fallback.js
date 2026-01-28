const axios = require('axios');
const cheerio = require('cheerio');

async function testIndiamart() {
    const url = 'https://dir.indiamart.com/search.mp?ss=iphone+15&prdsrc=1';
    console.log('=== Testing Indiamart ===');
    console.log('Fetching:', url);

    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html',
            },
            timeout: 15000
        });

        console.log('Response length:', data.length);
        const $ = cheerio.load(data);

        // Debug: Find price-related classes
        console.log('\n--- Price Elements Found ---');
        let priceCount = 0;
        $('*').each(function() {
            const cls = $(this).attr('class') || '';
            const text = $(this).text().trim();
            if ((cls.includes('prc') || cls.includes('price') || cls.includes('₹') || text.match(/₹[\d,]+/)) && priceCount < 10) {
                if (text.length < 100 && text.match(/[\d,]+/)) {
                    priceCount++;
                    console.log('Class: ' + cls.slice(0, 40) + ' | Text: ' + text.slice(0, 50));
                }
            }
        });

        console.log('\n--- Product Cards ---');
        let found = 0;
        
        // Try different card selectors
        $('div.lst, .card, .flx').each(function() {
            if (found >= 8) return false;
            const $el = $(this);
            const html = $el.html() || '';
            
            // Look for price pattern in the element
            const priceMatch = html.match(/₹\s*([\d,]+)/);
            const title = $el.find('a').first().text().trim() || $el.find('h2, h3').first().text().trim();
            
            if (title && title.length > 3 && priceMatch) {
                found++;
                console.log(found + '. ' + title.slice(0, 50));
                console.log('   Price: ₹' + priceMatch[1]);
            }
        });

        console.log('\nTotal products with prices:', found);

    } catch (e) {
        console.log('Error:', e.message);
    }
}

// Run test
testIndiamart();
