/**
 * Simple in-memory cache with TTL for search results
 * This reduces API calls and improves response time
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

class SearchCache {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private readonly DEFAULT_TTL = 15 * 60 * 1000; // 15 minutes

    /**
     * Get cached data if valid
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        console.log(`[Cache] HIT for: ${key}`);
        return entry.data as T;
    }

    /**
     * Set cache with optional TTL
     */
    set<T>(key: string, data: T, ttlMs?: number): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttlMs || this.DEFAULT_TTL
        });
        console.log(`[Cache] SET for: ${key} (TTL: ${(ttlMs || this.DEFAULT_TTL) / 1000}s)`);
    }

    /**
     * Generate cache key from query
     */
    static makeKey(prefix: string, query: string): string {
        return `${prefix}:${query.toLowerCase().trim().replace(/\s+/g, '-')}`;
    }

    /**
     * Clear expired entries
     */
    cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get cache stats
     */
    stats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Singleton instance
export const searchCache = new SearchCache();

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(() => searchCache.cleanup(), 5 * 60 * 1000);
}
