/**
 * API service - handles HTTP requests
 */

import { formatResponse } from '../utils/formatter.js';
import { logger } from '../utils/logger.js';

export class ApiService {
  constructor() {
    this.baseUrl = 'https://api.mediumtest.com';
    this.headers = {
      'Content-Type': 'application/json'
    };
    logger.info('ApiService initialized');
  }

  async get(endpoint) {
    logger.debug(`GET request to ${endpoint}`);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: this.headers
      });

      const data = await response.json();
      return formatResponse(data);
    } catch (error) {
      logger.error(`GET request failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async post(endpoint, data) {
    logger.debug(`POST request to ${endpoint}`);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(data)
      });

      const responseData = await response.json();
      return formatResponse(responseData);
    } catch (error) {
      logger.error(`POST request failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async getData() {
    return this.get('/data');
  }
}
