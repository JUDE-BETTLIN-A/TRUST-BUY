import axios from "axios";
import * as cheerio from "cheerio";
import { Product } from "./mock-scraper";

// --- Types ---
export interface ScrapeResult {
    status: "success" | "partial" | "failed";
    products: ScrapedItem[];
    missing_sources: string[];
}

export interface ScrapedItem {
    product_name: string;
    price: string;
    image_url: string;
    specifications?: any[];
    source: string;
    go_to_store_url: string;
}

// --- Configuration ---
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "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";
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Model Fallback List
const MODELS = [
    "openai/gpt-4o",
    "meta-llama/llama-3.3-70b-instruct",
    "qwen/qwen-2.5-72b-instruct",
    "deepseek/deepseek-r1",
    "google/gemma-2-27b-it"
];

// ============================================================================
// STRATEGY 1: Direct HTML Parsing (No LLM - Fast & Reliable when it works)
// ============================================================================

async function scrapeAmazonDirect(query: string): Promise<ScrapedItem[]> {
    const products: ScrapedItem[] = [];

    try {
        const url = `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en-IN,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
            },
            timeout: 4000,
        });

        const $ = cheerio.load(data);

        // Amazon search result structure
        $('div[data-component-type="s-search-result"]').slice(0, 20).each((i, el) => {
            try {
                const title = $(el).find('h2 a span').text().trim() ||
                    $(el).find('.a-text-normal').first().text().trim();

                const priceWhole = $(el).find('.a-price-whole').first().text().replace(/,/g, '').trim();
                const price = priceWhole ? `₹${priceWhole}` : null;

                const image = $(el).find('img.s-image').attr('src') || "";

                const linkRaw = $(el).find('h2 a').attr('href') || $(el).find('a.a-link-normal').first().attr('href');
                const link = linkRaw ? (linkRaw.startsWith('http') ? linkRaw : `https://www.amazon.in${linkRaw}`) : "";

                if (title && price && link) {
                    products.push({
                        product_name: title.substring(0, 150),
                        price: price,
                        image_url: image,
                        source: "Amazon.in",
                        go_to_store_url: link.split('?')[0] + '?tag=trustbuy' // Clean URL
                    });
                }
            } catch (e) { /* Skip malformed item */ }
        });

        console.log(`[Direct] Amazon.in found ${products.length} products`);
    } catch (e) {
        console.warn(`[Direct] Amazon.in scrape failed: ${(e as any).message}`);
    }

    return products;
}

async function scrapeFlipkartDirect(query: string): Promise<ScrapedItem[]> {
    const products: ScrapedItem[] = [];

    try {
        const url = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en-IN,en;q=0.9',
            },
            timeout: 4000,
        });

        const $ = cheerio.load(data);

        // Flipkart uses dynamic class names, but structure is consistent
        // Try multiple selector patterns
        const selectors = [
            'div._1AtVbE div._4rR01T', // Product titles
            'a.s1Q9rs',                // Grid item titles
            'div._2WkVRV',             // List item titles
        ];

        // Method 1: Grid layout products
        $('div._1AtVbE').slice(0, 20).each((i, el) => {
            try {
                const title = $(el).find('div._4rR01T, a.s1Q9rs, a.IRpwTa').text().trim();
                const priceText = $(el).find('div._30jeq3, div._1_WHN1').first().text().trim();
                const image = $(el).find('img._396cs4, img._2r_T1I').attr('src') || "";
                const linkRaw = $(el).find('a._1fQZEK, a.s1Q9rs, a._2rpwqI').attr('href') || "";

                if (title && priceText && title.length > 5) {
                    products.push({
                        product_name: title.substring(0, 150),
                        price: priceText,
                        image_url: image,
                        source: "Flipkart",
                        go_to_store_url: linkRaw.startsWith('http') ? linkRaw : `https://www.flipkart.com${linkRaw}`
                    });
                }
            } catch (e) { /* Skip */ }
        });

        console.log(`[Direct] Flipkart found ${products.length} products`);
    } catch (e) {
        console.warn(`[Direct] Flipkart scrape failed: ${(e as any).message}`);
    }

    return products;
}

// ============================================================================
// CROMA - Major Indian Electronics Retailer
// ============================================================================

async function scrapeCromaDirect(query: string): Promise<ScrapedItem[]> {
    const products: ScrapedItem[] = [];

    try {
        const url = `https://www.croma.com/searchB?q=${encodeURIComponent(query)}%3Arelevance&text=${encodeURIComponent(query)}`;
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en-IN,en;q=0.9',
            },
            timeout: 4000,
        });

        const $ = cheerio.load(data);

        // Croma product grid
        $('li.product-item, div.product-item, div.cp-product').slice(0, 20).each((i, el) => {
            try {
                const title = $(el).find('h3.product-title, .product-title a, .cp-product__main-details a').text().trim() ||
                    $(el).find('a[title]').attr('title') || "";

                const priceText = $(el).find('.pdpPriceMrp, .new-price, .cp-product__price .amount, span[data-testid="product-price"]').first().text().trim();
                const price = priceText.includes('₹') ? priceText : `₹${priceText.replace(/[^0-9,]/g, '')}`;

                const image = $(el).find('img.product-img, img.cp-product__image, img.lazy-image').attr('src') ||
                    $(el).find('img.product-img, img.cp-product__image').attr('data-src') || "";

                const linkRaw = $(el).find('a.product__list--name, a.product-title, a.cp-product__main-details').attr('href') ||
                    $(el).find('a[href*="/p/"]').attr('href') || "";
                const link = linkRaw.startsWith('http') ? linkRaw : `https://www.croma.com${linkRaw}`;

                if (title && price && title.length > 3 && /\d/.test(price)) {
                    products.push({
                        product_name: title.substring(0, 150),
                        price: price,
                        image_url: image,
                        source: "Croma",
                        go_to_store_url: link
                    });
                }
            } catch (e) { /* Skip malformed */ }
        });

        console.log(`[Direct] Croma found ${products.length} products`);
    } catch (e) {
        console.warn(`[Direct] Croma scrape failed: ${(e as any).message}`);
    }

    return products;
}

// ============================================================================
// RELIANCE DIGITAL - Major Indian Electronics Retailer
// ============================================================================

async function scrapeRelianceDigitalDirect(query: string): Promise<ScrapedItem[]> {
    const products: ScrapedItem[] = [];

    try {
        const url = `https://www.reliancedigital.in/search?q=${encodeURIComponent(query)}`;
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en-IN,en;q=0.9',
            },
            timeout: 4000,
        });

        const $ = cheerio.load(data);

        // Reliance Digital product grid
        $('div.sp__product, li.product, div[data-testid="product-card"]').slice(0, 20).each((i, el) => {
            try {
                const title = $(el).find('p.sp__name, .product-name, h3.product-title').text().trim() ||
                    $(el).find('a[title]').attr('title') || "";

                const priceText = $(el).find('span.TextWeb__Text-sc-1cyx778-0, .pdp__offerPrice, .amount').first().text().trim();
                const price = priceText.includes('₹') ? priceText : `₹${priceText.replace(/[^0-9,]/g, '')}`;

                const image = $(el).find('img.sp__product-image, img.product-image').attr('src') ||
                    $(el).find('img').attr('data-src') || "";

                const linkRaw = $(el).find('a.sp__product, a.product-link').attr('href') ||
                    $(el).find('a[href*="/product/"]').first().attr('href') || "";
                const link = linkRaw.startsWith('http') ? linkRaw : `https://www.reliancedigital.in${linkRaw}`;

                if (title && price && title.length > 3 && /\d/.test(price)) {
                    products.push({
                        product_name: title.substring(0, 150),
                        price: price,
                        image_url: image,
                        source: "Reliance Digital",
                        go_to_store_url: link
                    });
                }
            } catch (e) { /* Skip malformed */ }
        });

        console.log(`[Direct] Reliance Digital found ${products.length} products`);
    } catch (e) {
        console.warn(`[Direct] Reliance Digital scrape failed: ${(e as any).message}`);
    }

    return products;
}

// ============================================================================
// VIJAY SALES - Popular Indian Electronics Store
// ============================================================================

async function scrapeVijaySalesDirect(query: string): Promise<ScrapedItem[]> {
    const products: ScrapedItem[] = [];

    try {
        const url = `https://www.vijaysales.com/search/${encodeURIComponent(query.replace(/\s+/g, '%20'))}`;
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en-IN,en;q=0.9',
            },
            timeout: 4000,
        });

        const $ = cheerio.load(data);

        // Vijay Sales product grid
        $('div.product-item, div.product-card, li.product-list-item').slice(0, 20).each((i, el) => {
            try {
                const title = $(el).find('h2.product-name, a.product-title, .product-name a').text().trim() ||
                    $(el).find('a[title]').attr('title') || "";

                const priceText = $(el).find('.product-price, .price-box .price, span.amount').first().text().trim();
                const price = priceText.includes('₹') ? priceText : `₹${priceText.replace(/[^0-9,]/g, '')}`;

                const image = $(el).find('img.product-image, img.lazy').attr('src') ||
                    $(el).find('img').attr('data-src') || "";

                const linkRaw = $(el).find('a.product-link, a.product-name').attr('href') ||
                    $(el).find('a[href*="/product/"]').first().attr('href') || "";
                const link = linkRaw.startsWith('http') ? linkRaw : `https://www.vijaysales.com${linkRaw}`;

                if (title && price && title.length > 3 && /\d/.test(price)) {
                    products.push({
                        product_name: title.substring(0, 150),
                        price: price,
                        image_url: image,
                        source: "Vijay Sales",
                        go_to_store_url: link
                    });
                }
            } catch (e) { /* Skip malformed */ }
        });

        console.log(`[Direct] Vijay Sales found ${products.length} products`);
    } catch (e) {
        console.warn(`[Direct] Vijay Sales scrape failed: ${(e as any).message}`);
    }

    return products;
}

// ============================================================================
// TATA CLiQ - Tata's E-Commerce Platform
// ============================================================================

async function scrapeTataCliqDirect(query: string): Promise<ScrapedItem[]> {
    const products: ScrapedItem[] = [];

    try {
        const url = `https://www.tatacliq.com/search/?searchCategory=all&text=${encodeURIComponent(query)}`;
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en-IN,en;q=0.9',
            },
            timeout: 4000,
        });

        const $ = cheerio.load(data);

        // Tata CLiQ product grid
        $('div.ProductModule__base, div[data-productid], .product-card').slice(0, 20).each((i, el) => {
            try {
                const title = $(el).find('a.ProductDescription__productShortDesc, .product-name, h3.product-title').text().trim() ||
                    $(el).find('a[title]').attr('title') || "";

                const priceText = $(el).find('span.ProductPriceInfo__selectedPriceValue, .price, .product-price').first().text().trim();
                const price = priceText.includes('₹') ? priceText : `₹${priceText.replace(/[^0-9,]/g, '')}`;

                const image = $(el).find('img.ProductImage__imgElement, img.product-img').attr('src') ||
                    $(el).find('img').attr('data-src') || "";

                const linkRaw = $(el).find('a.ProductModule__imageBaseUrl, a.product-link').attr('href') ||
                    $(el).find('a[href*="/p/"]').first().attr('href') || "";
                const link = linkRaw.startsWith('http') ? linkRaw : `https://www.tatacliq.com${linkRaw}`;

                if (title && price && title.length > 3 && /\d/.test(price)) {
                    products.push({
                        product_name: title.substring(0, 150),
                        price: price,
                        image_url: image,
                        source: "Tata CLiQ",
                        go_to_store_url: link
                    });
                }
            } catch (e) { /* Skip malformed */ }
        });

        console.log(`[Direct] Tata CLiQ found ${products.length} products`);
    } catch (e) {
        console.warn(`[Direct] Tata CLiQ scrape failed: ${(e as any).message}`);
    }

    return products;
}

// ============================================================================
// PAYTM MALL - Paytm's E-Commerce Platform (Now ondc.paytm.com)
// ============================================================================

async function scrapePaytmMallDirect(query: string): Promise<ScrapedItem[]> {
    const products: ScrapedItem[] = [];

    try {
        // Paytm Mall's new URL structure
        const url = `https://paytmmall.com/shop/search?q=${encodeURIComponent(query)}&from=organic`;
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en-IN,en;q=0.9',
            },
            timeout: 4000,
        });

        const $ = cheerio.load(data);

        // Paytm Mall product grid
        $('div._1DPQ, div.product-grid-item, div[data-productid]').slice(0, 20).each((i, el) => {
            try {
                const title = $(el).find('div._2apC, .product-name, h3.title').text().trim() ||
                    $(el).find('a[title]').attr('title') || "";

                const priceText = $(el).find('span._3-Dw, .best-price, .final-price').first().text().trim();
                const price = priceText.includes('₹') ? priceText : `₹${priceText.replace(/[^0-9,]/g, '')}`;

                const image = $(el).find('img._2BDW, img.product-img').attr('src') ||
                    $(el).find('img').attr('data-src') || "";

                const linkRaw = $(el).find('a._8vVO, a.product-link').attr('href') ||
                    $(el).find('a[href*="/product/"]').first().attr('href') || "";
                const link = linkRaw.startsWith('http') ? linkRaw : `https://paytmmall.com${linkRaw}`;

                if (title && price && title.length > 3 && /\d/.test(price)) {
                    products.push({
                        product_name: title.substring(0, 150),
                        price: price,
                        image_url: image,
                        source: "Paytm Mall",
                        go_to_store_url: link
                    });
                }
            } catch (e) { /* Skip malformed */ }
        });

        console.log(`[Direct] Paytm Mall found ${products.length} products`);
    } catch (e) {
        console.warn(`[Direct] Paytm Mall scrape failed: ${(e as any).message}`);
    }

    return products;
}

// ============================================================================
// STRATEGY 2: Jina Reader Proxy (Bypasses most blocks, returns Markdown)
// ============================================================================

async function scrapeViaJina(targetUrl: string, sourceName: string): Promise<ScrapedItem[]> {
    const products: ScrapedItem[] = [];

    try {
        console.log(`[Jina] Fetching: ${targetUrl}`);
        const jinaUrl = `https://r.jina.ai/${targetUrl}`;

        const { data } = await axios.get(jinaUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'text/plain',
            },
            timeout: 4000,
        });

        if (!data || data.length < 500) {
            console.warn(`[Jina] Empty or blocked response for ${sourceName}`);
            return [];
        }

        // Parse markdown content to extract products using LLM
        const extracted = await extractWithLLM(data, sourceName);
        products.push(...extracted);

        console.log(`[Jina] ${sourceName} extracted ${products.length} products via LLM`);
    } catch (e) {
        console.warn(`[Jina] ${sourceName} failed: ${(e as any).message}`);
    }

    return products;
}

// ============================================================================
// STRATEGY 3: LLM-based Extraction (For complex/obfuscated content)
// ============================================================================

async function extractWithLLM(content: string, sourceName: string, modelIndex: number = 0): Promise<ScrapedItem[]> {
    if (modelIndex >= MODELS.length) {
        console.error("[LLM] All models exhausted");
        return [];
    }

    const model = MODELS[modelIndex];

    try {
        const prompt = `Extract product information from this e-commerce content.

SOURCE: ${sourceName}

RULES:
1. Extract ONLY real products with: name, price (INR ₹), image URL, product page URL
2. Price must be in Indian Rupees (₹)
3. URL must be a direct product link, not search/category page
4. Return ONLY valid JSON

CONTENT:
${content.substring(0, 40000)}

OUTPUT FORMAT:
{"products":[{"product_name":"...","price":"₹...","image_url":"https://...","source":"${sourceName}","go_to_store_url":"https://..."}]}`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": SITE_URL,
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.05,
            }),
        });

        if (!response.ok) throw new Error(`API ${response.status}: ${response.statusText}`);

        const json = await response.json();
        const parsed = JSON.parse(json.choices[0].message.content);

        if (parsed.products && Array.isArray(parsed.products)) {
            return parsed.products.filter((p: any) => p.product_name && p.price);
        }

        throw new Error("Invalid response format");

    } catch (error) {
        console.warn(`[LLM] ${model} failed, trying next...`);
        return extractWithLLM(content, sourceName, modelIndex + 1);
    }
}

// ============================================================================
// STRATEGY 4: Google Shopping India (Alternative reliable source)
// ============================================================================

async function scrapeGoogleShopping(query: string): Promise<ScrapedItem[]> {
    const products: ScrapedItem[] = [];

    try {
        // Google Shopping with India locale
        const url = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}&gl=in&hl=en`;

        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html',
                'Accept-Language': 'en-IN,en;q=0.9',
            },
            timeout: 4000,
        });

        const $ = cheerio.load(data);

        // Google Shopping grid items
        $('.sh-dgr__grid-result, .sh-dlr__list-result').slice(0, 20).each((i, el) => {
            try {
                const title = $(el).find('h3, .tAxDx, .Xjkr3b').first().text().trim();
                const priceText = $(el).find('.a8Pemb, .HRLxBb, .kHxwFf').first().text().trim();
                const image = $(el).find('img').attr('src') || "";
                const store = $(el).find('.aULzUe, .IuHnof, .E5ocAb').text().trim();

                // Google Shopping links are redirects, but title search is reliable
                const searchLink = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(title)}`;

                if (title && priceText && priceText.includes('â‚¹')) {
                    products.push({
                        product_name: title.substring(0, 150),
                        price: priceText,
                        image_url: image.startsWith('data:') ? "" : image,
                        source: store || "Google Shopping",
                        go_to_store_url: searchLink
                    });
                }
            } catch (e) { /* Skip */ }
        });

        console.log(`[Google] Shopping found ${products.length} products`);
    } catch (e) {
        console.warn(`[Google] Shopping scrape failed: ${(e as any).message}`);
    }

    return products;
}

// ============================================================================
// INTERNATIONAL E-COMMERCE (Ships to India)
// ============================================================================

// Amazon.com (International - ships to India)
async function scrapeAmazonCom(query: string): Promise<ScrapedItem[]> {
    const products: ScrapedItem[] = [];

    try {
        const url = `https://www.amazon.com/s?k=${encodeURIComponent(query)}&i=international-ship`;
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            timeout: 4000,
        });

        const $ = cheerio.load(data);

        $('div[data-component-type="s-search-result"]').slice(0, 20).each((i, el) => {
            try {
                const title = $(el).find('h2 a span').text().trim();
                const priceWhole = $(el).find('.a-price-whole').first().text().replace(/,/g, '').trim();
                const priceFraction = $(el).find('.a-price-fraction').first().text().trim();
                const price = priceWhole ? `$${priceWhole}${priceFraction ? '.' + priceFraction : ''}` : null;
                const image = $(el).find('img.s-image').attr('src') || "";
                const linkRaw = $(el).find('h2 a').attr('href') || "";
                const link = linkRaw.startsWith('http') ? linkRaw : `https://www.amazon.com${linkRaw}`;

                if (title && price && link) {
                    products.push({
                        product_name: title.substring(0, 150),
                        price: price + " (Ships to India)",
                        image_url: image,
                        source: "Amazon.com (Intl)",
                        go_to_store_url: link.split('?')[0]
                    });
                }
            } catch (e) { /* Skip */ }
        });

        console.log(`[Direct] Amazon.com found ${products.length} products`);
    } catch (e) {
        console.warn(`[Direct] Amazon.com scrape failed: ${(e as any).message}`);
    }

    return products;
}

// eBay (Ships worldwide including India)
async function scrapeEbayInternational(query: string): Promise<ScrapedItem[]> {
    const products: ScrapedItem[] = [];

    try {
        const url = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&_sacat=0&LH_PrefLoc=2`;
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
            },
            timeout: 4000,
        });

        const $ = cheerio.load(data);

        $('.s-item').slice(0, 20).each((i, el) => {
            try {
                const title = $(el).find('.s-item__title').text().trim();
                if (title === 'Shop on eBay') return;

                const priceText = $(el).find('.s-item__price').first().text().trim();
                const image = $(el).find('.s-item__image-img').attr('src') || "";
                const link = $(el).find('.s-item__link').attr('href') || "";

                if (title && priceText && link) {
                    products.push({
                        product_name: title.substring(0, 150),
                        price: priceText + " (Ships to India)",
                        image_url: image,
                        source: "eBay (Intl)",
                        go_to_store_url: link
                    });
                }
            } catch (e) { /* Skip */ }
        });

        console.log(`[Direct] eBay found ${products.length} products`);
    } catch (e) {
        console.warn(`[Direct] eBay scrape failed: ${(e as any).message}`);
    }

    return products;
}

// AliExpress (Ships to India)
async function scrapeAliExpress(query: string): Promise<ScrapedItem[]> {
    const products: ScrapedItem[] = [];

    try {
        const url = `https://www.aliexpress.com/w/wholesale-${encodeURIComponent(query.replace(/\s+/g, '-'))}.html?shipToRegion=IN`;
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            timeout: 4000,
        });

        const $ = cheerio.load(data);

        // AliExpress product cards
        $('div[class*="search-item-card"], div[class*="product-card"], a[class*="search-card"]').slice(0, 20).each((i, el) => {
            try {
                const title = $(el).find('h1, h3, [class*="title"]').first().text().trim();
                const priceText = $(el).find('[class*="price"], [class*="Price"]').first().text().trim();
                const image = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src') || "";
                const linkRaw = $(el).attr('href') || $(el).find('a').first().attr('href') || "";
                const link = linkRaw.startsWith('http') ? linkRaw : `https://www.aliexpress.com${linkRaw}`;

                if (title && priceText && title.length > 5) {
                    products.push({
                        product_name: title.substring(0, 150),
                        price: priceText + " (Ships to India)",
                        image_url: image,
                        source: "AliExpress",
                        go_to_store_url: link
                    });
                }
            } catch (e) { /* Skip */ }
        });

        console.log(`[Direct] AliExpress found ${products.length} products`);
    } catch (e) {
        console.warn(`[Direct] AliExpress scrape failed: ${(e as any).message}`);
    }

    return products;
}

// Newegg (Ships to India)
async function scrapeNewegg(query: string): Promise<ScrapedItem[]> {
    const products: ScrapedItem[] = [];

    try {
        const url = `https://www.newegg.com/global/in-en/p/pl?d=${encodeURIComponent(query)}`;
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
            },
            timeout: 4000,
        });

        const $ = cheerio.load(data);

        $('.item-cell, .item-container').slice(0, 20).each((i, el) => {
            try {
                const title = $(el).find('.item-title, a.item-title').text().trim();
                const priceText = $(el).find('.price-current').first().text().trim();
                const image = $(el).find('img.item-img, img').first().attr('src') || "";
                const link = $(el).find('a.item-title, a').first().attr('href') || "";

                if (title && priceText && title.length > 5) {
                    products.push({
                        product_name: title.substring(0, 150),
                        price: priceText + " (Ships to India)",
                        image_url: image,
                        source: "Newegg (Intl)",
                        go_to_store_url: link
                    });
                }
            } catch (e) { /* Skip */ }
        });

        console.log(`[Direct] Newegg found ${products.length} products`);
    } catch (e) {
        console.warn(`[Direct] Newegg scrape failed: ${(e as any).message}`);
    }

    return products;
}

// ============================================================================
// MAIN ORCHESTRATOR: Indian + International E-Commerce (Priority to India)
// ============================================================================

// Helper: Wrap scraper with timeout
async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
    const timeout = new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms));
    return Promise.race([promise, timeout]);
}

export async function scrapeIndianElectronics(query: string): Promise<ScrapeResult> {
    const indianProducts: ScrapedItem[] = [];
    const internationalProducts: ScrapedItem[] = [];
    const missingSources: string[] = [];
    const cleanQuery = query.replace(/[^\w\s-]/gi, '').trim();

    console.log(`\nâš¡ SCRAPING: "${cleanQuery}"`);
    console.log(`ðŸ‡®ðŸ‡³ Priority: Indian E-Commerce | ðŸŒ Secondary: International (Ships to India)`);

    const TIMEOUT_MS = 5000;

    // ============================================
    // PRIORITY 1: All 7 Indian sites in parallel
    // ============================================
    console.log(`\n--- ðŸ‡®ðŸ‡³ INDIAN E-COMMERCE ---`);

    const indianResults = await Promise.allSettled([
        withTimeout(scrapeAmazonDirect(cleanQuery), TIMEOUT_MS, []),
        withTimeout(scrapeFlipkartDirect(cleanQuery), TIMEOUT_MS, []),
        withTimeout(scrapeCromaDirect(cleanQuery), TIMEOUT_MS, []),
        withTimeout(scrapeRelianceDigitalDirect(cleanQuery), TIMEOUT_MS, []),
        withTimeout(scrapeVijaySalesDirect(cleanQuery), TIMEOUT_MS, []),
        withTimeout(scrapeTataCliqDirect(cleanQuery), TIMEOUT_MS, []),
        withTimeout(scrapePaytmMallDirect(cleanQuery), TIMEOUT_MS, [])
    ]);

    const indianSources = ["Amazon.in", "Flipkart", "Croma", "Reliance Digital", "Vijay Sales", "Tata CLiQ", "Paytm Mall"];

    indianResults.forEach((result, i) => {
        if (result.status === "fulfilled" && result.value.length > 0) {
            indianProducts.push(...result.value);
            console.log(`âœ… ${indianSources[i]}: ${result.value.length} products`);
        } else {
            missingSources.push(indianSources[i]);
            console.log(`â±ï¸ ${indianSources[i]}: Skipped`);
        }
    });

    // ============================================
    // PRIORITY 2: International sites (Ships to India)
    // ============================================
    console.log(`\n--- ðŸŒ INTERNATIONAL (Ships to India) ---`);

    const internationalResults = await Promise.allSettled([
        withTimeout(scrapeAmazonCom(cleanQuery), TIMEOUT_MS, []),
        withTimeout(scrapeEbayInternational(cleanQuery), TIMEOUT_MS, []),
        withTimeout(scrapeAliExpress(cleanQuery), TIMEOUT_MS, []),
        withTimeout(scrapeNewegg(cleanQuery), TIMEOUT_MS, []),
        withTimeout(scrapeGoogleShopping(cleanQuery), TIMEOUT_MS, [])
    ]);

    const intlSources = ["Amazon.com (Intl)", "eBay (Intl)", "AliExpress", "Newegg (Intl)", "Google Shopping"];

    internationalResults.forEach((result, i) => {
        if (result.status === "fulfilled" && result.value.length > 0) {
            internationalProducts.push(...result.value);
            console.log(`✅ ${intlSources[i]}: ${result.value.length} products`);
        } else {
            console.log(`⏱️ ${intlSources[i]}: Skipped`);
        }
    });

    // ============================================
    // COMBINE: Indian first, then International
    // ============================================
    const allProducts = [...indianProducts, ...internationalProducts];

    // ============================================
    // RELEVANCE FILTER: Only keep products matching search query
    // ============================================
    const queryKeywords = cleanQuery.toLowerCase().split(/\s+/).filter(k => k.length > 2);

    const relevantProducts = allProducts.filter(p => {
        if (!p.product_name) return false;
        const title = p.product_name.toLowerCase();

        // Product must match at least one significant keyword from the query
        const matchesQuery = queryKeywords.some(keyword => title.includes(keyword));

        if (!matchesQuery) {
            console.log(`🚫 Filtered out (irrelevant): ${p.product_name.substring(0, 50)}...`);
        }

        return matchesQuery;
    });

    console.log(`🎯 Relevance filter: ${allProducts.length} → ${relevantProducts.length} products`);

    // ============================================
    // Deduplicate by product name
    // ============================================
    const seen = new Set<string>();
    const uniqueProducts = relevantProducts.filter(p => {
        if (!p.product_name) return false;
        const key = p.product_name.toLowerCase().substring(0, 40);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    const indianCount = indianProducts.filter(p => queryKeywords.some(k => p.product_name?.toLowerCase().includes(k))).length;
    const intlCount = internationalProducts.filter(p => queryKeywords.some(k => p.product_name?.toLowerCase().includes(k))).length;
    const uniqueSources = new Set(uniqueProducts.map(p => p.source)).size;

    console.log(`\n✨ TOTAL: ${uniqueProducts.length} products (🇮🇳 ${indianCount} Indian + 🌍 ${intlCount} International) from ${uniqueSources} sources\n`);

    return {
        status: uniqueProducts.length > 0 ? "success" : "failed",
        products: uniqueProducts.slice(0, 50), // Increased cap to 50
        missing_sources: missingSources
    };
}

// ============================================================================
// ADAPTER: Convert to Legacy Product Interface
// ============================================================================

export async function scrapeProductsAgentic(query: string, page: number = 1): Promise<Product[]> {
    // Only scrape on page 1 to save resources
    if (page > 1) return [];

    try {
        const result = await scrapeIndianElectronics(query);

        return result.products
            .filter(p => p.product_name && p.price)
            .map(p => ({
                id: `agent-${Math.random().toString(36).substr(2, 9)}`,
                title: p.product_name,
                price: p.price,
                image: p.image_url || `https://placehold.co/400x400?text=${encodeURIComponent(p.product_name.substring(0, 15))}`,
                storeName: p.source,
                model: "N/A",
                category: "General",
                brand: "Generic",
                bestPrice: false,
                rating: 8.5,
                trustScoreBadge: "Good",
                link: p.go_to_store_url,
                source: 'main',
                priceHistory: []
            }));
    } catch (err) {
        console.error("[Agent] Critical error:", err);
        return [];
    }
}
