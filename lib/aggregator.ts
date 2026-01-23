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

    // Check for critical variant mismatch
    const variantKeywords = ['128gb', '256gb', '512gb', '1tb', '8gb', '16gb', '32gb', 'pro', 'max', 'plus', 'ultra', 'mini', 'slim', 'digital', 'disc', 'oled', 'lite'];
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

export function aggregateProducts(products: Product[]): Product[] {
    const aggregated: Product[] = [];
    const groupedMap = new Map<string, Product[]>();

    // 1. Group similar products
    for (const product of products) {
        let matchFound = false;

        // Try to match with existing groups
        for (const [key, group] of groupedMap.entries()) {
            const representative = group[0];
            const similarity = calculateSimilarity(representative.title, product.title);

            // High similarity threshold
            if (similarity > 0.65) {
                group.push(product);
                matchFound = true;
                break;
            }
        }

        // If no match, start a new group
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
