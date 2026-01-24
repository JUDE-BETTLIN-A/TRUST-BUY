/**
 * AI Utility Module
 * 
 * Centralized OpenRouter API integration for the TrustBuy application.
 * Provides AI-powered features across the platform using LLM fallback chain.
 */

// --- Configuration ---
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "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";
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// MODEL FALLBACK ORDER (From user requirements)
const MODELS = [
    "openai/gpt-4o",                        // 1. OpenAI: gpt-oss-120b proxy
    "meta-llama/llama-3.3-70b-instruct",    // 2. Meta: Llama 3.3 70B
    "qwen/qwen-2.5-72b-instruct",           // 3. Qwen: Qwen3 80B proxy
    "deepseek/deepseek-r1",                 // 5. DeepSeek: R1 0528
    "google/gemma-2-27b-it",                // 7. Google: Gemma 3 27B proxy
    "qwen/qwen-2.5-7b-instruct",            // 9. Qwen: Qwen3 4B proxy
];

// --- Core AI Request Function ---

interface AIResponse {
    success: boolean;
    data: any;
    model?: string;
    error?: string;
}

export async function callAI(
    prompt: string,
    options: {
        jsonMode?: boolean;
        temperature?: number;
        maxRetries?: number;
    } = {}
): Promise<AIResponse> {
    const { jsonMode = true, temperature = 0.1, maxRetries = MODELS.length } = options;

    for (let i = 0; i < maxRetries; i++) {
        const model = MODELS[i];

        try {
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
                    response_format: jsonMode ? { type: "json_object" } : undefined,
                    temperature: temperature,
                }),
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const json = await response.json();
            const content = json.choices[0].message.content;

            if (jsonMode) {
                const parsed = JSON.parse(content);
                return { success: true, data: parsed, model };
            }

            return { success: true, data: content, model };

        } catch (error) {
            console.warn(`[AI] Model ${model} failed:`, (error as any).message);
            if (i === maxRetries - 1) {
                return { success: false, data: null, error: (error as any).message };
            }
        }
    }

    return { success: false, data: null, error: "All models failed" };
}

// ============================================================================
// AI-POWERED FEATURE: Extract Product Specifications
// ============================================================================

export interface AIProductSpecs {
    ram?: string;
    storage?: string;
    display?: string;
    camera?: string;
    processor?: string;
    battery?: string;
    os?: string;
    connectivity?: string;
    weight?: string;
    dimensions?: string;
}

export async function extractSpecsWithAI(productTitle: string, rawContent?: string): Promise<AIProductSpecs> {
    const prompt = `
  Extract technical specifications from this product information.
  
  Product Title: ${productTitle}
  ${rawContent ? `Additional Content: ${rawContent.substring(0, 3000)}` : ''}
  
  RULES:
  1. Extract ONLY specifications that are explicitly mentioned or strongly implied
  2. Use standard units (GB, mAh, inches, MP, Hz)
  3. Return empty string for unknown specs, don't guess
  
  Return JSON:
  {
    "ram": "8 GB" or "",
    "storage": "256 GB" or "",
    "display": "6.7 inch AMOLED 120Hz" or "",
    "camera": "50 MP Main" or "",
    "processor": "Snapdragon 8 Gen 3" or "",
    "battery": "5000 mAh" or "",
    "os": "Android 14" or "",
    "connectivity": "5G, WiFi 6E" or "",
    "weight": "200g" or "",
    "dimensions": "" or ""
  }`;

    const result = await callAI(prompt, { temperature: 0.05 });

    if (result.success && result.data) {
        return result.data;
    }

    // Fallback to regex extraction
    return extractSpecsRegex(productTitle);
}

function extractSpecsRegex(title: string): AIProductSpecs {
    const t = title.toLowerCase();
    const specs: AIProductSpecs = {};

    const ramMatch = t.match(/(\d+)\s?gb\s?ram/i);
    if (ramMatch) specs.ram = `${ramMatch[1]} GB`;

    const storageMatch = t.match(/(\d+)\s?(gb|tb)\s?(storage|rom|ssd)?/i);
    if (storageMatch && Number(storageMatch[1]) >= 64) {
        specs.storage = `${storageMatch[1]} ${storageMatch[2].toUpperCase()}`;
    }

    const batteryMatch = t.match(/(\d{3,5})\s?mah/i);
    if (batteryMatch) specs.battery = `${batteryMatch[1]} mAh`;

    const cameraMatch = t.match(/(\d{2,3})\s?mp/i);
    if (cameraMatch) specs.camera = `${cameraMatch[1]} MP`;

    if (t.includes('5g')) specs.connectivity = '5G';

    return specs;
}

// ============================================================================
// AI-POWERED FEATURE: Price Analysis & Buy Recommendation
// ============================================================================

export interface BuyRecommendation {
    recommendation: 'Buy Now' | 'Wait' | 'Fair Price';
    confidence: 'High' | 'Medium' | 'Low';
    reason: string;
    priceVerdict: string;
    predictedTrend: 'Up' | 'Down' | 'Stable';
    tips: string[];
}

export async function getPriceRecommendation(
    productTitle: string,
    currentPrice: number,
    priceHistory?: { date: string; price: number }[],
    competitorPrices?: { store: string; price: number }[]
): Promise<BuyRecommendation> {

    const historyText = priceHistory
        ? priceHistory.map(p => `${p.date}: ₹${p.price}`).join(', ')
        : 'No history available';

    const competitorText = competitorPrices
        ? competitorPrices.map(c => `${c.store}: ₹${c.price}`).join(', ')
        : 'No competitor data';

    const prompt = `
  Analyze this product pricing and give a buying recommendation.
  
  Product: ${productTitle}
  Current Price: ₹${currentPrice}
  Price History (6 months): ${historyText}
  Competitor Prices: ${competitorText}
  
  Consider:
  1. Is current price near historical low?
  2. Price trend (going up/down/stable)?
  3. Upcoming sale seasons in India (Diwali, Republic Day, etc.)
  4. Typical price patterns for this product category
  
  Return JSON:
  {
    "recommendation": "Buy Now" | "Wait" | "Fair Price",
    "confidence": "High" | "Medium" | "Low",
    "reason": "Brief 1-2 sentence explanation",
    "priceVerdict": "Great Deal" | "Good Price" | "Average" | "Overpriced",
    "predictedTrend": "Up" | "Down" | "Stable",
    "tips": ["tip1", "tip2"]
  }`;

    const result = await callAI(prompt, { temperature: 0.2 });

    if (result.success && result.data) {
        return result.data;
    }

    // Fallback recommendation
    const avgPrice = priceHistory
        ? priceHistory.reduce((a, b) => a + b.price, 0) / priceHistory.length
        : currentPrice;

    const isLow = currentPrice <= avgPrice * 0.9;

    return {
        recommendation: isLow ? 'Buy Now' : 'Fair Price',
        confidence: 'Low',
        reason: isLow ? 'Current price is below average.' : 'Price is around the average range.',
        priceVerdict: isLow ? 'Good Price' : 'Average',
        predictedTrend: 'Stable',
        tips: ['Compare prices across stores', 'Set a price alert for drops']
    };
}

// ============================================================================
// AI-POWERED FEATURE: Product Summary Generation
// ============================================================================

export async function generateProductSummary(
    productTitle: string,
    specs?: AIProductSpecs,
    price?: string
): Promise<string> {
    const prompt = `
  Write a concise, helpful product summary (2-3 sentences) for an e-commerce comparison site.
  
  Product: ${productTitle}
  Price: ${price || 'Unknown'}
  Specs: ${specs ? JSON.stringify(specs) : 'Unknown'}
  
  Style: Professional, informative, helpful for Indian buyers.
  Focus on: Key features, value proposition, ideal use case.
  
  Return JSON: {"summary": "Your summary here"}`;

    const result = await callAI(prompt, { temperature: 0.3 });

    if (result.success && result.data?.summary) {
        return result.data.summary;
    }

    return `${productTitle} - Available at competitive prices. Compare deals from multiple sellers to find the best offer.`;
}

// ============================================================================
// AI-POWERED FEATURE: Search Query Enhancement
// ============================================================================

export async function enhanceSearchQuery(userQuery: string): Promise<{
    enhancedQuery: string;
    suggestions: string[];
    category: string;
}> {
    const prompt = `
  Enhance this e-commerce search query for better results on Indian sites.
  
  User Query: "${userQuery}"
  
  Tasks:
  1. Fix typos/spelling
  2. Add relevant keywords for Indian e-commerce (brand names, specifications)
  3. Identify product category
  4. Suggest related searches
  
  Return JSON:
  {
    "enhancedQuery": "corrected and enhanced query",
    "suggestions": ["related search 1", "related search 2", "related search 3"],
    "category": "Electronics/Fashion/Home/etc"
  }`;

    const result = await callAI(prompt, { temperature: 0.2 });

    if (result.success && result.data) {
        return result.data;
    }

    return {
        enhancedQuery: userQuery,
        suggestions: [],
        category: 'General'
    };
}

// ============================================================================
// AI-POWERED FEATURE: Product Comparison
// ============================================================================

export interface ComparisonResult {
    winner: string;
    summary: string;
    categories: {
        name: string;
        product1Score: number;
        product2Score: number;
        verdict: string;
    }[];
    recommendation: string;
}

export async function compareProducts(
    product1: { title: string; price: string; specs?: AIProductSpecs },
    product2: { title: string; price: string; specs?: AIProductSpecs }
): Promise<ComparisonResult> {
    const prompt = `
  Compare these two products for an Indian buyer.
  
  Product 1: ${product1.title}
  Price 1: ${product1.price}
  Specs 1: ${product1.specs ? JSON.stringify(product1.specs) : 'Unknown'}
  
  Product 2: ${product2.title}
  Price 2: ${product2.price}
  Specs 2: ${product2.specs ? JSON.stringify(product2.specs) : 'Unknown'}
  
  Compare on: Performance, Value for Money, Features, Build Quality
  
  Return JSON:
  {
    "winner": "Product 1 Title or Product 2 Title",
    "summary": "1-2 sentence comparison summary",
    "categories": [
      {"name": "Performance", "product1Score": 8, "product2Score": 7, "verdict": "Product 1 wins"},
      {"name": "Value", "product1Score": 7, "product2Score": 9, "verdict": "Product 2 wins"}
    ],
    "recommendation": "Which to buy and why"
  }`;

    const result = await callAI(prompt, { temperature: 0.2 });

    if (result.success && result.data) {
        return result.data;
    }

    return {
        winner: 'Tie',
        summary: 'Unable to compare products at this time.',
        categories: [],
        recommendation: 'Compare specifications manually to make a decision.'
    };
}

// ============================================================================
// AI-POWERED FEATURE: Review Sentiment Analysis
// ============================================================================

export async function analyzeReviewSentiment(reviews: string[]): Promise<{
    overallSentiment: 'Positive' | 'Mixed' | 'Negative';
    score: number;
    pros: string[];
    cons: string[];
    summary: string;
}> {
    if (reviews.length === 0) {
        return {
            overallSentiment: 'Mixed',
            score: 5,
            pros: [],
            cons: [],
            summary: 'No reviews available for analysis.'
        };
    }

    const prompt = `
  Analyze these product reviews and extract insights.
  
  Reviews:
  ${reviews.slice(0, 10).map((r, i) => `${i + 1}. ${r}`).join('\n')}
  
  Return JSON:
  {
    "overallSentiment": "Positive" | "Mixed" | "Negative",
    "score": 1-10,
    "pros": ["pro 1", "pro 2", "pro 3"],
    "cons": ["con 1", "con 2"],
    "summary": "Brief summary of what buyers say"
  }`;

    const result = await callAI(prompt, { temperature: 0.1 });

    if (result.success && result.data) {
        return result.data;
    }

    return {
        overallSentiment: 'Mixed',
        score: 7,
        pros: ['Good product quality'],
        cons: ['Limited reviews'],
        summary: 'Review analysis unavailable.'
    };
}
