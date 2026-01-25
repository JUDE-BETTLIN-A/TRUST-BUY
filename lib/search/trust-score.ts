import { UnifiedSearchResult } from './types';

export function calculateTrustScore(item: UnifiedSearchResult): number {
    let score = 100;

    // 1. Discount realism: Too high discount is suspicious
    if ((item.discount || 0) > 70) {
        score -= 30;
    }

    // 2. Low Rating
    if (item.rating > 0 && item.rating < 3.5) {
        score -= 25;
    } else if (item.rating === 0) {
        // No rating is slightly suspicious but could just be new
        score -= 10;
    }

    // 3. Low Rating Count indicating lack of verification
    if (item.rating_count < 50) {
        score -= 15;
    }

    // 4. Source Credibility (Platform tiers)
    // Tier 1: Amazon, Flipkart (Very trusted for delivery, though listings can be spammy)
    // Tier 2: Croma, Reliance, Tata (Very trusted for authenticity)
    // Tier 3: Unknowns
    if (['Croma', 'Reliance', 'TataCliq'].includes(item.source)) {
        score += 5; // Bonus for known brand retailers
    }

    if (item.source === 'Snapdeal') {
        score -= 10;
    }

    // 5. Seller checks (Simplified)
    const trustedSellers = ['Appario', 'Cloudtail', 'RetailNet', 'Corseca', 'Bose'];
    if (item.seller && trustedSellers.some(s => item.seller?.includes(s))) {
        score += 10;
    }

    return Math.max(0, Math.min(100, score));
}
