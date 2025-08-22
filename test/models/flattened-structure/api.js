// API communication module
import { auth } from './auth.js';
import { cache } from './cache.js';
import { logger } from './logger.js';

export const api = {
  baseUrl: '',
  timeout: 5000,

  configure(apiConfig) {
    this.baseUrl = apiConfig.baseUrl;
    this.timeout = apiConfig.timeout || 5000;
    logger.debug('API configured', { baseUrl: this.baseUrl });
  },

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (auth.isLoggedIn()) {
      headers.Authorization = `Bearer ${auth.getCurrentUser().id}`;
    }

    logger.debug('Making API request', { url, method: options.method || 'GET' });

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        timeout: this.timeout
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Cache successful responses
      if (options.method === 'GET') {
        cache.store(`api:${endpoint}`, data);
      }

      return data;
    } catch (error) {
      logger.error('API request failed', { url, error: error.message });
      throw error;
    }
  },

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};
