
// lib/history.ts

export interface HistoryItem {
    id: string;
    query: string;
    timestamp: number;
    image?: string;
    topResultTitle?: string;
    price?: string;
    link?: string;
}

const HISTORY_KEY = 'trustbuy_search_history';

export function getHistory(): HistoryItem[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(HISTORY_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to read history", e);
        return [];
    }
}

export function addToHistory(item: Omit<HistoryItem, 'id' | 'timestamp'>) {
    if (typeof window === 'undefined') return;
    const history = getHistory();

    // Remove duplicates (same query)
    const filtered = history.filter(h => h.query.toLowerCase() !== item.query.toLowerCase());

    const newItem: HistoryItem = {
        ...item,
        id: crypto.randomUUID(),
        timestamp: Date.now()
    };

    // Add to top, limit to 20
    const updated = [newItem, ...filtered].slice(0, 20);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export function clearHistory() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(HISTORY_KEY);
}
