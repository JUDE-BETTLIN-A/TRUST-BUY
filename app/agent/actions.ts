"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// --- Agent Configuration Actions ---

export async function saveAgentConfig(shippingAddress: string, paymentMethod: string) {
    const session = await auth();
    if (!session?.user?.email) return { error: "Authentication required" };

    try {
        await prisma.user.update({
            where: { email: session.user.email },
            data: {
                shippingAddress,
                paymentMethod
            }
        });
        revalidatePath("/agent");
        return { success: true };
    } catch (error) {
        return { error: "Failed to save configuration" };
    }
}

export async function getAgentConfig() {
    const session = await auth();
    if (!session?.user?.email) return null;

    return await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { shippingAddress: true, paymentMethod: true, walletBalance: true }
    });
}

// --- Wallet Logic ---

export async function depositToWallet(amount: number) {
    const session = await auth();
    if (!session?.user?.email) return { error: "Auth required" };

    await prisma.user.update({
        where: { email: session.user.email },
        data: { walletBalance: { increment: amount } }
    });
    revalidatePath("/agent");
    return { success: true };
}

// --- Agent Delegation Logic ---

export async function delegateToAgentAction(alertId: string, targetPrice: number, mode: "AUTO" | "MANUAL") {
    const session = await auth();
    if (!session?.user?.email) return { error: "Auth required" };

    const autoBuy = mode === "AUTO";

    await prisma.alert.update({
        where: { id: alertId },
        data: {
            targetPrice,
            agentPaymentMode: mode,
            autoBuy: autoBuy // Sync for backward compatibility logic
        }
    });

    revalidatePath("/alerts");
    revalidatePath("/agent");
    return { success: true };
}


// --- Auto-Buy Logic (Updated) ---

export async function toggleAutoBuy(alertId: string, enabled: boolean) {
    const session = await auth();
    if (!session?.user?.email) return { error: "Auth required" };

    const alert = await prisma.alert.findUnique({ where: { id: alertId } });
    if (!alert || alert.userEmail !== session.user.email) return { error: "Unauthorized" };

    await prisma.alert.update({
        where: { id: alertId },
        data: {
            autoBuy: enabled,
            agentPaymentMode: enabled ? "AUTO" : "MANUAL"
        }
    });
    revalidatePath("/agent");
    revalidatePath("/alerts");
    return { success: true };
}

// Triggered by the "Agent" to simulate order placement
export async function executeAutoBuy(alertId: string) {
    const session = await auth();
    if (!session?.user?.email) return { error: "Auth required" };

    const alert = await prisma.alert.findUnique({ where: { id: alertId } });
    if (!alert) return { error: "Alert not found" };

    // Check Wallet Balance
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user || (user.walletBalance || 0) < alert.currentPrice) {
        return { error: "Insufficient wallet balance!" };
    }

    // Deduct Balance
    await prisma.user.update({
        where: { email: session.user.email },
        data: { walletBalance: { decrement: alert.currentPrice } }
    });

    // Create Order
    await prisma.order.create({
        data: {
            userEmail: session.user.email,
            productTitle: alert.productTitle,
            price: alert.currentPrice,
            productImage: alert.productImage,
            status: "Ordered automatically by TrustBuy Agent"
        }
    });

    // Disable the alert after buying
    await prisma.alert.update({
        where: { id: alertId },
        data: { isActive: false, autoBuy: false, agentPaymentMode: null }
    });

    revalidatePath("/agent");
    revalidatePath("/alerts");
    return { success: true, message: `Successfully ordered ${alert.productTitle} for ₹${alert.currentPrice}!` };
}

export async function getOrders() {
    const session = await auth();
    if (!session?.user?.email) return [];

    return await prisma.order.findMany({
        where: { userEmail: session.user.email },
        orderBy: { orderedAt: 'desc' }
    });
}
