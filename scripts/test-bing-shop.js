const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
    // Test Bing Shopping which works
    const url = 'https://www.bing.com/shop?q=iphone+16&FORM=SHOPTB';
    const { data } = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0',
        },
        timeout: 15000
    });
    const $ = cheerio.load(data);
    
    console.log('Bing Shopping response length:', data.length);
    console.log('Products with data-prodtitle:', $('[data-prodtitle]').length);
    console.log('Products .br-item:', $('.br-item').length);
    console.log('Products .br-productCard:', $('.br-productCard').length);
    
    // Look for all seller mentions
    const sellers = new Set();
    $('[data-prodtitle], .br-item, .br-productCard').each((i, el) => {
        const seller = $(el).find('.br-seller, .seller').text().trim();
        if (seller) sellers.add(seller);
    });
    console.log('\nSellers found:', Array.from(sellers).slice(0, 20));
    
    // Show sample products
    console.log('\nSample products:');
    $('[data-prodtitle], .br-item, .br-productCard').slice(0, 5).each((i, el) => {
        const $el = $(el);
        const title = $el.attr('data-prodtitle') || $el.find('.br-title, .title').text().trim();
        const seller = $el.find('.br-seller, .seller').text().trim();
        const price = $el.find('.br-price, .price').first().text().trim();
        console.log(`${i+1}. ${title ? title.substring(0, 50) : 'No title'} | ${seller || 'No seller'} | ${price || 'No price'}`);
    });
}

test().catch(e => console.error('Error:', e.message));
