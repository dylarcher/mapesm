// Configuration management module
import { logger } from './logger.js';

export const config = {
  environment: 'development',
  api: {
    baseUrl: 'https://api.example.com',
    timeout: 10000,
    retries: 3
  },
  auth: {
    tokenExpiry: 3600000, // 1 hour
    refreshThreshold: 300000 // 5 minutes
  },
  cache: {
    defaultTtl: 300000, // 5 minutes
    maxSize: 100
  },
  logging: {
    level: 'info',
    console: true,
    file: false
  },

  init(customConfig = {}) {
    this.merge(customConfig);
    logger.info('Configuration initialized', {
      environment: this.environment,
      apiUrl: this.api.baseUrl
    });
  },

  merge(customConfig) {
    const deepMerge = (target, source) => {
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          target[key] = target[key] || {};
          deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    };

    deepMerge(this, customConfig);
  },

  get(path) {
    const keys = path.split('.');
    let value = this;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }

    return value;
  },

  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let target = this;

    for (const key of keys) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      target = target[key];
    }

    target[lastKey] = value;
    logger.debug('Configuration updated', { path, value });
  },

  isDevelopment() {
    return this.environment === 'development';
  },

  isProduction() {
    return this.environment === 'production';
  }
};
