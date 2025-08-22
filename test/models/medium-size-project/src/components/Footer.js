/**
 * Footer component
 */

import { validator } from '../utils/validator.js';

export class Footer {
  constructor() {
    this.year = new Date().getFullYear();
  }

  render() {
    const isValidYear = validator.isValidYear(this.year);
    return `<footer><p>© ${isValidYear ? this.year : '2024'} Medium Test App</p></footer>`;
  }
}
