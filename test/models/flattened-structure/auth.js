// Authentication module
import { logger } from './logger.js';
import { utils } from './utils.js';

let currentUser = null;
let isAuthenticated = false;

export const auth = {
  setup(authConfig) {
    logger.debug('Setting up authentication');
    this.config = { ...authConfig };
  },

  async login(credentials) {
    logger.info('Attempting login');

    if (!utils.validateEmail(credentials.email)) {
      throw new Error('Invalid email format');
    }

    // Simulate authentication
    currentUser = {
      id: utils.generateId(),
      email: credentials.email,
      timestamp: Date.now()
    };

    isAuthenticated = true;
    logger.info('Login successful');
    return currentUser;
  },

  logout() {
    logger.info('Logging out user');
    currentUser = null;
    isAuthenticated = false;
  },

  getCurrentUser() {
    return currentUser;
  },

  isLoggedIn() {
    return isAuthenticated;
  }
};
