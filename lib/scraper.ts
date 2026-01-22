import axios from 'axios';
import * as cheerio from 'cheerio';
import { Product } from './mock-scraper';

// Re-export the interface for convenience, or use the one from mock-scraper
export type ScrapedProduct = Product;

async function scrapeProductsGoogleShopping(query: string, page: number = 1): Promise<Product[]> {
    console.log(`[Scraper] Starting Google Shopping scrape for: ${query}`);
    const products: Product[] = [];
    try {
        const url = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}`;
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            },
            timeout: 8000
        });

        const $ = cheerio.load(data);

        // Google Shopping Grid Item Selector (often changes, but these are common)
        // .sh-dgr__grid-result is the standard grid item
        $('.sh-dgr__grid-result, .sh-dlr__list-result').each((i, el) => {
            if (products.length >= 12) return; // "dozen of things"

            const title = $(el).find('h3, .tAxDx').text().trim();
            const price = $(el).find('.a83uyx, .OFFNJ, .HRLxBb').first().text().trim();
            const storeName = $(el).find('.aULzUe, .IuHnof').text().trim();

            // Image extraction
            const imgContainer = $(el).find('.Ar9Zdb img, .R0153c img');
            let image = imgContainer.attr('src') || imgContainer.attr('data-src');

            // Link extraction
            const linkHref = $(el).find('a.Lq5Ohm, a.shntl').attr('href');
            let link = linkHref ? `https://www.google.com${linkHref}` : undefined;

            if (title && price) {
                // Simplified brand extraction
                const brands = ["Sony", "Apple", "Samsung", "Dyson", "Nintendo", "KitchenAid", "Bose", "LG", "HP", "Dell", "Microsoft"];
                const brand = brands.find(b => title.toLowerCase().includes(b.toLowerCase())) || "Generic";

                products.push({
                    id: `google-${i}`,
                    title: title,
                    price: price,
                    image: image || "",
                    storeName: storeName || "Google Shopping",
                    model: "N/A",
                    category: "General",
                    brand: brand,
                    bestPrice: false,
                    rating: Number((Math.random() * 1.5 + 8.0).toFixed(1)),
                    trustScoreBadge: "Very Good",
                    link: link
                });
            }
        });

        console.log(`[Scraper] Found ${products.length} items on Google Shopping.`);

    } catch (err) {
        console.error("Google Shopping scrape failed:", err);
    }
    return products;
}

async function scrapeProductsBing(query: string, page: number = 1): Promise<Product[]> {
    console.log(`[Scraper] Starting Bing scrape for: ${query}`);
    const products: Product[] = [];
    try {
        const url = `https://www.bing.com/shop?q=${encodeURIComponent(query)}`;
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Cache-Control': 'no-cache',
            },
            timeout: 8000
        });

        const $ = cheerio.load(data);

        $('.br-item').each((i, el) => {
            if (products.length >= 24) return;

            const card = $(el).find('.br-card');
            const target = card.length ? card : $(el);

            const title = target.find('.br-title').text().trim() || target.attr('title');

            // Fix concatenated prices
            let priceText = target.find('.br-standardPrice').first().text().trim() ||
                target.find('.br-focusPrice').first().text().trim();
            const priceMatch = priceText.match(/[$₹]\s?[\d,]+(\.\d{2})?/);
            const price = priceMatch ? priceMatch[0] : priceText;

            if (!title) return;

            // Relevance Check - improved to handle abbreviations like ps5
            const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
            const titleLower = title.toLowerCase();

            // Special cases for common queries
            const isPS5 = query.toLowerCase().includes('ps5') || query.toLowerCase().includes('playstation 5');
            const matchesPS5 = isPS5 && (titleLower.includes('ps5') || titleLower.includes('playstation 5'));

            if (!matchesPS5) {
                if (queryWords.length > 0 && !titleLower.includes(queryWords[0])) return;
                const matchCount = queryWords.reduce((count, word) => count + (titleLower.includes(word) ? 1 : 0), 0);
                if (matchCount / queryWords.length < 0.6) return; // Slightly more relaxed
            }

            // Image
            const img = target.find('img');
            let image = img.attr('data-src-hq') || img.attr('data-src') || img.attr('src');

            if (image && image.startsWith('data:image') && image.length < 1000) image = undefined;
            if (image) {
                if (image.startsWith('/')) image = `https://www.bing.com${image}`;
                if (image.startsWith('//')) image = `https:${image}`;
            }

            // Fallback image
            if (!image) {
                image = `https://tse2.mm.bing.net/th?q=${encodeURIComponent(title)}&w=500&h=500&c=7&rs=1&p=0`;
            }

            // Link
            let link = target.find('a').attr('href');
            if (!link || link.startsWith('javascript')) {
                link = `https://www.bing.com/shop?q=${encodeURIComponent(title || query)}`;
            } else if (link.startsWith('/')) {
                link = `https://www.bing.com${link}`;
            }

            // Store Name
            let storeName = target.find('.br-sellerName').first().text().trim() ||
                target.find('.br-seller').first().text().trim() ||
                target.find('.br-sellers').first().text().trim() ||
                target.find('.br-retailerName').first().text().trim();

            if (storeName && storeName.length > 3 && storeName.substring(0, storeName.length / 2) === storeName.substring(storeName.length / 2)) {
                storeName = storeName.substring(0, storeName.length / 2);
            }

            if (!storeName) {
                const sellerText = target.find('.br-standardText').filter((_, el) => {
                    const txt = $(el).text().trim();
                    return txt.length > 2 && txt.length < 25 && !txt.match(/[\$₹]/) && !txt.includes('Return') && !txt.includes('Shipping');
                }).last().text().trim();
                if (sellerText) storeName = sellerText;
            }

            if ((!storeName || storeName === "Unknown Seller") && link && !link.includes('bing.com')) {
                try {
                    const urlObj = new URL(link);
                    let domain = urlObj.hostname.replace('www.', '').split('.')[0];
                    storeName = domain.charAt(0).toUpperCase() + domain.slice(1);
                } catch (e) { }
            }

            if (title && price) {
                // Simplified brand extraction
                const brands = ["Sony", "Apple", "Samsung", "Dyson", "Nintendo", "KitchenAid", "Bose", "LG", "HP", "Dell", "Microsoft"];
                const brand = brands.find(b => title.toLowerCase().includes(b.toLowerCase())) || "Generic";
                const rating = Number((Math.random() * 1.5 + 8.4).toFixed(1));

                products.push({
                    id: `bing-${page}-${i}`,
                    title: title,
                    price: price,
                    image: image!,
                    storeName: storeName || "Bing Shopping",
                    model: "N/A",
                    category: "General",
                    brand: brand,
                    bestPrice: false,
                    rating: rating,
                    trustScoreBadge: rating > 9.2 ? "Excellent" : "Very Good",
                    link: link
                });
            }
        });

        // Sort by Priority
        products.sort((a, b) => {
            const getScore = (p: Product) => {
                const store = (p.storeName || "").toLowerCase();
                if (store.includes('amazon') || store.includes('flipkart')) return 10;
                if (store.includes('apple') || store.includes('samsung') || store.includes('croma')) return 8;
                return 0;
            };
            return getScore(b) - getScore(a);
        });

        // Diversity Logic
        const seenStores: Record<string, number> = {};
        const diverseProducts = [];
        for (const p of products) {
            const storeKey = (p.storeName || "unknown").toLowerCase().replace(/\s/g, '');
            if (!seenStores[storeKey]) seenStores[storeKey] = 0;
            if (seenStores[storeKey] < 2) {
                diverseProducts.push(p);
                seenStores[storeKey]++;
            }
        }

        const finalProducts = diverseProducts.slice(0, 6);
        if (finalProducts.length > 0) finalProducts[0].bestPrice = true;

        console.log(`[Scraper] Found ${products.length} candidates, returning ${finalProducts.length} diverse items.`);
        return finalProducts;

    } catch (err) {
        console.error("Bing scrape failed:", err);
    }
    return products;
}

async function scrapeProductsEbay(query: string, page: number = 1): Promise<Product[]> {
    console.log(`[Scraper] Starting eBay scrape for: ${query}, page: ${page}`);
    const products: Product[] = [];

    try {
        const ebayUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&_sacat=0&_pgn=${page}`;
        const { data } = await axios.get(ebayUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            timeout: 5000
        });

        const $ = cheerio.load(data);

        $('.s-item__wrapper').each((i, element) => {
            if (products.length >= 6) return; // Limit results to 6 per page

            const title = $(element).find('.s-item__title').text().trim();
            // eBay often has "New Listing" or "Shop on eBay" hidden text, be careful.
            if (title.toLowerCase().includes("shop on ebay")) return;

            const priceText = $(element).find('.s-item__price').text().trim();

            // Try multiple strategies for image extraction (eBay lazy loading uses data-src)
            const imgEl = $(element).find('.s-item__image img');
            let image = imgEl.attr('data-src') || imgEl.attr('data-img-src') || imgEl.attr('src');

            // Sometimes the image is in a different container or format
            if (!image || image.includes('gif') || image.includes('blank')) {
                // Try looking for the specific class eBay often uses
                const specificImg = $(element).find('.s-item__image-img');
                image = specificImg.attr('data-src') || specificImg.attr('src') || image;
            }

            const link = $(element).find('.s-item__link').attr('href');

            // Clean price (e.g. "$20.00 to $30.00" -> take first)
            const price = priceText.split(' to ')[0];

            if (title && price && image) {
                // Ensure image protocol
                if (image && image.startsWith('//')) {
                    image = `https:${image}`;
                }

                // Simplified brand extraction
                const brands = ["Sony", "Apple", "Samsung", "Dyson", "Nintendo", "KitchenAid", "Bose", "LG", "HP", "Dell", "Microsoft"];
                const brand = brands.find(b => title.toLowerCase().includes(b.toLowerCase())) || "Generic";

                products.push({
                    id: link || `ebay-${page}-${i}`,
                    title: title,
                    price: price,
                    image: image,
                    storeName: "eBay",
                    model: "N/A",
                    category: "General",
                    brand: brand,
                    bestPrice: false,
                    rating: Number((Math.random() * 2.0 + 7.5).toFixed(1)),
                    trustScoreBadge: "Good",
                    link: link
                });
            }
        });

        console.log(`[Scraper] Found ${products.length} items on eBay.`);

    } catch (error) {
        console.error("[Scraper] eBay scraping failed:", error);
    }
    return products;
}

export async function scrapeProductsReal(query: string, page: number = 1): Promise<Product[]> {
    let results: Product[] = [];

    // 1. Try Bing Shopping first (Verified working)
    const bingProducts = await scrapeProductsBing(query, page);
    if (bingProducts.length > 0) {
        results = bingProducts;
    } else {
        // 2. Fallback to DuckDuckGo HTML
        const ddgProducts = await scrapeProductsDuckDuckGo(query, page);
        if (ddgProducts.length > 0) {
            results = ddgProducts;
        } else {
            // 3. Last resort: Google Shopping (often blocked)
            const googleProducts = await scrapeProductsGoogleShopping(query, page);
            if (googleProducts.length > 0) {
                results = googleProducts;
            } else {
                // 4. Fallback to eBay
                results = await scrapeProductsEbay(query, page);
            }
        }
    }

    // STRICT FILTER: Remove any product without a valid image URL
    // This ensures no broken image icons are shown to the user
    return results.filter(p =>
        p.image &&
        p.image.length > 10 &&
        (p.image.startsWith("http") || p.image.startsWith("data:image"))
    );
}

async function scrapeProductsDuckDuckGo(query: string, page: number = 1): Promise<Product[]> {
    console.log(`[Scraper] Starting DDG scrape for: ${query}`);
    const products: Product[] = [];
    try {
        const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query + " price")}`;
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });

        const $ = cheerio.load(data);

        $('.result').each((i, el) => {
            if (products.length >= 6) return;

            const title = $(el).find('.result__a').text().trim();
            const snippet = $(el).find('.result__snippet').text().trim();
            const link = $(el).find('.result__a').attr('href');

            const priceMatch = (title + " " + snippet).match(/\$[\d,]+(\.\d{2})?/);

            if (title && priceMatch) {
                const image = `https://image.pollinations.ai/prompt/${encodeURIComponent(title)}%20product%20photo?width=400&height=400&nologo=true`;

                let realLink = link;
                if (link && link.includes('uddg=')) {
                    try {
                        const urlObj = new URL(link, 'https://duckduckgo.com');
                        realLink = decodeURIComponent(urlObj.searchParams.get('uddg') || link);
                    } catch (e) { }
                }

                // Simplified brand extraction
                const brands = ["Sony", "Apple", "Samsung", "Dyson", "Nintendo", "KitchenAid", "Bose", "LG", "HP", "Dell", "Microsoft"];
                const brand = brands.find(b => title.toLowerCase().includes(b.toLowerCase())) || "Generic";

                products.push({
                    id: `ddg-${i}`,
                    title: title,
                    price: priceMatch[0],
                    image: image,
                    storeName: "Online Store",
                    model: "N/A",
                    category: "General",
                    brand: brand,
                    bestPrice: false,
                    rating: 8.0,
                    trustScoreBadge: "Good",
                    link: realLink
                });
            }
        });

        console.log(`[Scraper] Found ${products.length} items on DDG.`);

    } catch (err) {
        console.error("DDG scrape failed:", err);
    }
    return products;
}
