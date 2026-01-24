
// lib/history.ts - User-specific search history

import { getUserItem, setUserItem, removeUserItem, STORAGE_KEYS } from './user-storage';

export interface HistoryItem {
    id: string;
    query: string;
    timestamp: number;
    image?: string;
    topResultTitle?: string;
    price?: string;
    link?: string;
}

export function getHistory(userId?: string | null): HistoryItem[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = getUserItem(STORAGE_KEYS.HISTORY, userId);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to read history", e);
        return [];
    }
}

export function addToHistory(item: Omit<HistoryItem, 'id' | 'timestamp'>, userId?: string | null) {
    if (typeof window === 'undefined') return;
    const history = getHistory(userId);

    // Remove duplicates (same query)
    const filtered = history.filter(h => h.query.toLowerCase() !== item.query.toLowerCase());

    const newItem: HistoryItem = {
        ...item,
        id: crypto.randomUUID(),
        timestamp: Date.now()
    };

    // Add to top, limit to 20
    const updated = [newItem, ...filtered].slice(0, 20);
    setUserItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated), userId);
}

export function clearHistory(userId?: string | null) {
    if (typeof window === 'undefined') return;
    removeUserItem(STORAGE_KEYS.HISTORY, userId);
}
