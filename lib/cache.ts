// Simple in-memory cache for client-side data
class SimpleCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl: number; // Time to live in milliseconds

  constructor(ttlMinutes = 5) {
    this.ttl = ttlMinutes * 60 * 1000;
  }

  set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear() {
    this.cache.clear();
  }
}

// Global cache instance
export const dataCache = new SimpleCache(10); // 10 minutes TTL