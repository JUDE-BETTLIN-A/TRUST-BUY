import { Product } from './mock-scraper';
import { extractSpecs } from './specs-extractor';

interface CanonicalProduct extends Product {
    variants: {
        ram?: string;
        storage?: string;
        color?: string;
    };
    sellers: {
        storeName: string;
        price: string;
        link: string;
        trustScore: string;
        available: boolean;
    }[];
}

// Helper to normalize price string to number for comparison
function parsePrice(priceStr: string): number {
    return Number(priceStr.replace(/[^0-9.]/g, '')) || 0;
}

// Tokenize title for fuzzy matching
function tokenize(text: string): Set<string> {
    if (!text) return new Set();
    return new Set(text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(t => t.length > 1 && !['with', 'and', 'for', 'the', 'edition'].includes(t))
    );
}

// Calculate similarity score (Jaccard Index)
function calculateSimilarity(title1: string, title2: string): number {
    const t1 = tokenize(title1);
    const t2 = tokenize(title2);

    // Check for critical variant mismatch (storage, RAM, model variants)
    const variantKeywords = ['128gb', '256gb', '512gb', '1tb', '4gb', '6gb', '8gb', '12gb', '16gb', '32gb', 'pro', 'max', 'plus', 'ultra', 'mini', 'slim', 'digital', 'disc', 'oled', 'lite', 'se', 'air', 'neo', 'fe', '5g', '4g'];
    for (const kw of variantKeywords) {
        if (t1.has(kw) !== t2.has(kw)) {
            return 0; // Immediate mismatch if variants differ
        }
    }

    const intersection = new Set([...t1].filter(x => t2.has(x)));
    const union = new Set([...t1, ...t2]);

    if (union.size === 0) return 0;
    return intersection.size / union.size;
}

// Check if two products are essentially the same (very strict matching)
function isExactSameProduct(title1: string, title2: string): boolean {
    // Normalize titles
    const norm1 = title1.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const norm2 = title2.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    
    // Only merge if titles are nearly identical (95%+ overlap)
    const similarity = calculateSimilarity(title1, title2);
    return similarity > 0.90; // Very strict - only merge almost identical products
}

export function aggregateProducts(products: Product[]): Product[] {
    // Filter out invalid products
    products = products.filter(p => p && p.title);

    const aggregated: Product[] = [];
    const groupedMap = new Map<string, Product[]>();

    // 1. Group ONLY truly identical products (same product from different sellers)
    for (const product of products) {
        let matchFound = false;

        // Try to match with existing groups - VERY STRICT matching only
        for (const [key, group] of groupedMap.entries()) {
            const representative = group[0];
            
            // Only group if products are essentially identical
            if (isExactSameProduct(representative.title, product.title)) {
                group.push(product);
                matchFound = true;
                break;
            }
        }

        // If no match, start a new group (this will be the common case now)
        if (!matchFound) {
            groupedMap.set(product.id, [product]);
        }
    }

    // 2. Reduce groups to single best listing with price comparison
    for (const group of groupedMap.values()) {
        // Sort by price to find the best deal
        group.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));

        const bestDeal = group[0];

        // Populate sellers array
        const sellers = group.map(p => ({
            storeName: p.storeName,
            price: p.price,
            link: p.link || '#',
            available: true
        }));

        // CHECK MANDATORY SOURCES (Amazon & Flipkart)
        // If missing, add them as "Unavailable" placeholders
        const mandatorySources = ['Amazon.in', 'Flipkart'];
        for (const source of mandatorySources) {
            const exists = sellers.some(s => s.storeName.toLowerCase().includes(source.toLowerCase()) ||
                source.toLowerCase().includes(s.storeName.toLowerCase()));

            if (!exists) {
                sellers.push({
                    storeName: source,
                    price: "Unavailable", // Placeholder price text
                    link: "#",
                    available: false // Explicitly marked unavailable
                });
            }
        }

        // Attach sellers to the best deal object
        bestDeal.sellers = sellers;

        // Merge price history
        const mergedHistory = [...(bestDeal.priceHistory || [])];
        for (const other of group.slice(1)) {
            if (other.priceHistory) {
                mergedHistory.push(...other.priceHistory);
            }
        }

        // Use the title that is most descriptive
        const bestTitle = group.reduce((prev, curr) => prev.title.length > curr.title.length ? prev : curr).title;
        bestDeal.title = bestTitle;
        bestDeal.priceHistory = mergedHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Mark as having multiple sellers (listing count)
        if (group.length > 1) {
            bestDeal.trustScoreBadge = "Best Price";
        }

        // Extract Specs from the best (longest) title
        bestDeal.specs = extractSpecs(bestTitle);

        aggregated.push(bestDeal);
    }

    return aggregated;
}
