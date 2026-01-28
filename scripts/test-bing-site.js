const axios = require('axios');
const cheerio = require('cheerio');

async function testBingSearch() {
    const query = 'iphone 16';
    const sites = ['croma.com', 'reliancedigital.in', 'jiomart.com', 'meesho.com'];
    
    for (const site of sites) {
        console.log(`\n=== Testing site:${site} ===`);
        const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query + ' site:' + site + ' price')}&count=30`;
        console.log('URL:', searchUrl);
        
        try {
            const { data } = await axios.get(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Sec-Fetch-User': '?1'
                },
                timeout: 15000,
                decompress: true
            });
            
            const $ = cheerio.load(data);
            
            // Try various selectors
            const selectors = [
                'li.b_algo',
                '#b_results .b_algo',
                '.b_algo',
                '#b_results li',
                '.sb_count'
            ];
            
            for (const sel of selectors) {
                console.log(`  ${sel}: ${$(sel).length} matches`);
            }
            
            // Check for CAPTCHA/block
            if (data.includes('captcha') || data.includes('CAPTCHA')) {
                console.log('  ⚠️ CAPTCHA detected!');
            }
            
            // Check for no results message
            if (data.includes('No results found') || data.includes('There are no results')) {
                console.log('  ⚠️ No results message detected');
            }
            
            // Find any links to the site
            const siteLinks = [];
            $('a[href]').each((i, el) => {
                const href = $(el).attr('href');
                if (href && href.includes(site.split('.')[0])) {
                    siteLinks.push(href);
                }
            });
            console.log(`  Links containing "${site.split('.')[0]}": ${siteLinks.length}`);
            if (siteLinks.length > 0) {
                console.log('  Sample links:', siteLinks.slice(0, 3));
            }
            
            // Show actual results if any
            $('li.b_algo').slice(0, 2).each((i, el) => {
                const title = $(el).find('h2 a').text();
                const link = $(el).find('h2 a').attr('href');
                console.log(`  Result ${i+1}:`, title.substring(0, 60));
                console.log(`    Link:`, link ? link.substring(0, 80) : 'none');
            });
            
        } catch (err) {
            console.log('  Error:', err.message);
        }
    }
}

testBingSearch();
