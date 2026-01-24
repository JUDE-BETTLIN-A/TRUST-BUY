"use server";

import { compareProducts, ComparisonResult, extractSpecsWithAI, AIProductSpecs } from '@/lib/ai-utils';

// 🤖 AI-Powered Product Comparison
export async function getAIComparison(
    products: {
        title: string;
        price: string;
        specs?: any;
    }[]
): Promise<ComparisonResult | null> {
    if (products.length < 2) return null;

    try {
        // Get AI-enhanced specs for both products
        const [specs1, specs2] = await Promise.all([
            extractSpecsWithAI(products[0].title),
            extractSpecsWithAI(products[1].title)
        ]);

        const result = await compareProducts(
            { title: products[0].title, price: products[0].price, specs: specs1 },
            { title: products[1].title, price: products[1].price, specs: specs2 }
        );

        return result;
    } catch (error) {
        console.error('[AI Compare] Error:', error);
        return null;
    }
}

// Get AI specs for a single product
export async function getAISpecs(title: string): Promise<AIProductSpecs> {
    return extractSpecsWithAI(title);
}
