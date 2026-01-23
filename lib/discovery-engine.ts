/**
 * Autonomous Product Discovery Engine
 * 
 * This module implements a crawler that continuously discovers new products
 * by following related searches, category links, brand pages, and variant links.
 * It does NOT rely on "Load More" or pagination buttons.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { Product } from './mock-scraper';

// ============================================================================
// TYPES
// ============================================================================

interface DiscoverySource {
    url: string;
    type: 'seed' | 'related_search' | 'category' | 'brand' | 'variant' | 'similar';
    depth: number;
    parentQuery?: string;
}

interface DiscoveryState {
    scrapedProductIds: Set<string>;
    visitedUrls: Set<string>;
    urlQueue: DiscoverySource[];
    products: Product[];
    discoveryPath: Map<string, string>; // productId -> how it was found
}

interface DiscoveryConfig {
    maxProducts: number;
    maxDepth: number;
    maxUrlsPerSource: number;
    timeoutMs: number;
}

const DEFAULT_CONFIG: DiscoveryConfig = {
    maxProducts: 100,
    maxDepth: 3,
    maxUrlsPerSource: 5,
    timeoutMs: 8000
};

// ============================================================================
// HELPERS
// ============================================================================

function generateProductId(title: string, storeName: string): string {
    const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50);
    const normalizedStore = storeName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `prod-${normalizedTitle}-${normalizedStore}`;
}

function extractRelatedSearches($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const searches: string[] = [];

    // Bing related searches
    $('.b_rs a, .b_algo a').each((_, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('/shop?q=')) {
            searches.push(href.startsWith('http') ? href : `https://www.bing.com${href}`);
        }
    });

    // Google related searches
    $('.k8XOCe a, .isv-r a').each((_, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('tbm=shop')) {
            searches.push(href.startsWith('http') ? href : `https://www.google.com${href}`);
        }
    });

    // Generic "related" or "similar" links
    $('a').each((_, el) => {
        const text = $(el).text().toLowerCase();
        const href = $(el).attr('href') || '';
        if ((text.includes('similar') || text.includes('related') || text.includes('you may also like')) && href.length > 5) {
            const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
            searches.push(fullUrl);
        }
    });

    return [...new Set(searches)].slice(0, 10);
}

function extractCategoryLinks($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const categories: string[] = [];

    // Common category link patterns
    $('a[href*="/category/"], a[href*="/c/"], a[href*="/browse/"], a[href*="/shop/"]').each((_, el) => {
        const href = $(el).attr('href');
        if (href) {
            categories.push(href.startsWith('http') ? href : `${baseUrl}${href}`);
        }
    });

    return [...new Set(categories)].slice(0, 5);
}

function extractBrandLinks($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const brands: string[] = [];

    $('a[href*="/brand/"], a[href*="/b/"], a[href*="brand="]').each((_, el) => {
        const href = $(el).attr('href');
        if (href) {
            brands.push(href.startsWith('http') ? href : `${baseUrl}${href}`);
        }
    });

    return [...new Set(brands)].slice(0, 5);
}

function extractVariantLinks($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const variants: string[] = [];

    // Size, color, storage selectors
    $('a[href*="size="], a[href*="color="], a[href*="storage="], a[href*="variant="]').each((_, el) => {
        const href = $(el).attr('href');
        if (href) {
            variants.push(href.startsWith('http') ? href : `${baseUrl}${href}`);
        }
    });

    return [...new Set(variants)].slice(0, 5);
}

// ============================================================================
// PRODUCT EXTRACTION
// ============================================================================

function extractProductsFromPage($: cheerio.CheerioAPI, sourceUrl: string, sourceType: string): Product[] {
    const products: Product[] = [];

    // Bing Shopping products
    $('.br-item, .br-card').each((i, el) => {
        if (products.length >= 20) return;

        const target = $(el);
        const title = target.find('.br-title').text().trim() || target.attr('title');
        let priceText = target.find('.br-standardPrice, .br-focusPrice').first().text().trim();

        if (!title || !priceText.match(/[0-9]/)) return;

        if (!priceText.includes('₹') && !priceText.includes('Rs')) {
            priceText = `₹${priceText}`;
        }

        const img = target.find('img');
        let image = img.attr('data-src-hq') || img.attr('data-src') || img.attr('src') || '';
        if (image.startsWith('/')) image = `https://www.bing.com${image}`;
        if (image.startsWith('//')) image = `https:${image}`;
        if (!image || image.length < 10) {
            image = `https://image.pollinations.ai/prompt/${encodeURIComponent(title)}%20product?width=400&height=400&nologo=true`;
        }

        let storeName = target.find('.br-sellerName, .br-retailerName').first().text().trim() || "Unknown Seller";

        const id = generateProductId(title, storeName);

        products.push({
            id,
            title,
            price: priceText,
            image,
            storeName,
            model: "N/A",
            category: "General",
            brand: "Generic",
            bestPrice: false,
            rating: Number((Math.random() * 1.5 + 8.0).toFixed(1)),
            trustScoreBadge: "Very Good",
            link: sourceUrl,
            source: 'main'
        });
    });

    // Google Shopping products
    $('.sh-dgr__grid-result, .sh-dlr__list-result').each((i, el) => {
        if (products.length >= 20) return;

        const title = $(el).find('h3, .tAxDx').text().trim();
        const price = $(el).find('.a83uyx, .OFFNJ').first().text().trim();
        const storeName = $(el).find('.aULzUe').text().trim() || "Google Shopping";

        if (!title || !price) return;

        const imgEl = $(el).find('img');
        let image = imgEl.attr('src') || imgEl.attr('data-src') || '';
        if (!image) {
            image = `https://image.pollinations.ai/prompt/${encodeURIComponent(title)}%20product?width=400&height=400&nologo=true`;
        }

        const id = generateProductId(title, storeName);

        products.push({
            id,
            title,
            price,
            image,
            storeName,
            model: "N/A",
            category: "General",
            brand: "Generic",
            bestPrice: false,
            rating: Number((Math.random() * 1.5 + 8.0).toFixed(1)),
            trustScoreBadge: "Very Good",
            link: sourceUrl,
            source: 'main'
        });
    });

    // Generic product cards (fallback)
    if (products.length < 5) {
        $('[class*="product"], [class*="item"], [class*="card"]').each((i, el) => {
            if (products.length >= 20) return;

            const title = $(el).find('h2, h3, .title, [class*="name"]').first().text().trim();
            const priceMatch = $(el).text().match(/[$₹]\s?[\d,]+(\.\d{2})?/);

            if (title && priceMatch && title.length > 5 && title.length < 200) {
                const id = generateProductId(title, sourceType);

                // Check if we already have this product
                if (products.some(p => p.id === id)) return;

                products.push({
                    id,
                    title,
                    price: priceMatch[0],
                    image: `https://image.pollinations.ai/prompt/${encodeURIComponent(title)}%20product?width=400&height=400&nologo=true`,
                    storeName: sourceType,
                    model: "N/A",
                    category: "General",
                    brand: "Generic",
                    bestPrice: false,
                    rating: 7.5,
                    trustScoreBadge: "Good",
                    link: sourceUrl,
                    source: 'related'
                });
            }
        });
    }

    return products;
}

// ============================================================================
// MAIN DISCOVERY ENGINE
// ============================================================================

export async function discoverProducts(
    seedQuery: string,
    config: Partial<DiscoveryConfig> = {}
): Promise<{ products: Product[]; stats: { urlsVisited: number; urlsQueued: number } }> {
    const cfg: DiscoveryConfig = { ...DEFAULT_CONFIG, ...config };

    const state: DiscoveryState = {
        scrapedProductIds: new Set(),
        visitedUrls: new Set(),
        urlQueue: [],
        products: [],
        discoveryPath: new Map()
    };

    // Initialize with seed URLs from multiple sources
    const seedUrls: DiscoverySource[] = [
        {
            url: `https://www.bing.com/shop?q=${encodeURIComponent(seedQuery)}&cc=IN&setLang=en-IN`,
            type: 'seed',
            depth: 0,
            parentQuery: seedQuery
        },
        {
            url: `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(seedQuery)}`,
            type: 'seed',
            depth: 0,
            parentQuery: seedQuery
        }
    ];

    state.urlQueue.push(...seedUrls);

    console.log(`[Discovery] Starting autonomous discovery for: "${seedQuery}"`);
    console.log(`[Discovery] Config: maxProducts=${cfg.maxProducts}, maxDepth=${cfg.maxDepth}`);

    // Main crawl loop
    while (state.urlQueue.length > 0 && state.products.length < cfg.maxProducts) {
        const source = state.urlQueue.shift()!;

        // Skip if already visited or too deep
        if (state.visitedUrls.has(source.url) || source.depth > cfg.maxDepth) {
            continue;
        }

        state.visitedUrls.add(source.url);
        console.log(`[Discovery] Visiting: ${source.url} (depth=${source.depth}, type=${source.type})`);

        try {
            const { data } = await axios.get(source.url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-IN,en;q=0.9',
                },
                timeout: cfg.timeoutMs
            });

            const $ = cheerio.load(data);
            const baseUrl = new URL(source.url).origin;

            // 1. Extract products from this page
            const pageProducts = extractProductsFromPage($, source.url, source.type);

            for (const product of pageProducts) {
                if (!state.scrapedProductIds.has(product.id) && state.products.length < cfg.maxProducts) {
                    state.scrapedProductIds.add(product.id);
                    state.discoveryPath.set(product.id, `Found via ${source.type} at depth ${source.depth}`);
                    state.products.push(product);
                }
            }

            console.log(`[Discovery] Extracted ${pageProducts.length} products. Total unique: ${state.products.length}`);

            // 2. Discover new URLs (only if we haven't hit the product limit)
            if (state.products.length < cfg.maxProducts) {
                const nextDepth = source.depth + 1;

                // Related searches
                const relatedSearches = extractRelatedSearches($, baseUrl);
                for (const url of relatedSearches.slice(0, cfg.maxUrlsPerSource)) {
                    if (!state.visitedUrls.has(url)) {
                        state.urlQueue.push({ url, type: 'related_search', depth: nextDepth, parentQuery: source.parentQuery });
                    }
                }

                // Category links
                const categoryLinks = extractCategoryLinks($, baseUrl);
                for (const url of categoryLinks.slice(0, cfg.maxUrlsPerSource)) {
                    if (!state.visitedUrls.has(url)) {
                        state.urlQueue.push({ url, type: 'category', depth: nextDepth, parentQuery: source.parentQuery });
                    }
                }

                // Brand links
                const brandLinks = extractBrandLinks($, baseUrl);
                for (const url of brandLinks.slice(0, cfg.maxUrlsPerSource)) {
                    if (!state.visitedUrls.has(url)) {
                        state.urlQueue.push({ url, type: 'brand', depth: nextDepth, parentQuery: source.parentQuery });
                    }
                }

                // Variant links
                const variantLinks = extractVariantLinks($, baseUrl);
                for (const url of variantLinks.slice(0, cfg.maxUrlsPerSource)) {
                    if (!state.visitedUrls.has(url)) {
                        state.urlQueue.push({ url, type: 'variant', depth: nextDepth, parentQuery: source.parentQuery });
                    }
                }
            }

        } catch (error) {
            console.error(`[Discovery] Failed to fetch ${source.url}:`, error instanceof Error ? error.message : error);
        }
    }

    console.log(`[Discovery] Complete. Found ${state.products.length} unique products from ${state.visitedUrls.size} URLs.`);

    return {
        products: state.products,
        stats: {
            urlsVisited: state.visitedUrls.size,
            urlsQueued: state.urlQueue.length
        }
    };
}

// ============================================================================
// STREAMING API (for continuous discovery)
// ============================================================================

export async function* discoverProductsStream(
    seedQuery: string,
    config: Partial<DiscoveryConfig> = {}
): AsyncGenerator<Product, void, unknown> {
    const cfg: DiscoveryConfig = { ...DEFAULT_CONFIG, ...config };

    const scrapedProductIds = new Set<string>();
    const visitedUrls = new Set<string>();
    const urlQueue: DiscoverySource[] = [];

    // Seed URLs
    urlQueue.push({
        url: `https://www.bing.com/shop?q=${encodeURIComponent(seedQuery)}&cc=IN&setLang=en-IN`,
        type: 'seed',
        depth: 0,
        parentQuery: seedQuery
    });

    let productCount = 0;

    while (urlQueue.length > 0 && productCount < cfg.maxProducts) {
        const source = urlQueue.shift()!;

        if (visitedUrls.has(source.url) || source.depth > cfg.maxDepth) continue;
        visitedUrls.add(source.url);

        try {
            const { data } = await axios.get(source.url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html',
                },
                timeout: cfg.timeoutMs
            });

            const $ = cheerio.load(data);
            const baseUrl = new URL(source.url).origin;

            const pageProducts = extractProductsFromPage($, source.url, source.type);

            for (const product of pageProducts) {
                if (!scrapedProductIds.has(product.id) && productCount < cfg.maxProducts) {
                    scrapedProductIds.add(product.id);
                    productCount++;
                    yield product; // Stream the product immediately
                }
            }

            // Queue more URLs
            const relatedSearches = extractRelatedSearches($, baseUrl);
            for (const url of relatedSearches.slice(0, 3)) {
                if (!visitedUrls.has(url)) {
                    urlQueue.push({ url, type: 'related_search', depth: source.depth + 1, parentQuery: seedQuery });
                }
            }

        } catch (error) {
            // Silently continue on errors
        }
    }
}
