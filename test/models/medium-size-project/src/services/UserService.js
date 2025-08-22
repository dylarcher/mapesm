/**
 * User service - manages user operations
 */

import { logger } from '../utils/logger.js';
import { ApiService } from './ApiService.js';

export class UserService {
  constructor() {
    this.apiService = new ApiService();
    this.currentUser = null;
    logger.info('UserService initialized');
  }

  async login(credentials) {
    logger.debug('Attempting user login');
    const response = await this.apiService.post('/auth/login', credentials);

    if (response.success) {
      this.currentUser = response.user;
      logger.info(`User ${response.user.id} logged in successfully`);
      return this.currentUser;
    }

    logger.error('Login failed');
    return null;
  }

  logout() {
    logger.info(`User ${this.currentUser?.id} logged out`);
    this.currentUser = null;
  }
}
