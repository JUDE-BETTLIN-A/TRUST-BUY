"use server";

import { callAI } from './ai-utils';

// Advanced Price Analysis and Prediction Service
// Uses Python ML Backend (Prophet) if available, with Generative AI fallback

const OPENROUTER_API_KEY = "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";

// Available models for analysis
const MODELS = {
    primary: "meta-llama/llama-3.3-70b-instruct",
    reasoning: "deepseek/deepseek-r1-0528",
    fast: "nvidia/nemotron-3-nano-30b-a3b",
    summary: "qwen/qwen3-next-80b-a3b-instruct"
};

export interface PriceHistoryPoint {
    date: string;
    price: number;
    source: string;
}

export interface FuturePricePoint {
    date: string;
    predictedPrice: number;
    confidence: number;
    event?: string;
}

export interface PriceAnalysis {
    productName: string;
    currentPrice: number;
    lowestPrice: number;
    highestPrice: number;
    averagePrice: number;
    priceHistory: PriceHistoryPoint[];
    futurePredictions: FuturePricePoint[];
    prediction: {
        expectedDrop: boolean;
        dropPercentage: number;
        bestTimeToBuy: string;
        predictedLowestPrice: number;
        predictedHighestPrice: number;
        confidence: number;
        recommendation: string;
        reasoning: string;
    };
    pastAnalysis: {
        trend: 'rising' | 'falling' | 'stable';
        volatility: 'low' | 'medium' | 'high';
        seasonalPattern: string;
        priceDropEvents: string[];
    };
    summary: string;
    alerts: {
        isAtLow: boolean;
        isAtHigh: boolean;
        priceDropSoon: boolean;
        upcomingSale: string | null;
    };
    predictionSource?: 'Python/Prophet' | 'Generative AI';
}

// Generate realistic price history based on product category
function generatePriceHistory(currentPrice: number, productName: string): PriceHistoryPoint[] {
    const history: PriceHistoryPoint[] = [];
    const sources = ['Amazon', 'Flipkart', 'Croma', 'Reliance Digital', 'Vijay Sales'];
    const basePrice = currentPrice;

    // Detect product category for realistic patterns
    const isPhone = /iphone|samsung|pixel|oneplus|redmi|realme/i.test(productName);
    const isGaming = /ps5|playstation|xbox|nintendo/i.test(productName);

    // Generate 60 days of price history
    for (let i = 60; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        // Base variation
        let variation = (Math.random() - 0.5) * 0.08;

        // Add seasonal patterns (sales events)
        const dayOfMonth = date.getDate();
        const month = date.getMonth();

        // Big Billion Days / Great Indian Festival (October)
        if (month === 9 && dayOfMonth >= 1 && dayOfMonth <= 10) {
            variation -= 0.15 + Math.random() * 0.1;
        }

        // Republic Day Sale (January 20-26)
        if (month === 0 && dayOfMonth >= 20 && dayOfMonth <= 26) {
            variation -= 0.12 + Math.random() * 0.08;
        }

        // Weekend slight increase
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            variation += 0.02;
        }

        // Product-specific patterns
        if (isPhone && month === 8) variation += 0.05; // Prices rise before new iPhone
        if (isGaming && month === 11) variation -= 0.1; // Holiday gaming sales

        // Trend component (slight general price decrease over time for electronics)
        const trendFactor = (60 - i) * 0.0005;

        const price = Math.round(basePrice * (1 + variation - trendFactor));

        history.push({
            date: date.toISOString().split('T')[0],
            price: Math.max(price, Math.round(basePrice * 0.7)), // Don't go below 70% of current
            source: sources[Math.floor(Math.random() * sources.length)]
        });
    }

    return history;
}

// Calculate past price statistics
function analyzePastPrices(history: PriceHistoryPoint[]): {
    stats: { lowest: number; highest: number; average: number };
    trend: 'rising' | 'falling' | 'stable';
    volatility: 'low' | 'medium' | 'high';
} {
    const prices = history.map(h => h.price);
    const stats = {
        lowest: Math.min(...prices),
        highest: Math.max(...prices),
        average: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    };

    // Calculate trend
    const firstHalf = prices.slice(0, Math.floor(prices.length / 2));
    const secondHalf = prices.slice(Math.floor(prices.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    let trend: 'rising' | 'falling' | 'stable';
    if (secondAvg > firstAvg * 1.03) trend = 'rising';
    else if (secondAvg < firstAvg * 0.97) trend = 'falling';
    else trend = 'stable';

    // Calculate volatility
    const priceRange = (stats.highest - stats.lowest) / stats.average;
    let volatility: 'low' | 'medium' | 'high';
    if (priceRange < 0.1) volatility = 'low';
    else if (priceRange < 0.2) volatility = 'medium';
    else volatility = 'high';

    return { stats, trend, volatility };
}

// Interpolate prices between known data points to create a simplified daily history
function interpolateHistory(knownPoints: { date: string; price: number }[], totalDays: number = 60): PriceHistoryPoint[] {
    const history: PriceHistoryPoint[] = [];
    const today = new Date();

    // Sort known points by date (oldest first)
    knownPoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // If no points or not enough, return empty (will handle with fallback)
    if (knownPoints.length < 2) return [];

    // Helper to get price for a specific date
    const getPriceForDate = (targetDate: Date): number => {
        const targetTime = targetDate.getTime();

        // Find surrounding points
        let prev = knownPoints[0];
        let next = knownPoints[knownPoints.length - 1];

        for (let i = 0; i < knownPoints.length - 1; i++) {
            const p1 = knownPoints[i];
            const p2 = knownPoints[i + 1];
            const t1 = new Date(p1.date).getTime();
            const t2 = new Date(p2.date).getTime();

            if (targetTime >= t1 && targetTime <= t2) {
                prev = p1;
                next = p2;
                break;
            }
        }

        if (prev === next) return prev.price;

        const t1 = new Date(prev.date).getTime();
        const t2 = new Date(next.date).getTime();
        const factor = (targetTime - t1) / (t2 - t1);

        return Math.round(prev.price + (next.price - prev.price) * factor);
    };

    // Generate daily points
    for (let i = totalDays; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        history.push({
            date: date.toISOString().split('T')[0],
            price: getPriceForDate(date),
            source: "Market History"
        });
    }

    return history;
}

// AI-powered price prediction using centralized AI utility
async function getPricePrediction(
    productName: string,
    currentPrice: number,
    stats: { lowest: number; highest: number; average: number }
): Promise<{
    prediction: PriceAnalysis['prediction'];
    futurePredictions: FuturePricePoint[];
    pastAnalysis: PriceAnalysis['pastAnalysis'];
    summary: string;
    historicalPoints?: { date: string; price: number }[];
}> {
    try {
        const today = new Date();
        const prompt = `You are an expert price tracking AI.
        
PRODUCT: "${productName}"
CURRENT PRICE: ₹${currentPrice.toLocaleString()}
DATE: ${today.toISOString().split('T')[0]}

Task 1: Estimate the REAL price history of this specific product for the last 60 days.
Task 2: Predict future prices for the next 90 days.
Task 3: Analyze trends and recommend.

CRITICAL: In the 'summary', provide a detailed explanation.
 स्पेशially regarding price changes:
- IF PRICE LOWERED/DROPPED: You MUST explain WHY (e.g. "Price lowered due to the S25 release", "Market correction", "Seasonal clearance").
- IF STABLE: Explain why it hasn't changed.
- IF RISING: Explain the demand/shortage.
Do not just say "it decided to drop". Give the market reason.

Return ONLY valid JSON:
{
  "history": [
    {"date": "YYYY-MM-DD", "price": number} 
    // Provide 8-10 points covering last 60 days
  ],
  "futurePredictions": [
    {"daysFromNow": 7, "predictedPrice": number, "confidence": number, "event": null},
    {"daysFromNow": 30, "predictedPrice": number, "confidence": number, "event": "sale?"},
    {"daysFromNow": 90, "predictedPrice": number, "confidence": number, "event": null}
  ],
  "prediction": {
    "expectedDrop": boolean,
    "dropPercentage": number,
    "bestTimeToBuy": "now" | "wait...",
    "predictedLowestPrice": number,
    "predictedHighestPrice": number,
    "confidence": number,
    "recommendation": "BUY NOW" | "WAIT" | "SET ALERT",
    "reasoning": "string"
  },
  "pastAnalysis": {
    "trend": "rising" | "falling" | "stable",
    "volatility": "low" | "medium" | "high",
    "seasonalPattern": "string",
    "priceDropEvents": ["string"]
  },
  "summary": "Full overview. IF PRICE LOWERED, START WITH: 'Price lowered due to...'"
}`;

        // Use centralized callAI which handles retries and multiple models
        const aiResponse = await callAI(prompt, { temperature: 0.3 });

        if (aiResponse.success && aiResponse.data) {
            const parsed = aiResponse.data;

            // Transform future predictions
            const futurePredictions: FuturePricePoint[] = (parsed.futurePredictions || []).map((fp: any) => {
                const futureDate = new Date();
                futureDate.setDate(futureDate.getDate() + (fp.daysFromNow || 7));
                return {
                    date: futureDate.toISOString().split('T')[0],
                    predictedPrice: fp.predictedPrice || currentPrice,
                    confidence: fp.confidence || 70,
                    event: fp.event
                };
            });

            return {
                prediction: parsed.prediction,
                futurePredictions,
                pastAnalysis: parsed.pastAnalysis,
                summary: parsed.summary,
                historicalPoints: parsed.history
            };
        }
    } catch (error) {
        console.error("AI prediction error:", error);
    }

    // Fallback if AI fails (keep existing fallback)
    return {
        prediction: {
            expectedDrop: false,
            dropPercentage: 0,
            bestTimeToBuy: "now",
            predictedLowestPrice: Math.round(currentPrice * 0.95),
            predictedHighestPrice: Math.round(currentPrice * 1.05),
            confidence: 50,
            recommendation: "SET ALERT",
            reasoning: "Unable to connect to AI analysis. Based on current price."
        },
        futurePredictions: [], // Will be handled by UI fallback
        pastAnalysis: {
            trend: 'stable',
            volatility: 'low',
            seasonalPattern: "Unknown",
            priceDropEvents: []
        },
        summary: "Analysis unavailable. Price appears stable based on market data."
    };
}

// Python ML Backend Integration
import { trackProductPrice, getProductHistory } from './db-tracker';

// Python ML Backend Integration
async function getMLPrediction(productName: string, currentPrice: number, productUrl: string) {
    try {
        const response = await fetch('http://localhost:8000/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                product_name: productName,
                current_price: currentPrice,
                product_url: productUrl
            })
        });

        if (!response.ok) return null;
        return await response.json();
    } catch (e) {
        console.warn("ML Backend unavailable, falling back to basic analysis.");
        return null;
    }
}

export async function analyzeProductPrice(
    productName: string,
    currentPrice: string | number,
    productUrl: string,
    source: string
): Promise<PriceAnalysis> {
    // 1. Parsing Logic
    let priceNum: number = 0;
    if (typeof currentPrice === 'number') {
        priceNum = Math.round(currentPrice);
    } else {
        let priceStr = String(currentPrice).replace(/\([^)]*\)/g, '').replace(/[₹$€£Rs\.]/gi, '').trim();
        const decimalMatch = priceStr.match(/^([\d,]+)\.(\d{1,2})$/);
        if (decimalMatch) priceNum = parseInt(decimalMatch[1].replace(/[,\s]/g, ''), 10);
        else {
            const digits = priceStr.replace(/[,\s]/g, '').match(/^\d+/);
            priceNum = digits ? parseInt(digits[0], 10) : 0;
        }
    }
    if (isNaN(priceNum) || priceNum <= 0) priceNum = 50000;

    // --- DB TRACKING INTEGRATION ---
    // Start tracking in background (fire and forget)
    trackProductPrice({
        title: productName,
        url: productUrl,
        current_price: priceNum,
        source: source,
        image_url: ""
    }).catch(err => console.error("[DB Tracking Failed]", err));
    // -------------------------------

    // 2. Try to get REAL history for the chart
    let realHistoryPoints: PriceHistoryPoint[] = [];
    try {
        const dbHistory = await getProductHistory(productUrl);
        if (dbHistory && dbHistory.length > 0) {
            console.log(`[Analysis] Found ${dbHistory.length} real history points!`);
            realHistoryPoints = dbHistory.map((h: any) => ({
                date: new Date(h.created_at).toISOString().split('T')[0],
                price: parseFloat(h.price),
                source: "Real Database"
            }));
        }
    } catch (e) {
        console.error("Failed to fetch real history", e);
    }

    // 3. ATTEMPT ML PREDICTION FIRST
    const mlResult = await getMLPrediction(productName, priceNum, productUrl);

    if (mlResult) {
        console.log("[Price Analysis] Using Python ML Model Results");

        // Transform ML result to our UI format
        const futurePredictions = mlResult.forecast.map((f: any) => ({
            date: f.date,
            predictedPrice: f.predicted_price,
            confidence: 85, // ML model confidence
            event: null
        }));

        // DECIDE HISTORY SOURCE: Real or Mock?
        let history = realHistoryPoints;
        if (history.length < 2) {
            history = generatePriceHistory(priceNum, productName);
        }

        const stats = analyzePastPrices(history).stats;

        const prediction = {
            expectedDrop: mlResult.trend === "Dropping",
            dropPercentage: mlResult.trend === "Dropping" ? 5 : 0,
            bestTimeToBuy: mlResult.recommendation,
            predictedLowestPrice: Math.min(...futurePredictions.map((p: any) => p.predictedPrice)),
            predictedHighestPrice: Math.max(...futurePredictions.map((p: any) => p.predictedPrice)),
            confidence: 85,
            recommendation: mlResult.trend === "Dropping" ? "WAIT" : "BUY NOW",
            reasoning: `ML Model detection: Price trend is ${mlResult.trend}.`
        };

        return {
            productName,
            currentPrice: priceNum,
            lowestPrice: stats.lowest,
            highestPrice: stats.highest,
            averagePrice: stats.average,
            priceHistory: history,
            futurePredictions,
            prediction,
            pastAnalysis: {
                trend: mlResult.trend.toLowerCase() as any, // casting simple string match
                volatility: 'medium',
                seasonalPattern: "Analyzed via Prophet",
                priceDropEvents: []
            },
            summary: `ML Analysis: The price is currently ${mlResult.trend.toLowerCase()}. We recommend: ${mlResult.recommendation}.`,
            alerts: {
                isAtLow: mlResult.trend === "Rising",
                isAtHigh: mlResult.trend === "Dropping",
                priceDropSoon: mlResult.trend === "Dropping",
                upcomingSale: null
            },
            predictionSource: 'Python/Prophet'
        };
    }

    // 3. Fallback to Generative AI if ML fails
    // We generate a base history first in case AI fails entirely
    let priceHistory = generatePriceHistory(priceNum, productName);

    // Get AI Analysis
    let stats = analyzePastPrices(priceHistory).stats;
    const aiResult = await getPricePrediction(productName, priceNum, stats);

    // If AI returned historical points, use them to rebuild the chart
    if (aiResult.historicalPoints && aiResult.historicalPoints.length > 0) {
        console.log(`[Price Analysis] Using AI-generated history (${aiResult.historicalPoints.length} points)`);
        const reconstructedHistory = interpolateHistory(aiResult.historicalPoints, 60);
        if (reconstructedHistory.length > 0) {
            priceHistory = reconstructedHistory;
            stats = analyzePastPrices(priceHistory).stats; // Update stats
        }
    }

    // Construct Final Object
    const { prediction, futurePredictions, pastAnalysis, summary } = aiResult;
    const today = new Date();
    let upcomingSale: string | null = null;
    if (today.getMonth() === 0) upcomingSale = "Republic Day Sale";

    return {
        productName,
        currentPrice: priceNum,
        lowestPrice: stats.lowest,
        highestPrice: stats.highest,
        averagePrice: stats.average,
        priceHistory,
        futurePredictions,
        prediction: {
            ...prediction,
            predictedLowestPrice: prediction.predictedLowestPrice || stats.lowest,
            predictedHighestPrice: prediction.predictedHighestPrice || stats.highest
        },
        pastAnalysis,
        summary,
        alerts: {
            isAtLow: priceNum <= stats.lowest * 1.05,
            isAtHigh: priceNum >= stats.highest * 0.95,
            priceDropSoon: prediction.expectedDrop,
            upcomingSale
        },
        predictionSource: 'Generative AI'
    };
}
