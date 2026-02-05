"use server";

import { callAI } from './ai-utils';
import { generateEstimatedHistory, calculateEstimatedStats } from './price-estimator';

// Advanced Price Analysis and Prediction Service
// Uses Python ML Backend (Prophet) if available, with Generative AI fallback

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

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
    predictionSource?: 'Python/Prophet' | 'Generative AI' | 'None';
}

// function generatePriceHistory removed to enforce real data only

// Check if history is meaningful (not just flat tracking data)
function isMeaningfulHistory(history: PriceHistoryPoint[]): boolean {
    if (!history || history.length < 5) return false;
    
    const prices = history.map(h => h.price);
    const dates = history.map(h => new Date(h.date).getTime());
    
    // Check 1: Date range must span at least 7 days
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const daySpan = (maxDate - minDate) / (1000 * 60 * 60 * 24);
    if (daySpan < 7) {
        console.log(`[History Check] Rejected: Only ${daySpan.toFixed(1)} days of data (need 7+)`);
        return false;
    }
    
    // Check 2: Price must have some variation (at least 1% difference between min and max)
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceVariation = (maxPrice - minPrice) / minPrice;
    if (priceVariation < 0.01) {
        console.log(`[History Check] Rejected: Price variation only ${(priceVariation * 100).toFixed(2)}% (need 1%+)`);
        return false;
    }
    
    console.log(`[History Check] Valid: ${daySpan.toFixed(0)} days span, ${(priceVariation * 100).toFixed(1)}% variation`);
    return true;
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

// function interpolateHistory removed to enforce real data only

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
Task 2: Predict future prices for the next 30 days.
Task 3: Analyze trends and recommend.

CRITICAL: In the 'summary', provide a detailed explanation.
 स्पेशially regarding price changes:
- IF PRICE LOWERED/DROPPED: You MUST explain WHY (e.g. "Price lowered due to the S25 release", "Market correction", "Seasonal clearance").
- IF STABLE: Explain why it hasn't changed.
- IF RISING: Explain the demand/shortage.
Do not just say "it decided to drop". Give the market reason.

Return ONLY valid JSON:
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

// DB Integration
import { trackProductPrice, getProductHistory } from './db-tracker';

// Clean product name for better scraper matching
function cleanProductName(rawName: string): string {
    let cleaned = rawName;

    // 1. Cut at typical junk patterns (ratings, reviews, ROM, RAM stats)
    const junkPatterns = [
        /\d+[.,]\d{2}[.,]\d+\s*Ratings.*/i,   // "4.62,95,119 Ratings..."
        /\d+\s*Ratings.*/i,                    // "95125 Ratings..."
        /\d+\s*Reviews.*/i,                    // "14000 Reviews..."
        /ROM\d+\s?GB.*/i,                      // "ROM128 GB..."
        /\d+\s?GB\s*ROM.*/i,                   // "128 GB ROM..."
        /\d+\s?inch\s*Super.*/i,               // "6.1 inch Super Retina..."
        /Display\d+MP.*/i,                     // "Display12MP..."
        /Bionic\s*Chip.*/i,                    // "Bionic Chip Processor..."
        /\d+\s*year\s*warranty.*/i,            // "1 year warranty..."
    ];

    for (const pattern of junkPatterns) {
        cleaned = cleaned.replace(pattern, '');
    }

    // 2. Cut at first set of parentheses if it contains variant info (keep short ones like "(Red)" but cut "(Starlight, 128 GB)")
    const parenMatch = cleaned.match(/^([^(]+)\(([^)]+)\)/);
    if (parenMatch) {
        const beforeParen = parenMatch[1].trim();
        const insideParen = parenMatch[2].trim();
        // If inside is short and looks like a color, keep it; otherwise cut
        if (insideParen.length > 20 || /\d+\s*GB/i.test(insideParen)) {
            cleaned = beforeParen;
        }
    }

    // 3. Limit to first ~50 chars (most model names are short)
    cleaned = cleaned.trim().substring(0, 60);

    // 4. Trim trailing junk punctuation
    cleaned = cleaned.replace(/[,.\-|:]+$/, '').trim();

    console.log(`[cleanProductName] "${rawName.substring(0, 50)}..." -> "${cleaned}"`);
    return cleaned;
}

// Python ML Backend Integration
async function getMLPrediction(productName: string, currentPrice: number, productUrl: string) {
    // Clean the product name before sending to Python
    const cleanedName = cleanProductName(productName);

    try {
        const response = await fetch('http://localhost:8000/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                product_name: cleanedName,  // Use cleaned name!
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

        if (mlResult.history_unavailable) {
            console.log("[Price Analysis] ML Model reported NO HISTORY available.");
            // Return empty analysis
            return {
                productName,
                currentPrice: priceNum,
                lowestPrice: priceNum,
                highestPrice: priceNum,
                averagePrice: priceNum,
                priceHistory: [], // EMPTY
                futurePredictions: [],
                prediction: {
                    expectedDrop: false,
                    dropPercentage: 0,
                    bestTimeToBuy: "Unknown",
                    predictedLowestPrice: priceNum,
                    predictedHighestPrice: priceNum,
                    confidence: 0,
                    recommendation: "SET ALERT",
                    reasoning: "No historical data found. Tracking started."
                },
                pastAnalysis: {
                    trend: 'stable',
                    volatility: 'low',
                    seasonalPattern: "Unknown",
                    priceDropEvents: []
                },
                summary: "We couldn't find any past price history for this product. We have started tracking it today.",
                alerts: {
                    isAtLow: false,
                    isAtHigh: false,
                    priceDropSoon: false,
                    upcomingSale: null
                },
                predictionSource: 'None'
            };
        }

        // Transform ML result to our UI format
        const futurePredictions = (mlResult.forecast || []).map((f: any) => ({
            date: f.date,
            predictedPrice: f.predicted_price,
            confidence: 85, // ML model confidence
            event: null
        }));

        // DECIDE HISTORY SOURCE: ML Scraped History > Local DB > Empty
        let history: PriceHistoryPoint[] = [];

        // PRIORITY 1: Use history from ML response (scraped from external sources)
        if (mlResult.history && mlResult.history.length > 0) {
            console.log(`[Analysis] Using ${mlResult.history.length} points from ML Scraper!`);
            history = mlResult.history.map((h: any) => ({
                date: h.date,
                price: h.price,
                source: mlResult.data_source || "External Scraper"
            }));
        }
        // PRIORITY 2: Use local DB history
        else if (realHistoryPoints.length > 0) {
            console.log(`[Analysis] Using ${realHistoryPoints.length} points from Local DB`);
            history = realHistoryPoints;
        }
        // PRIORITY 3: Empty (will show "No Data" message)

        // CRITICAL: Check if history is meaningful (not just flat tracking data)
        // Reject history that is just repeated same-price entries over 1-2 days
        if (history.length > 0 && !isMeaningfulHistory(history)) {
            console.log(`[Analysis] History rejected as not meaningful (flat/short-term tracking data)`);
            history = []; // Clear it so UI shows "No verified price history found"
        }

        // Only calculate meaningful stats if we have valid history
        let hasValidHistory = history.length > 0;
        
        // If no valid history from scrapers, generate estimated history
        if (!hasValidHistory) {
            console.log(`[Analysis] No valid scraped history, generating estimates for: ${productName}`);
            const estimatedHistory = generateEstimatedHistory(productName, priceNum, 60);
            history = estimatedHistory.map(h => ({
                date: h.date,
                price: h.price,
                source: h.source
            }));
            hasValidHistory = true; // We now have estimated data
        }
        
        const stats = analyzePastPrices(history).stats;
        const { trend, volatility } = analyzePastPrices(history);
        
        // Check if source is estimated
        const isEstimated = history.length > 0 && history[0].source.includes('Estimated');

        return {
            productName,
            currentPrice: priceNum,
            lowestPrice: stats.lowest,
            highestPrice: stats.highest,
            averagePrice: stats.average,
            priceHistory: history,
            futurePredictions: futurePredictions,
            prediction: {
                expectedDrop: mlResult.trend === "Dropping",
                dropPercentage: mlResult.trend === "Dropping" ? 5 : 0,
                bestTimeToBuy: mlResult.recommendation || (priceNum <= stats.lowest * 1.05 ? "Now" : "Wait"),
                predictedLowestPrice: futurePredictions.length ? Math.min(...futurePredictions.map((p: any) => p.predictedPrice)) : Math.round(priceNum * 0.92),
                predictedHighestPrice: futurePredictions.length ? Math.max(...futurePredictions.map((p: any) => p.predictedPrice)) : Math.round(priceNum * 1.05),
                confidence: isEstimated ? 65 : 85,
                recommendation: priceNum <= stats.lowest * 1.05 ? "BUY NOW" : (mlResult.trend === "Dropping" ? "WAIT" : "BUY NOW"),
                reasoning: isEstimated 
                    ? `Based on market trends for ${productName.split('(')[0].trim()}. Current price is ${priceNum <= stats.lowest * 1.05 ? 'near the low' : 'average'}.`
                    : `ML Model detection: Price trend is ${mlResult.trend}.`
            },
            pastAnalysis: {
                trend: trend,
                volatility: volatility,
                seasonalPattern: isEstimated ? "Based on market patterns" : "Analyzed via Prophet",
                priceDropEvents: isEstimated ? ["Diwali Sale", "Republic Day Sale"] : []
            },
            summary: isEstimated 
                ? `Estimated analysis based on typical ${productName.split(' ')[0]} pricing patterns. Current price ₹${priceNum.toLocaleString()} appears ${priceNum <= stats.average ? 'below average' : 'above average'}.`
                : `ML Analysis: The price is currently ${mlResult.trend?.toLowerCase() || 'stable'}. We recommend: ${mlResult.recommendation}.`,
            alerts: {
                isAtLow: priceNum <= stats.lowest * 1.05,
                isAtHigh: priceNum >= stats.highest * 0.95,
                priceDropSoon: mlResult.trend === "Dropping",
                upcomingSale: new Date().getMonth() === 0 ? "Republic Day Sale" : null
            },
            predictionSource: isEstimated ? 'Generative AI' : 'Python/Prophet'
        };
    }


    // 3. Fallback: Use ESTIMATED price history based on market patterns
    // This provides a realistic estimate when external scrapers can't find data

    const today = new Date();
    let upcomingSale: string | null = null;
    if (today.getMonth() === 0) upcomingSale = "Republic Day Sale";
    if (today.getMonth() === 9 || today.getMonth() === 10) upcomingSale = "Festive Season Sale";

    // Generate estimated history based on product category and market patterns
    console.log(`[Analysis] Generating estimated history for: ${productName}`);
    const estimatedHistory = generateEstimatedHistory(productName, priceNum, 60);
    const estimatedStats = calculateEstimatedStats(estimatedHistory);
    
    // Convert to our format
    const historyPoints: PriceHistoryPoint[] = estimatedHistory.map(h => ({
        date: h.date,
        price: h.price,
        source: h.source
    }));

    // Analyze the estimated data
    const { trend, volatility } = analyzePastPrices(historyPoints);
    
    // Determine if current price is at a good level
    const isNearLow = priceNum <= estimatedStats.lowest * 1.05;
    const isNearHigh = priceNum >= estimatedStats.highest * 0.95;

    return {
        productName,
        currentPrice: priceNum,
        lowestPrice: estimatedStats.lowest,
        highestPrice: estimatedStats.highest,
        averagePrice: estimatedStats.average,
        priceHistory: historyPoints,
        futurePredictions: [],
        prediction: {
            expectedDrop: !isNearLow && upcomingSale !== null,
            dropPercentage: upcomingSale ? 10 : 0,
            bestTimeToBuy: isNearLow ? "Now" : (upcomingSale || "Wait for sale"),
            predictedLowestPrice: Math.round(priceNum * 0.90),
            predictedHighestPrice: Math.round(priceNum * 1.05),
            confidence: 65,
            recommendation: isNearLow ? "BUY NOW" : "WAIT",
            reasoning: isNearLow 
                ? "Current price is near the estimated historical low. Good time to buy!"
                : `Based on market patterns, prices typically drop during sales. ${upcomingSale ? `${upcomingSale} coming soon.` : 'Wait for the next sale event.'}`
        },
        pastAnalysis: {
            trend,
            volatility,
            seasonalPattern: "Based on typical market patterns",
            priceDropEvents: ["Diwali Sale", "Republic Day Sale", "Prime Day"]
        },
        summary: `Estimated price analysis based on market trends for ${productName.split('(')[0].trim()}. Current price ₹${priceNum.toLocaleString()} is ${isNearLow ? 'near the low' : isNearHigh ? 'near the high' : 'average'} compared to typical pricing.`,
        alerts: {
            isAtLow: isNearLow,
            isAtHigh: isNearHigh,
            priceDropSoon: upcomingSale !== null,
            upcomingSale
        },
        predictionSource: 'Generative AI'
    };
}
