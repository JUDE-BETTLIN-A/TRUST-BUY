/**
 * Price History Estimator
 * 
 * When external scrapers can't find real data, we generate realistic
 * estimated price history based on:
 * - Product category (phones, laptops, etc.)
 * - Known pricing patterns (seasonal sales, depreciation)
 * - Current price as anchor point
 * 
 * This is clearly labeled as "Estimated" in the UI.
 */

export interface EstimatedPricePoint {
    date: string;
    price: number;
    source: string;
}

// Indian sale events with typical discount percentages
const SALE_EVENTS: { month: number; day: number; name: string; discount: number }[] = [
    { month: 0, day: 26, name: "Republic Day Sale", discount: 0.08 },      // January 26
    { month: 2, day: 8, name: "Women's Day Sale", discount: 0.05 },        // March 8
    { month: 6, day: 15, name: "Prime Day", discount: 0.12 },              // July ~15
    { month: 7, day: 15, name: "Independence Day Sale", discount: 0.10 }, // August 15
    { month: 9, day: 15, name: "Diwali Sale", discount: 0.15 },            // October (Diwali)
    { month: 10, day: 25, name: "Black Friday", discount: 0.10 },          // November
    { month: 11, day: 25, name: "Christmas Sale", discount: 0.08 },        // December
];

// Product category patterns
interface CategoryPattern {
    keywords: string[];
    launchPremium: number;      // How much higher was launch price vs current
    monthlyDepreciation: number; // Monthly price drop rate
    volatility: number;          // Price fluctuation range
}

const CATEGORY_PATTERNS: CategoryPattern[] = [
    {
        keywords: ['iphone', 'apple'],
        launchPremium: 0.35,      // iPhones typically 35% higher at launch
        monthlyDepreciation: 0.02, // ~2% monthly drop
        volatility: 0.03
    },
    {
        keywords: ['samsung', 'galaxy'],
        launchPremium: 0.40,
        monthlyDepreciation: 0.03,
        volatility: 0.04
    },
    {
        keywords: ['oneplus', 'realme', 'xiaomi', 'redmi', 'poco'],
        launchPremium: 0.25,
        monthlyDepreciation: 0.025,
        volatility: 0.05
    },
    {
        keywords: ['laptop', 'macbook', 'notebook'],
        launchPremium: 0.20,
        monthlyDepreciation: 0.015,
        volatility: 0.03
    },
    {
        keywords: ['tv', 'television', 'monitor'],
        launchPremium: 0.30,
        monthlyDepreciation: 0.02,
        volatility: 0.06
    },
    {
        keywords: ['headphone', 'earphone', 'airpods', 'buds'],
        launchPremium: 0.15,
        monthlyDepreciation: 0.01,
        volatility: 0.04
    }
];

function getPatternForProduct(productName: string): CategoryPattern {
    const lowerName = productName.toLowerCase();
    
    for (const pattern of CATEGORY_PATTERNS) {
        if (pattern.keywords.some(kw => lowerName.includes(kw))) {
            return pattern;
        }
    }
    
    // Default pattern for unknown products
    return {
        keywords: [],
        launchPremium: 0.20,
        monthlyDepreciation: 0.015,
        volatility: 0.04
    };
}

function getSaleDiscount(date: Date): { discount: number; event: string | null } {
    const month = date.getMonth();
    const day = date.getDate();
    
    for (const sale of SALE_EVENTS) {
        // Check if within 5 days of sale event
        if (month === sale.month && Math.abs(day - sale.day) <= 5) {
            return { discount: sale.discount, event: sale.name };
        }
    }
    
    return { discount: 0, event: null };
}

/**
 * Generate estimated price history for a product
 */
export function generateEstimatedHistory(
    productName: string,
    currentPrice: number,
    daysBack: number = 60
): EstimatedPricePoint[] {
    const pattern = getPatternForProduct(productName);
    const history: EstimatedPricePoint[] = [];
    const today = new Date();
    
    // Start from daysBack days ago
    // The price was likely higher in the past
    
    // Calculate what the price might have been at the start
    const monthsBack = daysBack / 30;
    const estimatedPastPrice = currentPrice * (1 + pattern.monthlyDepreciation * monthsBack);
    
    // Use a seeded random for consistency (based on product name hash)
    let seed = 0;
    for (let i = 0; i < productName.length; i++) {
        seed = ((seed << 5) - seed) + productName.charCodeAt(i);
        seed = seed & seed;
    }
    const seededRandom = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return (seed / 0x7fffffff);
    };
    
    for (let i = daysBack; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Calculate base price (linear depreciation from past to current)
        const progress = (daysBack - i) / daysBack;
        let basePrice = estimatedPastPrice - (estimatedPastPrice - currentPrice) * progress;
        
        // Apply sale discounts
        const { discount, event } = getSaleDiscount(date);
        if (discount > 0) {
            basePrice = basePrice * (1 - discount);
        }
        
        // Add small random volatility (but keep it realistic)
        const volatilityFactor = 1 + (seededRandom() - 0.5) * pattern.volatility;
        let finalPrice = Math.round(basePrice * volatilityFactor);
        
        // Ensure price doesn't go below current price by too much
        // (current price is our anchor)
        finalPrice = Math.max(finalPrice, Math.round(currentPrice * 0.85));
        
        // Ensure price doesn't go above launch premium
        finalPrice = Math.min(finalPrice, Math.round(currentPrice * (1 + pattern.launchPremium)));
        
        // For the last day, use exact current price
        if (i === 0) {
            finalPrice = currentPrice;
        }
        
        history.push({
            date: date.toISOString().split('T')[0],
            price: finalPrice,
            source: "Estimated (Market Trends)"
        });
    }
    
    // Deduplicate consecutive same prices to make graph less noisy
    // but keep at least daily points for major dates
    const filtered: EstimatedPricePoint[] = [];
    let lastPrice = -1;
    
    for (let i = 0; i < history.length; i++) {
        const point = history[i];
        const date = new Date(point.date);
        const isMajorDate = getSaleDiscount(date).event !== null;
        
        // Always include: first, last, major sale dates, or price changes
        if (i === 0 || i === history.length - 1 || isMajorDate || point.price !== lastPrice) {
            filtered.push(point);
            lastPrice = point.price;
        }
    }
    
    return filtered;
}

/**
 * Calculate statistics from estimated history
 */
export function calculateEstimatedStats(history: EstimatedPricePoint[]) {
    const prices = history.map(h => h.price);
    return {
        lowest: Math.min(...prices),
        highest: Math.max(...prices),
        average: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    };
}
