"use server";

import axios from 'axios';
import * as cheerio from 'cheerio';
import { extractSpecsWithAI, getPriceRecommendation, BuyRecommendation } from '@/lib/ai-utils';

interface SpecCategory {
    name: string;
    keywords: string[];
    importantFields: string[];
}

const CATEGORIES: SpecCategory[] = [
    {
        name: "Smartphone",
        keywords: ["mobile", "phone", "smartphone", "android", "iphone", "galaxy", "redmi", "realme", "xiaomi", "oneplus", "pixel"],
        importantFields: ["RAM", "Storage", "Processor", "Camera", "Battery", "Display", "OS"]
    },
    {
        name: "Laptop",
        keywords: ["laptop", "notebook", "macbook", "dell", "hp", "lenovo", "asus", "acer", "msi"],
        importantFields: ["Processor", "RAM", "Storage", "Graphics", "Display", "OS", "Battery"]
    },
    {
        name: "Television",
        keywords: ["tv", "television", "led", "oled", "qled", "smart tv", "4k"],
        importantFields: ["Display Size", "Resolution", "Smart Features", "Sound Output", "Connectivity", "Refresh Rate"]
    },
    {
        name: "Game Console",
        keywords: ["ps5", "playstation", "xbox", "nintendo switch", "console", "gaming console"],
        importantFields: ["Processor", "GPU", "Storage", "Resolution", "Output", "Connectivity"]
    },
    {
        name: "Smartwatch",
        keywords: ["smartwatch", "watch", "wearable", "band"],
        importantFields: ["Display", "Battery Life", "Sensors", "Water Resistance", "Connectivity"]
    }
];

function identifyCategory(title: string): SpecCategory | null {
    const t = title.toLowerCase();
    for (const cat of CATEGORIES) {
        if (cat.keywords.some(k => t.includes(k))) {
            return cat;
        }
    }
    return null;
}

// Function removed as hidden mock data fallback was requested to be removed


export async function fetchRealSpecs(productTitle: string): Promise<{
    category: string;
    specs: string[];
    source?: string;
    message?: string;
    aiEnhanced?: boolean;
}> {
    if (!productTitle) return { category: "Unknown", specs: [], message: "No product title provided" };

    console.log(`[SpecFetcher] Fetching real specs for: ${productTitle}`);

    const category = identifyCategory(productTitle);
    const targetCategoryName = category ? category.name : "General";

    try {
        // 1. Search for a spec-rich page (91mobiles, gsmarena, etc.)
        const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(productTitle + " full specifications 91mobiles gsmarena gadgets360")}`;

        const { data: searchData } = await axios.get(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' },
            timeout: 8000
        });

        const $search = cheerio.load(searchData);
        let targetLink: string | null = null;

        // Smart Link Selection - prioritize spec sites
        $search('.b_algo h2 a').each((i, el) => {
            if (targetLink) return;
            const href = $search(el).attr('href');
            if (href && !href.includes('bing.com') && !href.includes('google.com')) {
                if (href.includes('91mobiles') || href.includes('gsmarena') || href.includes('gadgets360') || href.includes('mysmartprice')) {
                    targetLink = href;
                }
            }
        });

        if (!targetLink) {
            targetLink = $search('.b_algo h2 a').first().attr('href') || null;
        }

        if (!targetLink) {
            console.log("[SpecFetcher] No link found, using AI extraction...");

            // 🤖 AI ENHANCEMENT: Use LLM to extract specs from title
            const aiSpecs = await extractSpecsWithAI(productTitle);
            const aiSpecsList = Object.entries(aiSpecs)
                .filter(([_, v]) => v)
                .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`);

            if (aiSpecsList.length > 0) {
                return {
                    category: targetCategoryName,
                    specs: aiSpecsList,
                    message: "Specs extracted using AI",
                    aiEnhanced: true
                };
            }

            return {
                category: targetCategoryName,
                specs: [],
                message: "Specs not available"
            };
        }

        console.log(`[SpecFetcher] Found source: ${targetLink}`);

        // 2. Fetch the Detail Page
        const { data: pageData } = await axios.get(targetLink, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' },
            timeout: 8000
        });

        const $ = cheerio.load(pageData);
        const extractedSpecs: string[] = [];

        // STRATEGY A: Generic Table Extraction
        $('table tr').each((i, tr) => {
            const tds = $(tr).find('td');
            if (tds.length >= 2) {
                const label = $(tds[0]).text().trim();
                const value = $(tds[1]).text().trim();
                if (label.length > 2 && label.length < 30 && value.length > 1 && value.length < 100) {
                    if (!label.toLowerCase().includes('read more') && !value.toLowerCase().includes('read more')) {
                        extractedSpecs.push(`${label}: ${value}`);
                    }
                }
            }
        });

        // STRATEGY B: List Extraction
        if (extractedSpecs.length < 3) {
            $('li').each((i, li) => {
                const text = $(li).text().trim();
                if (text.includes(':')) {
                    const parts = text.split(':');
                    if (parts.length === 2) {
                        const label = parts[0].trim();
                        const value = parts[1].trim();
                        if (label.length < 25 && value.length > 1 && value.length < 100) {
                            extractedSpecs.push(`${label}: ${value}`);
                        }
                    }
                }
            });
        }

        // Filter and prioritize specs
        let validSpecs = extractedSpecs.filter(s => {
            const lower = s.toLowerCase();
            return !lower.includes('price') && !lower.includes('user review') && !lower.includes('disclaimer');
        });

        if (category) {
            const prioritized: string[] = [];
            const others: string[] = [];

            validSpecs.forEach(s => {
                const label = s.split(':')[0].toLowerCase();
                if (category.importantFields.some(f => label.includes(f.toLowerCase()))) {
                    prioritized.push(s);
                } else {
                    others.push(s);
                }
            });
            validSpecs = [...prioritized, ...others].slice(0, 15);
        } else {
            validSpecs = validSpecs.slice(0, 10);
        }

        // 🤖 AI ENHANCEMENT: If scraping found few specs, enhance with AI
        if (validSpecs.length < 4) {
            console.log("[SpecFetcher] Few specs found, enhancing with AI...");
            const pageText = $('body').text().substring(0, 5000);
            // We pass the title + page text so AI can extract OR infer from title if page text is garbage
            const aiSpecs = await extractSpecsWithAI(productTitle, `Product Title: ${productTitle}\n\nPAGE CONTENT ESTIMATE: ${pageText}`);

            const aiSpecsList = Object.entries(aiSpecs)
                .filter(([_, v]) => v)
                .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`);

            // Merge AI specs with scraped specs (avoid duplicates)
            const existingKeys = validSpecs.map(s => s.split(':')[0].toLowerCase().trim());
            aiSpecsList.forEach(s => {
                const key = s.split(':')[0].toLowerCase().trim();
                if (!existingKeys.includes(key)) {
                    validSpecs.push(s);
                }
            });

            return {
                category: targetCategoryName,
                specs: validSpecs.slice(0, 15),
                source: targetLink,
                aiEnhanced: true
            };
        }

        if (validSpecs.length === 0) {
            return {
                category: targetCategoryName,
                specs: [],
                message: "Specs not available (Scraping blocked)"
            };
        }

        return {
            category: targetCategoryName,
            specs: validSpecs,
            source: targetLink
        };

    } catch (error) {
        console.error(`[SpecFetcher] Error:`, error);

        // 🤖 FINAL FALLBACK: Use AI extraction
        try {
            const aiSpecs = await extractSpecsWithAI(productTitle);
            const aiSpecsList = Object.entries(aiSpecs)
                .filter(([_, v]) => v)
                .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`);

            if (aiSpecsList.length > 0) {
                return {
                    category: targetCategoryName,
                    specs: aiSpecsList,
                    message: "Specs extracted using AI (fallback)",
                    aiEnhanced: true
                };
            }
        } catch (aiError) {
            console.error("[SpecFetcher] AI fallback also failed:", aiError);
        }

        return {
            category: targetCategoryName,
            specs: [],
            message: "Failed to fetch specifications"
        };
    }
}

// 🤖 NEW: AI-Powered Price Analysis
export async function fetchPriceAnalysis(
    productTitle: string,
    currentPrice: number,
    priceHistory?: { date: string; price: number }[]
): Promise<BuyRecommendation> {
    return getPriceRecommendation(productTitle, currentPrice, priceHistory);
}

