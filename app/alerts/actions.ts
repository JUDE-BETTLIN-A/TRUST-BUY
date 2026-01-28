"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createAlert(product: {
    title: string;
    price: string;
    image: string;
    link?: string;
}) {
    const session = await auth();
    if (!session?.user?.email) {
        throw new Error("You must be logged in to set an alert.");
    }

    // Parse price string to number "₹1,23,456" -> 123456
    const priceNum = parseFloat(product.price.replace(/[^0-9.]/g, ""));
    if (isNaN(priceNum)) {
        throw new Error("Invalid price format");
    }

    // Check if user exists, if not create (since we are using mock auth but real DB)
    let user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) {
        user = await prisma.user.create({
            data: {
                email: session.user.email,
                name: session.user.name || "User",
                image: session.user.image,
            },
        });
    }

    // Check if alert already exists for this product
    const existingAlert = await prisma.alert.findFirst({
        where: {
            userEmail: session.user.email,
            productTitle: product.title,
        },
    });

    if (existingAlert) {
        return { success: true, message: "Alert already exists for this product." };
    }

    try {
        await prisma.alert.create({
            data: {
                userEmail: session.user.email,
                productTitle: product.title,
                targetPrice: priceNum, // For now, target current price. Later we can add "Drop by X%" logic.
                currentPrice: priceNum,
                productImage: product.image,
                productLink: product.link || "#",
            },
        });
    } catch (error) {
         console.error("Failed to create alert:", error);
         return { success: false, message: "Database error: Could not save alert." };
    }

    revalidatePath("/alerts");
    return { success: true, message: "Alert set successfully!" };
}

export async function getAlerts() {
    const session = await auth();
    if (!session?.user?.email) return [];

    try {
        return await prisma.alert.findMany({
            where: { userEmail: session.user.email },
            orderBy: { createdAt: "desc" },
        });
    } catch (error) {
        console.error("Failed to fetch alerts:", error);
        return [];
    }
}

export async function removeAlert(alertId: string) {
    const session = await auth();
    if (!session?.user?.email) return;

    try {
        await prisma.alert.delete({
            where: {
                id: alertId,
                userEmail: session.user.email // Security check
            }
        });
        revalidatePath("/alerts");
    } catch (error) {
         console.error("Failed to remove alert:", error);
    }
}

import { scrapeProductsReal } from "@/lib/scraper";

export async function refreshAlerts() {
    const session = await auth();
    if (!session?.user?.email) return { success: false, message: "Not authenticated" };

    let updatedCount = 0;
    const droppedProducts: any[] = [];

    // Wrap in try-catch to handle DB connection errors
    let alerts: any[] = [];
    try {
        alerts = await prisma.alert.findMany({
            where: { userEmail: session.user.email },
        });
    } catch (error) {
        console.error("Failed to fetch alerts for refresh:", error); 
        return { success: false, message: "Database connection failed" };
    }

    for (const alert of alerts) {
        try {
            // Scrape current market data
            // Limit to 1 page to be fast
            const results = await scrapeProductsReal(alert.productTitle, 1);

            if (results.length > 0) {
                // Find the lowest price among the results that is likely the same product
                // Simple heuristic: just take the lowest price from the top 3 results to avoid completely irrelevant cheap items
                const topResults = results.slice(0, 3);
                const prices = topResults
                    .map(p => parseFloat(p.price.replace(/[^0-9.]/g, "")))
                    .filter(p => !isNaN(p) && p > 0);

                if (prices.length > 0) {
                    const lowestPrice = Math.min(...prices);

                    // Update DB if price changed
                    if (lowestPrice !== alert.currentPrice) {
                         // User asked to notify if price reduces (from current)
                        if (lowestPrice < alert.currentPrice) {
                            droppedProducts.push({
                                id: alert.id,
                                title: alert.productTitle,
                                oldPrice: alert.currentPrice,
                                newPrice: lowestPrice,
                                image: alert.productImage,
                                link: alert.productLink
                            });
                        }

                        await prisma.alert.update({
                            where: { id: alert.id },
                            data: {
                                currentPrice: lowestPrice,
                                updatedAt: new Date()
                            },
                        });
                        updatedCount++;
                    }
                }
            }
        } catch (error) {
            console.error(`Failed to refresh alert for ${alert.productTitle}:`, error);
        }
    }

    revalidatePath("/alerts");
    return {
        success: true,
        message: `Updated ${updatedCount} products with latest market prices.`,
        droppedProducts
    };
}
