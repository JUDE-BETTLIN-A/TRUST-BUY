/**
 * User-specific localStorage utility
 * All keys are prefixed with user ID/email to keep data separate per account
 */

// Get user-specific key
export function getUserKey(baseKey: string, userId?: string | null): string {
    if (!userId) {
        // Fallback for non-logged-in users
        return `trustbuy_guest_${baseKey}`;
    }
    // Create a safe key from user ID (email or ID)
    const safeUserId = userId.replace(/[^a-zA-Z0-9]/g, '_');
    return `trustbuy_${safeUserId}_${baseKey}`;
}

// Get item with user-specific key
export function getUserItem(baseKey: string, userId?: string | null): string | null {
    if (typeof window === 'undefined') return null;
    const key = getUserKey(baseKey, userId);
    return localStorage.getItem(key);
}

// Set item with user-specific key
export function setUserItem(baseKey: string, value: string, userId?: string | null): void {
    if (typeof window === 'undefined') return;
    const key = getUserKey(baseKey, userId);
    localStorage.setItem(key, value);
}

// Remove item with user-specific key
export function removeUserItem(baseKey: string, userId?: string | null): void {
    if (typeof window === 'undefined') return;
    const key = getUserKey(baseKey, userId);
    localStorage.removeItem(key);
}

// Storage keys (base names without user prefix)
export const STORAGE_KEYS = {
    AVATAR: 'avatar',
    NAME: 'name',
    BASKET: 'basket',
    COMPARE: 'compare',
    HISTORY: 'history',
} as const;
