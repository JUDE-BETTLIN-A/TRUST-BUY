import axios from 'axios';
import * as cheerio from 'cheerio';
import { UnifiedSearchResult } from './types';
import { getTataCliqFromBingShopping } from './bing-shop-fallback';

/**
 * TataCliq Scraper - Using Telegram bot techniques
 * 
 * Same approach as Flipkart:
 * 1. Firefox headers with Sec-Fetch headers
 * 2. Try API first, then HTML scraping
 * 3. DuckDuckGo fallback
 */

const TATACLIQ_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
};

export async function searchTataCliq(query: string): Promise<UnifiedSearchResult[]> {
    const results: UnifiedSearchResult[] = [];
    const searchUrl = `https://www.tatacliq.com/search/?searchCategory=all&text=${encodeURIComponent(query)}`;

    try {
        console.log(`[TataCliq] Searching: ${query}`);
        
        // METHOD 1: Try their API first
        try {
            const apiUrl = `https://www.tatacliq.com/marketplacewebservices/v2/mpl/products/searchProducts/?searchText=${encodeURIComponent(query)}:relevance:inStockFlag:true&isKeywordRedirect=false&isKeywordRedirectEnabled=true&channel=WEB&isTextSearch=true&isFilter=false&page=0&isPwa=true&pageSize=40&typeID=all`;
            
            const { data } = await axios.get(apiUrl, {
                headers: {
                    ...TATACLIQ_HEADERS,
                    'Accept': 'application/json',
                },
                timeout: 10000,
            });

            if (data && data.searchresult && Array.isArray(data.searchresult)) {
                data.searchresult.forEach((p: any) => {
                    const price = parseFloat(p.price?.sellingPrice?.value || p.price?.value || 0);
                    const mrp = parseFloat(p.mrpPrice?.value || p.mrp || price);
                    
                    if (p.productname && price > 0) {
                        results.push({
                            title: p.productname,
                            price,
                            mrp,
                            discount: p.price?.discountPercent || (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0),
                            image: p.imageURL ? (p.imageURL.startsWith('//') ? `https:${p.imageURL}` : p.imageURL) : '',
                            rating: parseFloat(p.averageRating) || 0,
                            rating_count: parseInt(p.ratingCount) || 0,
                            seller: 'TataCliq',
                            source: 'TataCliq',
                            product_url: p.webURL ? `https://www.tatacliq.com${p.webURL}` : searchUrl
                        });
                    }
                });
                
                if (results.length > 0) {
                    console.log(`[TataCliq] API returned ${results.length} products`);
                    return results;
                }
            }
        } catch (e) {
            console.log('[TataCliq] API failed, trying HTML...');
        }

        // METHOD 2: HTML scraping
        const { data: html } = await axios.get(searchUrl, {
            headers: TATACLIQ_HEADERS,
            timeout: 15000,
            decompress: true,
        });

        const $ = cheerio.load(html);

        // Try __NEXT_DATA__ JSON
        const scriptContent = $('script#__NEXT_DATA__').text();
        if (scriptContent) {
            try {
                const nextData = JSON.parse(scriptContent);
                const products = nextData?.props?.pageProps?.products ||
                               nextData?.props?.pageProps?.searchResult?.products || [];
                
                products.forEach((p: any) => {
                    const price = parseFloat(p.price || p.sellingPrice || 0);
                    if (p.name && price > 0) {
                        results.push({
                            title: p.name,
                            price,
                            mrp: parseFloat(p.mrp || price),
                            image: p.image || '',
                            rating: 0,
                            rating_count: 0,
                            seller: 'TataCliq',
                            source: 'TataCliq',
                            product_url: p.url ? `https://www.tatacliq.com${p.url}` : searchUrl
                        });
                    }
                });
            } catch (e) { /* JSON parse failed */ }
        }

        // Target product cards
        if (results.length === 0) {
            $('[data-productcode], .product-card, .ProductModule').each((_, el) => {
                try {
                    const $product = $(el);
                    
                    const $link = $product.find('a').first();
                    let productLink = $link.attr('href') || '';
                    if (productLink && !productLink.startsWith('http')) {
                        productLink = `https://www.tatacliq.com${productLink}`;
                    }

                    const image = $product.find('img').first().attr('src') || '';
                    let title = $product.find('.product-title, h3, h4, [class*="name"]').first().text().trim();

                    let currentPrice: number | null = null;
                    $product.find('span, div').each((_, priceEl) => {
                        const text = $(priceEl).text().trim();
                        if (text.includes('₹')) {
                            const priceMatch = text.match(/₹\s*([\d,]+)/);
                            if (priceMatch && currentPrice === null) {
                                currentPrice = parseInt(priceMatch[1].replace(/,/g, ''));
                            }
                        }
                    });

                    if (title && currentPrice) {
                        results.push({
                            title,
                            price: currentPrice,
                            image,
                            rating: 0,
                            rating_count: 0,
                            seller: 'TataCliq',
                            source: 'TataCliq',
                            product_url: productLink || searchUrl
                        });
                    }
                } catch (e) { /* Continue */ }
            });
        }

        console.log(`[TataCliq] Found ${results.length} products`);

        if (results.length === 0) {
            console.log(`[TataCliq] Trying BingShopping fallback`);
            return getTataCliqFromBingShopping(query);
        }

    } catch (e) {
        console.warn(`[TataCliq] Scrape failed:`, e instanceof Error ? e.message : e);
        return getTataCliqFromBingShopping(query);
    }

    return results;
}

async function searchTataCliqViaDuckDuckGo(query: string): Promise<UnifiedSearchResult[]> {
    const results: UnifiedSearchResult[] = [];
    
    try {
        console.log(`[TataCliq] Using DuckDuckGo fallback`);
        
        const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' site:tatacliq.com')}`;
        
        const { data } = await axios.get(ddgUrl, {
            headers: TATACLIQ_HEADERS,
            timeout: 10000,
        });

        const $ = cheerio.load(data);

        $('.result').each((_, el) => {
            try {
                const $result = $(el);
                const $link = $result.find('.result__a');
                const href = $link.attr('href') || '';
                const title = $link.text().trim();
                const snippet = $result.find('.result__snippet').text().trim();

                if (!href.includes('tatacliq.com')) return;

                let productUrl = href;
                if (href.includes('uddg=')) {
                    const match = href.match(/uddg=([^&]+)/);
                    if (match) {
                        productUrl = decodeURIComponent(match[1]);
                    }
                }

                if (productUrl.includes('/search') || productUrl.includes('/category')) return;

                let price = 0;
                const priceMatch = snippet.match(/₹\s*([\d,]+)/);
                if (priceMatch) {
                    price = parseInt(priceMatch[1].replace(/,/g, ''));
                }

                if (title) {
                    results.push({
                        title: title.replace(' - Tata CLiQ', '').trim(),
                        price: price || 0,
                        image: '',
                        rating: 0,
                        rating_count: 0,
                        seller: 'TataCliq',
                        source: 'TataCliq',
                        product_url: productUrl
                    });
                }
            } catch (e) { /* Continue */ }
        });

        console.log(`[TataCliq] DuckDuckGo found ${results.length} products`);
    } catch (e) {
        console.warn('[TataCliq] DuckDuckGo failed:', e instanceof Error ? e.message : e);
    }

    return results;
}
