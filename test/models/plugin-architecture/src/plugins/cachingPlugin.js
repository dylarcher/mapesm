// Caching Plugin
const cachingPlugin = {
  name: 'caching',
  version: '1.0.0',
  description: 'Adds caching capabilities with TTL support',

  init(pluginManager) {
    console.log('💾 Initializing Caching Plugin');
    this.cache = new Map();
    this.ttlMap = new Map();
    this.hitCount = 0;
    this.missCount = 0;

    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 60000); // Check every minute
  },

  hooks: {
    'get-data': function (data) {
      const cacheKey = `cache:${data.key}`;
      const cachedValue = this.get(cacheKey);

      if (cachedValue !== null) {
        console.log(`🎯 Cache HIT for ${data.key}`);
        this.hitCount++;
        return { ...data, value: cachedValue, fromCache: true };
      } else {
        console.log(`❌ Cache MISS for ${data.key}`);
        this.missCount++;

        // Cache the value for next time if it exists
        if (data.value !== null && data.value !== undefined) {
          this.set(cacheKey, data.value, 300); // 5 minute TTL
        }

        return data;
      }
    },

    'post-save': function (data) {
      // Invalidate cache when data is saved
      const cacheKey = `cache:${data.key}`;
      this.delete(cacheKey);
      console.log(`🗑️ Cache invalidated for ${data.key}`);
      return data;
    }
  },

  middleware: async function (context, next) {
    // Add cache statistics to context
    context.cacheStats = {
      size: cachingPlugin.cache.size,
      hits: cachingPlugin.hitCount,
      misses: cachingPlugin.missCount,
      hitRate: cachingPlugin.getHitRate()
    };

    return await next();
  },

  set(key, value, ttlSeconds = 3600) {
    const expiresAt = Date.now() + (ttlSeconds * 1000);

    this.cache.set(key, value);
    this.ttlMap.set(key, expiresAt);

    console.log(`💾 Cached ${key} (TTL: ${ttlSeconds}s)`);
  },

  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    const expiresAt = this.ttlMap.get(key);
    if (expiresAt && Date.now() > expiresAt) {
      // Expired
      this.delete(key);
      return null;
    }

    return this.cache.get(key);
  },

  delete(key) {
    this.cache.delete(key);
    this.ttlMap.delete(key);
  },

  clear() {
    this.cache.clear();
    this.ttlMap.clear();
    console.log('🧹 Cache cleared');
  },

  cleanupExpired() {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, expiresAt] of this.ttlMap.entries()) {
      if (now > expiresAt) {
        this.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      console.log(`🗑️ Cleaned up ${expiredCount} expired cache entries`);
    }
  },

  getStats() {
    return {
      size: this.cache.size,
      hits: this.hitCount,
      misses: this.missCount,
      hitRate: this.getHitRate(),
      keys: Array.from(this.cache.keys())
    };
  },

  getHitRate() {
    const total = this.hitCount + this.missCount;
    return total === 0 ? 0 : (this.hitCount / total * 100).toFixed(2);
  },

  cleanup() {
    console.log('🧹 Cleaning up Caching Plugin');
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }
};

module.exports = cachingPlugin;
