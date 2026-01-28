const axios = require('axios');
const cheerio = require('cheerio');

async function testAjio() {
    console.log('=== Testing Ajio via DuckDuckGo ===\n');
    
    const url = 'https://duckduckgo.com/html/?q=black+pant+site:ajio.com';
    
    const { data } = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 15000
    });
    
    const $ = cheerio.load(data);
    const results = [];
    
    $('.result').each((_, el) => {
        const $el = $(el);
        const title = $el.find('.result__a').text().trim();
        let href = $el.find('.result__a').attr('href') || '';
        const snippet = $el.find('.result__snippet').text().trim();
        
        // Extract URL from DuckDuckGo redirect
        if (href.includes('uddg=')) {
            const match = href.match(/uddg=([^&]+)/);
            if (match) href = decodeURIComponent(match[1]);
        }
        
        if (href.includes('ajio.com') && !href.includes('/search') && !href.includes('/about') && !href.includes('/b/')) {
            // Try to extract price
            let price = 0;
            const priceMatch = snippet.match(/₹\s*([\d,]+)/);
            if (priceMatch) price = parseFloat(priceMatch[1].replace(/,/g, ''));
            
            results.push({
                title: title.replace(' - AJIO', '').replace('| AJIO', '').trim(),
                price,
                url: href
            });
        }
    });
    
    console.log(`Ajio: Found ${results.length} products\n`);
    results.slice(0, 5).forEach((r, i) => {
        console.log(`${i + 1}. ${r.title.slice(0, 50)}...`);
        console.log(`   URL: ${r.url.slice(0, 50)}...`);
    });
}

async function testMeesho() {
    console.log('\n=== Testing Meesho via DuckDuckGo ===\n');
    
    const url = 'https://duckduckgo.com/html/?q=black+pant+site:meesho.com';
    
    const { data } = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 15000
    });
    
    const $ = cheerio.load(data);
    const results = [];
    
    $('.result').each((_, el) => {
        const $el = $(el);
        const title = $el.find('.result__a').text().trim();
        let href = $el.find('.result__a').attr('href') || '';
        
        // Extract URL from DuckDuckGo redirect
        if (href.includes('uddg=')) {
            const match = href.match(/uddg=([^&]+)/);
            if (match) href = decodeURIComponent(match[1]);
        }
        
        if (href.includes('meesho.com') && !href.includes('/search') && !href.includes('/about')) {
            results.push({
                title: title.replace(' - Meesho', '').replace('| Meesho', '').trim(),
                url: href
            });
        }
    });
    
    console.log(`Meesho: Found ${results.length} products\n`);
    results.slice(0, 5).forEach((r, i) => {
        console.log(`${i + 1}. ${r.title.slice(0, 50)}...`);
        console.log(`   URL: ${r.url.slice(0, 50)}...`);
    });
}

async function main() {
    await testAjio();
    await testMeesho();
}

main().catch(e => console.log('Error:', e.message));
