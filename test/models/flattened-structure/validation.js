// Validation utilities module
import { logger } from './logger.js';

export const validation = {
  // Schema validation
  validateSchema(data, schema) {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];

      // Check required fields
      if (rules.required && (value === undefined || value === null)) {
        errors.push(`Field '${field}' is required`);
        continue;
      }

      // Skip validation if field is optional and not provided
      if (!rules.required && (value === undefined || value === null)) {
        continue;
      }

      // Type validation
      if (rules.type && typeof value !== rules.type) {
        errors.push(`Field '${field}' must be of type ${rules.type}`);
      }

      // String validations
      if (rules.type === 'string' && typeof value === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`Field '${field}' must be at least ${rules.minLength} characters`);
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`Field '${field}' must be no more than ${rules.maxLength} characters`);
        }
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`Field '${field}' format is invalid`);
        }
      }

      // Number validations
      if (rules.type === 'number' && typeof value === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push(`Field '${field}' must be at least ${rules.min}`);
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push(`Field '${field}' must be no more than ${rules.max}`);
        }
      }

      // Array validations
      if (rules.type === 'object' && Array.isArray(value)) {
        if (rules.minItems && value.length < rules.minItems) {
          errors.push(`Field '${field}' must have at least ${rules.minItems} items`);
        }
        if (rules.maxItems && value.length > rules.maxItems) {
          errors.push(`Field '${field}' must have no more than ${rules.maxItems} items`);
        }
      }
    }

    if (errors.length > 0) {
      logger.debug('Schema validation failed', { errors });
      return { valid: false, errors };
    }

    return { valid: true, errors: [] };
  },

  // Common validation patterns
  patterns: {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^\+?[\d\s\-\(\)]{10,}$/,
    url: /^https?:\/\/.+/,
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  },

  // Quick validation methods
  isEmail(email) {
    return this.patterns.email.test(email);
  },

  isPhone(phone) {
    return this.patterns.phone.test(phone);
  },

  isUrl(url) {
    return this.patterns.url.test(url);
  },

  isUuid(uuid) {
    return this.patterns.uuid.test(uuid);
  },

  // Sanitization
  sanitize: {
    string(value, maxLength = 1000) {
      if (typeof value !== 'string') return '';
      return value.trim().substring(0, maxLength);
    },

    number(value, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) {
      const num = parseFloat(value);
      if (isNaN(num)) return 0;
      return Math.min(Math.max(num, min), max);
    },

    boolean(value) {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
      }
      return Boolean(value);
    }
  }
};
