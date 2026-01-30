import axios from 'axios';
import * as cheerio from 'cheerio';
import { Product } from './mock-scraper';

// Re-export the interface for convenience
export type ScrapedProduct = Product;

// Helper to generate deterministic IDs for deduplication
export function generateProductId(link: string | undefined, title: string, storeName: string): string {
    // 1. EXTRACT REAL E-COMMERCE IDS (The Gold Standard)
    if (link) {
        // Amazon ASIN (B0...)
        const asinMatch = link.match(/\/dp\/(B0[A-Z0-9]{8})/i) || link.match(/\/gp\/product\/(B0[A-Z0-9]{8})/i);
        if (asinMatch) return `asin-${asinMatch[1]}`;

        // Flipkart PID (pid=...)
        const pidMatch = link.match(/pid=([A-Z0-9]{16})/i) || link.match(/mapped_pid=([A-Z0-9]{16})/i);
        if (pidMatch) return `fk-pid-${pidMatch[1]}`;

        // Myntra (Style ID at end of URL)
        const myntraMatch = link.match(/\/(\d+)\/buy/);
        if (myntraMatch) return `myntra-${myntraMatch[1]}`;
    }

    // 2. Prioritize meaningful text content (Title + Store) for ID
    if (title && storeName) {
        const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50);
        const normalizedStore = storeName.toLowerCase().replace(/[^a-z0-9]/g, '');
        return `prod-${normalizedTitle}-${normalizedStore}`;
    }

    // 3. Fallback to Link hash
    if (link && link.length > 10) {
        let hash = 0;
        for (let i = 0; i < link.length; i++) {
            const char = link.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return `prod-link-${Math.abs(hash)}`;
    }

    // 4. Fallback random
    return `prod-rand-${Math.random().toString(36).substring(7)}`;
}

export const INDIAN_STORES = [
    "Amazon.in", "Flipkart", "Myntra", "Ajio", "Tata Cliq", "Croma",
    "Reliance Digital", "JioMart", "Nykaa", "Snapdeal", "FirstCry", "Lenskart", "Meesho"
];

function generatePriceHistory(currentPriceStr: string): { date: string, price: number }[] {
    const cleanPrice = Number(currentPriceStr.replace(/[^0-9.]/g, ''));
    if (isNaN(cleanPrice)) return [];

    const history = [];
    const today = new Date();
    // Generate 6 months of history
    for (let i = 5; i >= 0; i--) {
        const date = new Date(today);
        date.setMonth(date.getMonth() - i);

        // Random fluctuation between -10% and +15% of current price
        const fluctuation = 1 + (Math.random() * 0.25 - 0.10);
        let price = Math.round(cleanPrice * fluctuation);

        // Ensure the last entry (today) matches current price approximately or exactly
        if (i === 0) price = cleanPrice;

        history.push({
            date: date.toISOString().split('T')[0], // YYYY-MM-DD
            price: price
        });
    }
    return history;
}

export async function scrapeProductsGoogleShopping(query: string, page: number = 1): Promise<Product[]> {
    console.log(`[Scraper] Starting Google Shopping scrape for: ${query} (Page ${page})`);
    const products: Product[] = [];
    try {
        const start = (page - 1) * 20;
        const url = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}&start=${start}`;
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            },
            timeout: 8000
        });

        const $ = cheerio.load(data);

        $('.sh-dgr__grid-result, .sh-dlr__list-result').each((i, el) => {
            if (products.length >= 24) return;

            const title = $(el).find('h3, .tAxDx').text().trim();
            const price = $(el).find('.a83uyx, .OFFNJ, .HRLxBb').first().text().trim();
            const storeName = $(el).find('.aULzUe, .IuHnof').text().trim();

            const imgContainer = $(el).find('.Ar9Zdb img, .R0153c img');
            let image = imgContainer.attr('src') || imgContainer.attr('data-src');

            const linkHref = $(el).find('a.Lq5Ohm, a.shntl').attr('href');
            let link = linkHref ? `https://www.google.com${linkHref}` : undefined;

            if (title && price) {
                const brands = ["Sony", "Apple", "Samsung", "Dyson", "Nintendo", "KitchenAid", "Bose", "LG", "HP", "Dell", "Microsoft"];
                const brand = brands.find(b => title.toLowerCase().includes(b.toLowerCase())) || "Generic";
                const id = generateProductId(link, title, storeName || "Google Shopping");

                products.push({
                    id: id,
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
                    link: link,
                    source: 'main'
                });
            }
        });

        if (products.length < 5) {
            $('.sh-np__grid-result, .sh-pr__product-result').each((i, el) => {
                if (products.length >= 24) return;
                const title = $(el).find('h3').text().trim();
                const price = $(el).find('span[aria-hidden="true"]').first().text().trim();

                if (title && price.match(/[0-9]/)) {
                    const id = generateProductId(undefined, title, "Related");
                    products.push({
                        id: id,
                        title: title,
                        price: price,
                        image: "",
                        storeName: "Related Item",
                        model: "N/A",
                        category: "General",
                        brand: "Generic",
                        bestPrice: false,
                        rating: 7.5,
                        trustScoreBadge: "Good",
                        link: `https://www.google.com/search?q=${encodeURIComponent(title)}`,
                        source: 'related'
                    });
                }
            });
        }
    } catch (err) {
        console.error("Google Shopping scrape failed:", err);
    }
    return products;
}

export async function scrapeProductsBing(query: string, page: number = 1): Promise<Product[]> {
    console.log(`[Scraper] Starting Bing scrape for Indian Market: ${query} (Page ${page})`);
    const products: Product[] = [];
    try {
        const offset = (page - 1) * 20 + 1;
        const url = `https://www.bing.com/shop?q=${encodeURIComponent(query)}&cc=IN&setLang=en-IN&first=${offset}&FORM=PORE`;

        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache',
            },
            timeout: 8000
        });

        const $ = cheerio.load(data);

        $('.br-item').each((i, el) => {
            if (products.length >= 40) return;

            const card = $(el).find('.br-card');
            const target = card.length ? card : $(el);
            const title = target.find('.br-title').text().trim() || target.attr('title');
            let priceText = target.find('.br-standardPrice').first().text().trim() ||
                target.find('.br-focusPrice').first().text().trim();

            if (!priceText.match(/[0-9]/)) return;
            if (!priceText.includes('₹') && !priceText.includes('Rs') && !priceText.includes('$')) {
                priceText = `₹${priceText}`;
            }

            if (!title) return;

            const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
            const titleLower = title.toLowerCase();
            if (queryWords.length > 0 && !titleLower.includes(queryWords[0]) && !titleLower.includes('iphone')) {
                const matchCount = queryWords.reduce((count, word) => count + (titleLower.includes(word) ? 1 : 0), 0);
                if (matchCount / queryWords.length < 0.5) return;
            }

            const img = target.find('img');
            let image = img.attr('data-src-hq') || img.attr('data-src') || img.attr('src');
            if (image && image.startsWith('data:image') && image.length < 1000) image = undefined;
            if (image) {
                if (image.startsWith('/')) image = `https://www.bing.com${image}`;
                if (image.startsWith('//')) image = `https:${image}`;
            }
            if (!image) {
                image = `https://tse2.mm.bing.net/th?q=${encodeURIComponent(title)}&w=500&h=500&c=7&rs=1&p=0`;
            }

            let link = target.find('a').attr('href');
            if (!link || link.startsWith('javascript')) {
                link = `https://www.bing.com/shop?q=${encodeURIComponent(title || query)}`;
            } else if (link.startsWith('/')) {
                link = `https://www.bing.com${link}`;
            }

            let storeName = target.find('.br-sellerName').first().text().trim() ||
                target.find('.br-seller').first().text().trim() ||
                target.find('.br-sellers').first().text().trim() ||
                target.find('.br-retailerName').first().text().trim();

            if (!storeName && link) {
                try {
                    const urlObj = new URL(link);
                    let domain = urlObj.hostname.replace('www.', '');
                    if (domain.includes('amazon')) storeName = 'Amazon.in';
                    else if (domain.includes('flipkart')) storeName = 'Flipkart';
                    else if (domain.includes('myntra')) storeName = 'Myntra';
                    else if (domain.includes('ajio')) storeName = 'Ajio';
                    else if (domain.includes('tatacliq')) storeName = 'Tata Cliq';
                    else if (domain.includes('croma')) storeName = 'Croma';
                    else if (domain.includes('reliancedigital')) storeName = 'Reliance Digital';
                    else storeName = domain.split('.')[0];
                    storeName = storeName.charAt(0).toUpperCase() + storeName.slice(1);
                } catch (e) { }
            }
            if (!storeName) storeName = "Unknown Seller";

            const isIndianStore = INDIAN_STORES.some(s => storeName.toLowerCase().includes(s.toLowerCase())) ||
                storeName.toLowerCase().includes(".in") ||
                (link && link.includes(".in/"));

            const priceHistory = generatePriceHistory(priceText);

            if (title && priceText) {
                const brands = ["Sony", "Apple", "Samsung", "Dyson", "Nintendo", "KitchenAid", "Bose", "LG", "HP", "Dell", "Microsoft", "Nike", "Adidas", "Puma", "Zara", "H&M"];
                const brand = brands.find(b => title.toLowerCase().includes(b.toLowerCase())) || "Generic";
                const rating = Number((Math.random() * 1.5 + 8.4).toFixed(1));
                const id = generateProductId(link, title, storeName);

                const product: Product = {
                    id: id,
                    title: title,
                    price: priceText,
                    image: image!,
                    storeName: storeName,
                    model: "N/A",
                    category: "General",
                    brand: brand,
                    bestPrice: false,
                    rating: rating,
                    trustScoreBadge: rating > 9.0 ? "Excellent" : "Very Good",
                    link: link,
                    priceHistory: priceHistory,
                    source: 'main'
                };

                if (isIndianStore) products.unshift(product);
                else products.push(product);
            }
        });

        if (products.length < 5) {
            $('.b_algo').each((i, el) => {
                if (products.length >= 24) return;
                const title = $(el).find('h2').text().trim();
                const text = $(el).text();
                const priceMatch = text.match(/[$₹]\s?[\d,]+(\.\d{2})?/);

                if (title && priceMatch) {
                    const id = generateProductId(undefined, title, "Related Result");
                    products.push({
                        id: id,
                        title: title,
                        price: priceMatch[0],
                        image: `https://image.pollinations.ai/prompt/${encodeURIComponent(title)}%20product?width=400&height=400&nologo=true`,
                        storeName: "Related Result",
                        model: "N/A",
                        category: "General",
                        brand: "Generic",
                        bestPrice: false,
                        rating: 7.0,
                        trustScoreBadge: "Good",
                        link: $(el).find('a').attr('href'),
                        source: 'related'
                    });
                }
            });
        }

        const finalProducts = products.filter(p => {
            return p.image && p.image.length > 5 && p.price;
        }).sort((a, b) => {
            const score = (p: Product) => {
                const s = p.storeName.toLowerCase();
                if (s.includes('amazon') || s.includes('flipkart')) return 20;
                if (s.includes('myntra') || s.includes('ajio') || s.includes('tata')) return 15;
                if (s.includes('croma') || s.includes('reliance')) return 10;
                return 0;
            };
            return score(b) - score(a);
        });

        const uniqueProducts: Product[] = [];
        const titles = new Set();
        for (const p of finalProducts) {
            const shortTitle = p.title.substring(0, 20).toLowerCase();
            if (!titles.has(shortTitle)) {
                titles.add(shortTitle);
                uniqueProducts.push(p);
            }
        }

        const resultSlice = uniqueProducts.slice(0, 24);
        if (resultSlice.length > 0) resultSlice[0].bestPrice = true;
        return resultSlice;

    } catch (err) {
        console.error("Bing scrape failed:", err);
    }

    // If no products found, try fallback queries for specific product searches
    if (products.length === 0) {
        const fallbackQueries = generateFallbackQueries(query);
        for (const fallbackQuery of fallbackQueries) {
            if (fallbackQuery !== query) {
                console.log(`[Scraper] Trying fallback query: ${fallbackQuery}`);
                try {
                    const fallbackProducts = await scrapeProductsBing(fallbackQuery, page);
                    if (fallbackProducts.length > 0) {
                        console.log(`[Scraper] Fallback query "${fallbackQuery}" found ${fallbackProducts.length} products`);
                        return fallbackProducts;
                    }
                } catch (e) {
                    console.warn(`[Scraper] Fallback query "${fallbackQuery}" failed:`, e);
                }
            }
        }
    }

    return products;
}

function generateFallbackQueries(originalQuery: string): string[] {
    const queries = [originalQuery];
    const lowerQuery = originalQuery.toLowerCase();

    // For iPhone models, try more general versions
    if (lowerQuery.includes('iphone')) {
        if (lowerQuery.includes('pro max')) {
            queries.push(originalQuery.replace(/pro max/i, 'pro'));
            queries.push(originalQuery.replace(/pro max/i, ''));
            queries.push('iPhone 15');
        } else if (lowerQuery.includes('pro')) {
            queries.push(originalQuery.replace(/pro/i, ''));
            queries.push('iPhone 15');
        } else if (lowerQuery.includes('15') || lowerQuery.includes('14') || lowerQuery.includes('13')) {
            const model = lowerQuery.match(/(15|14|13)/)?.[0];
            if (model) {
                queries.push(`iPhone ${model}`);
            }
        }
    }

    // For other products, try removing specific model numbers
    const words = originalQuery.split(/\s+/);
    if (words.length > 2) {
        // Remove last word (often model number)
        queries.push(words.slice(0, -1).join(' '));
        // Remove last two words
        if (words.length > 3) {
            queries.push(words.slice(0, -2).join(' '));
        }
    }

    return [...new Set(queries)]; // Remove duplicates
}

export async function scrapeProductsEbay(query: string, page: number = 1): Promise<Product[]> {
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
            if (products.length >= 24) return;

            const title = $(element).find('.s-item__title').text().trim();
            if (title.toLowerCase().includes("shop on ebay")) return;

            const priceText = $(element).find('.s-item__price').text().trim();
            const imgEl = $(element).find('.s-item__image img');
            let image = imgEl.attr('data-src') || imgEl.attr('data-img-src') || imgEl.attr('src');

            if (!image || image.includes('gif') || image.includes('blank')) {
                const specificImg = $(element).find('.s-item__image-img');
                image = specificImg.attr('data-src') || specificImg.attr('src') || image;
            }

            const link = $(element).find('.s-item__link').attr('href');
            const price = priceText.split(' to ')[0];

            if (title && price && image) {
                if (image && image.startsWith('//')) {
                    image = `https:${image}`;
                }
                const brands = ["Sony", "Apple", "Samsung", "Dyson", "Nintendo", "KitchenAid", "Bose", "LG", "HP", "Dell", "Microsoft"];
                const brand = brands.find(b => title.toLowerCase().includes(b.toLowerCase())) || "Generic";
                const id = generateProductId(link, title, "eBay");

                products.push({
                    id: id,
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
    } catch (error) {
        console.error("[Scraper] eBay scraping failed:", error);
    }
    return products;
}

export async function scrapeProductsDuckDuckGo(query: string, page: number = 1): Promise<Product[]> {
    console.log(`[Scraper] Starting DDG scrape for: ${query} (Page ${page})`);
    const products: Product[] = [];
    try {
        const skip = (page - 1) * 30;
        const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query + " price")}&s=${skip}`;
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });

        const $ = cheerio.load(data);

        $('.result').each((i, el) => {
            if (products.length >= 24) return;

            const title = $(el).find('.result__a').text().trim();
            const snippet = $(el).find('.result__snippet').text().trim();
            const link = $(el).find('.result__a').attr('href');

            const priceMatch = (title + " " + snippet).match(/(?:\$|₹|Rs\.?)\s?[\d,]+(?:\.\d{2})?/i);

            if (title && priceMatch) {
                const image = `https://image.pollinations.ai/prompt/${encodeURIComponent(title)}%20product%20photo?width=400&height=400&nologo=true`;

                let realLink = link;
                if (link && link.includes('uddg=')) {
                    try {
                        const urlObj = new URL(link, 'https://duckduckgo.com');
                        realLink = decodeURIComponent(urlObj.searchParams.get('uddg') || link);
                    } catch (e) { }
                }

                const brands = ["Sony", "Apple", "Samsung", "Dyson", "Nintendo", "KitchenAid", "Bose", "LG", "HP", "Dell", "Microsoft"];
                const brand = brands.find(b => title.toLowerCase().includes(b.toLowerCase())) || "Generic";
                const id = generateProductId(realLink, title, "Online Store");

                products.push({
                    id: id,
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
                    link: realLink,
                    source: 'main'
                });
            }
        });
    } catch (err) {
        console.error("DDG scrape failed:", err);
    }
    return products;
}
