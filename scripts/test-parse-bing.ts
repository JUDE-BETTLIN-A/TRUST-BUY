
import * as cheerio from 'cheerio';
import * as fs from 'fs';

function testParse() {
    const html = fs.readFileSync('debug_bing.html', 'utf-8');
    const $ = cheerio.load(html);

    const results: any[] = [];

    // Bing Shopping items often have class 'br-item' or inside '#b_results > li'
    // They seem to use 'br-card' class for the container
    $('.br-card').each((i, el) => {
        const title = $(el).find('.br-title').text().trim() || $(el).attr('title');
        const price = $(el).find('.br-standardPrice').text().trim() || $(el).find('.br-focusPrice').text().trim();

        let image = $(el).find('img').attr('src');
        if (!image || image.startsWith('/')) {
            image = $(el).find('img').attr('data-src');
        }

        const storeName = $(el).find('.br-sellers').text().trim() || $(el).find('.br-retailerName').text().trim();
        const link = $(el).find('a').attr('href');

        if (title && price) {
            results.push({
                title,
                price,
                image,
                storeName,
                link
            });
        }
    });

    console.log(`Found ${results.length} items`);
    if (results.length > 0) {
        console.log("Sample item:", results[0]);
    } else {
        // Fallback or alternative selector debugging
        console.log("Trying alternative selectors...");
        $('.b_algo').each((i, el) => {
            // standard search result
            const title = $(el).find('h2').text().trim();
            console.log("Serp item:", title);
        });
    }
}

testParse();
