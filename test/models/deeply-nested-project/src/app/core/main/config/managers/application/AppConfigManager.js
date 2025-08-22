// Application Configuration Manager
class AppConfigManager {
  constructor() {
    this.config = {};
  }

  async loadConfiguration() {
    // Simulate loading configuration from various sources
    this.config = {
      server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || 'localhost'
      },
      database: {
        url: process.env.DATABASE_URL || 'memory://localhost',
        maxConnections: 10
      },
      logging: {
        level: process.env.LOG_LEVEL || 'info'
      },
      features: {
        notifications: {
          email: true,
          sms: false,
          push: true
        }
      }
    };
  }

  get(path, defaultValue = null) {
    const keys = path.split('.');
    let value = this.config;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue;
      }
    }

    return value;
  }

  set(path, value) {
    const keys = path.split('.');
    let current = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }
}

module.exports = AppConfigManager;
