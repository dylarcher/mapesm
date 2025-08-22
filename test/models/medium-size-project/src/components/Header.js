/**
 * Header component
 */

import { logger } from '../utils/logger.js';

export class Header {
  constructor() {
    this.title = 'Medium Test App';
    logger.debug('Header component initialized');
  }

  render() {
    return `<header><h1>${this.title}</h1></header>`;
  }
}
