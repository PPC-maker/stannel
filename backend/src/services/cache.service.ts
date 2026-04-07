// Cache Service - STANNEL Platform
// In-memory caching with TTL for performance optimization

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

// In-memory cache store
const cache = new Map<string, CacheEntry<unknown>>();

// Cache statistics
const stats = {
  hits: 0,
  misses: 0,
  sets: 0,
};

// Default TTL values (in seconds)
export const CACHE_TTL = {
  SHORT: 30,           // 30 seconds - for rapidly changing data
  MEDIUM: 300,         // 5 minutes - for moderately changing data
  LONG: 1800,          // 30 minutes - for rarely changing data
  VERY_LONG: 3600,     // 1 hour - for static data
};

export const cacheService = {
  // Get cached value
  get<T>(key: string): T | null {
    const entry = cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      stats.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      cache.delete(key);
      stats.misses++;
      return null;
    }

    stats.hits++;
    return entry.value;
  },

  // Set cached value
  set<T>(key: string, value: T, ttlSeconds: number = CACHE_TTL.MEDIUM): void {
    cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlSeconds * 1000),
    });
    stats.sets++;
  },

  // Delete cached value
  delete(key: string): boolean {
    return cache.delete(key);
  },

  // Delete all keys matching pattern
  deletePattern(pattern: string): number {
    let deleted = 0;
    const regex = new RegExp(pattern.replace('*', '.*'));

    for (const key of cache.keys()) {
      if (regex.test(key)) {
        cache.delete(key);
        deleted++;
      }
    }

    return deleted;
  },

  // Clear all cache
  clear(): void {
    cache.clear();
  },

  // Get cache statistics
  getStats(): {
    hits: number;
    misses: number;
    sets: number;
    hitRate: string;
    size: number;
  } {
    const total = stats.hits + stats.misses;
    const hitRate = total > 0 ? ((stats.hits / total) * 100).toFixed(2) : '0';

    return {
      ...stats,
      hitRate: `${hitRate}%`,
      size: cache.size,
    };
  },

  // Cache key generators
  keys: {
    user: (id: string) => `user:${id}`,
    userProfile: (id: string) => `profile:${id}`,
    products: () => 'products:all',
    productById: (id: string) => `product:${id}`,
    events: () => 'events:active',
    eventById: (id: string) => `event:${id}`,
    dashboardStats: (userId: string) => `dashboard:${userId}`,
    supplierStats: (supplierId: string) => `supplier-stats:${supplierId}`,
    adminStats: () => 'admin:stats',
  },

  // Get or set pattern (cache-aside)
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number = CACHE_TTL.MEDIUM
  ): Promise<T> {
    const cached = cacheService.get(key) as T | null;
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    cacheService.set(key, value, ttlSeconds);
    return value;
  },

  // Invalidation helpers
  invalidate: {
    user: (id: string) => {
      cacheService.delete(cacheService.keys.user(id));
      cacheService.delete(cacheService.keys.userProfile(id));
      cacheService.delete(cacheService.keys.dashboardStats(id));
    },
    products: () => {
      cacheService.deletePattern('product:*');
      cacheService.delete(cacheService.keys.products());
    },
    events: () => {
      cacheService.deletePattern('event:*');
      cacheService.delete(cacheService.keys.events());
    },
    supplier: (id: string) => {
      cacheService.delete(cacheService.keys.supplierStats(id));
    },
    admin: () => {
      cacheService.delete(cacheService.keys.adminStats());
    },
    all: () => {
      cacheService.clear();
    },
  },
};

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiresAt) {
      cache.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[Cache] Cleaned ${cleaned} expired entries`);
  }
}, 5 * 60 * 1000);
