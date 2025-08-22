// Validation Plugin
const validationPlugin = {
  name: 'validation',
  version: '1.0.0',
  description: 'Adds data validation capabilities',

  init(pluginManager) {
    console.log('🔍 Initializing Validation Plugin');
    this.validationRules = new Map();
    this.validationErrors = [];

    // Set up default validation rules
    this.addRule('required', (value) => {
      return value !== null && value !== undefined && value !== '';
    });

    this.addRule('email', (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    });

    this.addRule('minLength', (value, minLength) => {
      return typeof value === 'string' && value.length >= minLength;
    });

    this.addRule('maxLength', (value, maxLength) => {
      return typeof value === 'string' && value.length <= maxLength;
    });
  },

  hooks: {
    'pre-save': function (data) {
      console.log('🔍 Validating data before save');

      // Example validation rules
      const validationRules = {
        'user-*': ['required', { rule: 'minLength', params: [2] }],
        'email-*': ['required', 'email'],
        'config-*': ['required']
      };

      const isValid = this.validateData(data.key, data.value, validationRules);

      if (!isValid) {
        throw new Error(`Validation failed for ${data.key}: ${this.getLastErrors().join(', ')}`);
      }

      return data;
    },

    'process-data': function (data) {
      // Add validation metadata
      return {
        ...data,
        validated: true,
        validatedBy: 'validation-plugin'
      };
    }
  },

  addRule(name, validatorFunction) {
    this.validationRules.set(name, validatorFunction);
    console.log(`➕ Added validation rule: ${name}`);
  },

  removeRule(name) {
    this.validationRules.delete(name);
    console.log(`➖ Removed validation rule: ${name}`);
  },

  validateData(key, value, rules) {
    this.validationErrors = [];

    // Find matching rules for the key
    for (const [pattern, ruleList] of Object.entries(rules)) {
      if (this.matchesPattern(key, pattern)) {
        for (const rule of ruleList) {
          if (!this.applyRule(value, rule)) {
            return false;
          }
        }
        break;
      }
    }

    return this.validationErrors.length === 0;
  },

  matchesPattern(key, pattern) {
    // Simple pattern matching with wildcards
    const regexPattern = pattern.replace(/\*/g, '.*');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(key);
  },

  applyRule(value, rule) {
    if (typeof rule === 'string') {
      // Simple rule name
      const validator = this.validationRules.get(rule);
      if (!validator) {
        this.validationErrors.push(`Unknown rule: ${rule}`);
        return false;
      }

      if (!validator(value)) {
        this.validationErrors.push(`Failed ${rule} validation`);
        return false;
      }
    } else if (typeof rule === 'object' && rule.rule) {
      // Rule with parameters
      const validator = this.validationRules.get(rule.rule);
      if (!validator) {
        this.validationErrors.push(`Unknown rule: ${rule.rule}`);
        return false;
      }

      const params = rule.params || [];
      if (!validator(value, ...params)) {
        this.validationErrors.push(`Failed ${rule.rule} validation`);
        return false;
      }
    }

    return true;
  },

  getLastErrors() {
    return [...this.validationErrors];
  },

  getAllRules() {
    return Array.from(this.validationRules.keys());
  },

  cleanup() {
    console.log('🧹 Cleaning up Validation Plugin');
    this.validationRules.clear();
    this.validationErrors = [];
  }
};

module.exports = validationPlugin;
