const axios = require('axios');
const cheerio = require('cheerio');

async function testMeeshoViaSearch() {
    const query = 'black pant';
    const results = [];
    
    console.log('=== Testing Meesho Scraper (via DuckDuckGo) ===\n');
    
    const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(query + ' site:meesho.com')}`;
    
    const { data } = await axios.get(searchUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html'
        },
        timeout: 15000
    });
    
    const $ = cheerio.load(data);
    
    $('.result').each((_, elem) => {
        const $result = $(elem);
        const $link = $result.find('.result__a');
        const href = $link.attr('href') || '';
        const title = $link.text().trim();
        const snippet = $result.find('.result__snippet').text().trim();
        
        if (!href.includes('meesho.com')) return;
        
        // Extract URL
        let productUrl = href;
        if (href.includes('uddg=')) {
            const match = href.match(/uddg=([^&]+)/);
            if (match) productUrl = decodeURIComponent(match[1]);
        }
        
        // Skip non-product pages
        if (productUrl.includes('/search') || productUrl.includes('/about')) return;
        
        // Try to extract price from snippet
        let price = 0;
        const priceMatch = snippet.match(/₹\s*([\d,]+)/);
        if (priceMatch) {
            price = parseFloat(priceMatch[1].replace(/,/g, ''));
        }
        
        if (title && productUrl) {
            results.push({
                title: title.replace(' - Meesho', '').replace('| Meesho', '').trim(),
                price,
                product_url: productUrl,
                source: 'Meesho'
            });
        }
    });
    
    console.log(`Found ${results.length} Meesho products:\n`);
    results.slice(0, 10).forEach((r, i) => {
        console.log(`${i + 1}. ${r.title.slice(0, 60)}...`);
        console.log(`   Price: ₹${r.price || 'N/A'}`);
        console.log(`   URL: ${r.product_url.slice(0, 60)}...`);
        console.log('');
    });
}

testMeeshoViaSearch().catch(console.error);
