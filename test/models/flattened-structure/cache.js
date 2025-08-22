// Simple caching module
import { config } from './config.js';
import { logger } from './logger.js';

export const cache = {
  storage: new Map(),
  timers: new Map(),

  store(key, value, ttl = null) {
    // Use default TTL from config if not specified
    const timeToLive = ttl || config.cache?.defaultTtl || 300000; // 5 minutes default

    // Clear existing timer if key already exists
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Store the value
    this.storage.set(key, {
      value,
      timestamp: Date.now(),
      ttl: timeToLive
    });

    // Set expiration timer
    const timer = setTimeout(() => {
      this.remove(key);
    }, timeToLive);

    this.timers.set(key, timer);

    logger.debug('Cache stored', { key, ttl: timeToLive });

    // Enforce cache size limit
    this.enforceMaxSize();
  },

  get(key) {
    const cached = this.storage.get(key);

    if (!cached) {
      logger.debug('Cache miss', { key });
      return null;
    }

    // Check if expired (double-check in case timer didn't fire)
    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      this.remove(key);
      logger.debug('Cache expired', { key });
      return null;
    }

    logger.debug('Cache hit', { key });
    return cached.value;
  },

  has(key) {
    return this.storage.has(key) && !this.isExpired(key);
  },

  remove(key) {
    const removed = this.storage.delete(key);

    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }

    if (removed) {
      logger.debug('Cache removed', { key });
    }

    return removed;
  },

  clear() {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();

    const count = this.storage.size;
    this.storage.clear();

    logger.info('Cache cleared', { itemsRemoved: count });
  },

  size() {
    return this.storage.size;
  },

  keys() {
    return Array.from(this.storage.keys());
  },

  isExpired(key) {
    const cached = this.storage.get(key);
    if (!cached) return true;

    return Date.now() - cached.timestamp > cached.ttl;
  },

  enforceMaxSize() {
    const maxSize = config.cache?.maxSize || 100;

    if (this.storage.size > maxSize) {
      // Remove oldest entries first
      const entries = Array.from(this.storage.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toRemove = entries.slice(0, this.storage.size - maxSize);
      toRemove.forEach(([key]) => this.remove(key));

      logger.debug('Cache size enforced', {
        maxSize,
        currentSize: this.storage.size,
        removed: toRemove.length
      });
    }
  }
};
