"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface HistoryItem {
  id: string;
  query: string;
  timestamp: number;
  image?: string | null;
  topResultTitle?: string | null;
  price?: string | null;
  link?: string | null;
}

// Ensure user exists in database
async function ensureUser(email: string, name?: string | null, image?: string | null) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingUser) {
    await prisma.user.create({
      data: {
        email,
        name: name || email.split("@")[0],
        image: image || null,
      },
    });
  }
}

// Get history for logged-in user from database
export async function getHistoryFromDB(): Promise<HistoryItem[]> {
  const session = await auth();
  
  if (!session?.user?.email) {
    return [];
  }

  try {
    const history = await prisma.history.findMany({
      where: { userEmail: session.user.email },
      orderBy: { timestamp: "desc" },
      take: 50,
    });

    return history.map((h) => ({
      id: h.id,
      query: h.query,
      timestamp: h.timestamp.getTime(),
      image: h.image,
      topResultTitle: h.topResultTitle,
      price: h.price,
      link: h.link,
    }));
  } catch (error) {
    console.error("Failed to fetch history from DB:", error);
    return [];
  }
}

// Add history item to database
export async function addHistoryToDB(item: {
  query: string;
  image?: string;
  topResultTitle?: string;
  price?: string;
  link?: string;
}): Promise<boolean> {
  const session = await auth();
  
  if (!session?.user?.email) {
    return false;
  }

  try {
    // Ensure user exists
    await ensureUser(session.user.email, session.user.name, session.user.image);

    // Remove duplicate queries (keep only latest)
    await prisma.history.deleteMany({
      where: {
        userEmail: session.user.email,
        query: {
          equals: item.query,
          mode: "insensitive",
        },
      },
    });

    // Add new history item
    await prisma.history.create({
      data: {
        userEmail: session.user.email,
        query: item.query,
        image: item.image || null,
        topResultTitle: item.topResultTitle || null,
        price: item.price || null,
        link: item.link || null,
      },
    });

    // Keep only last 50 items
    const allHistory = await prisma.history.findMany({
      where: { userEmail: session.user.email },
      orderBy: { timestamp: "desc" },
      select: { id: true },
    });

    if (allHistory.length > 50) {
      const idsToDelete = allHistory.slice(50).map((h) => h.id);
      await prisma.history.deleteMany({
        where: { id: { in: idsToDelete } },
      });
    }

    return true;
  } catch (error) {
    console.error("Failed to add history to DB:", error);
    return false;
  }
}

// Clear all history for logged-in user
export async function clearHistoryFromDB(): Promise<boolean> {
  const session = await auth();
  
  if (!session?.user?.email) {
    return false;
  }

  try {
    await prisma.history.deleteMany({
      where: { userEmail: session.user.email },
    });
    return true;
  } catch (error) {
    console.error("Failed to clear history from DB:", error);
    return false;
  }
}

// Delete a single history item
export async function deleteHistoryItem(historyId: string): Promise<boolean> {
  const session = await auth();
  
  if (!session?.user?.email) {
    return false;
  }

  try {
    // Ensure user can only delete their own history
    await prisma.history.deleteMany({
      where: {
        id: historyId,
        userEmail: session.user.email,
      },
    });
    return true;
  } catch (error) {
    console.error("Failed to delete history item:", error);
    return false;
  }
}
