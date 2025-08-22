/**
 * Medium test case - moderate complexity
 * Tests half-circle layout with multiple directories
 */

import { Footer } from './components/Footer.js';
import { Header } from './components/Header.js';
import { ApiService } from './services/ApiService.js';
import { UserService } from './services/UserService.js';
import { logger } from './utils/logger.js';
import { validator } from './utils/validator.js';

export class App {
  constructor() {
    this.userService = new UserService();
    this.apiService = new ApiService();
    logger.info('App initialized');
  }

  async render() {
    const header = new Header();
    const footer = new Footer();

    if (validator.isValid(this.userService.currentUser)) {
      return {
        header: header.render(),
        content: await this.apiService.getData(),
        footer: footer.render()
      };
    }

    return { error: 'Invalid user' };
  }
}
