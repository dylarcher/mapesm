// Configuration Manager - Handles CLI configuration
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';

export class ConfigManager {
  constructor(configPath = null) {
    this.configPath = configPath || this.getDefaultConfigPath();
    this.config = {};
    this.defaults = {
      build: {
        environment: 'production',
        outputDir: 'dist',
        minify: true,
        sourceMap: false
      },
      serve: {
        port: 3000,
        host: 'localhost',
        hot: true,
        open: false
      },
      deployment: {
        autoRollback: true,
        timeout: 300000, // 5 minutes
        retries: 3
      }
    };

    this.load();
  }

  getDefaultConfigPath() {
    return resolve(process.cwd(), '.mycli.config.json');
  }

  load() {
    if (existsSync(this.configPath)) {
      try {
        const configData = readFileSync(this.configPath, 'utf8');
        this.config = JSON.parse(configData);
      } catch (error) {
        throw new Error(`Failed to parse config file: ${error.message}`);
      }
    }

    // Merge with defaults
    this.config = this.mergeDeep(this.defaults, this.config);
  }

  save() {
    try {
      // Ensure directory exists
      const configDir = dirname(this.configPath);
      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true });
      }

      writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf8');
    } catch (error) {
      throw new Error(`Failed to save config file: ${error.message}`);
    }
  }

  get(path, defaultValue = undefined) {
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
    const lastKey = keys.pop();
    let target = this.config;

    for (const key of keys) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      target = target[key];
    }

    target[lastKey] = value;
  }

  has(path) {
    return this.get(path) !== undefined;
  }

  delete(path) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let target = this.config;

    for (const key of keys) {
      if (!target[key] || typeof target[key] !== 'object') {
        return false;
      }
      target = target[key];
    }

    return delete target[lastKey];
  }

  merge(newConfig) {
    this.config = this.mergeDeep(this.config, newConfig);
  }

  reset() {
    this.config = JSON.parse(JSON.stringify(this.defaults));
  }

  getAll() {
    return JSON.parse(JSON.stringify(this.config));
  }

  getDefaults() {
    return JSON.parse(JSON.stringify(this.defaults));
  }

  mergeDeep(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])) {
          result[key] = this.mergeDeep(result[key], source[key]);
        } else {
          result[key] = this.mergeDeep({}, source[key]);
        }
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  // Environment-specific configurations
  setEnvironment(env) {
    this.set('environment', env);
  }

  getEnvironment() {
    return this.get('environment', 'development');
  }

  // Validation
  validate() {
    const errors = [];

    // Validate port numbers
    const servePort = this.get('serve.port');
    if (servePort && (isNaN(servePort) || servePort < 1 || servePort > 65535)) {
      errors.push('serve.port must be a number between 1 and 65535');
    }

    // Validate timeout values
    const deployTimeout = this.get('deployment.timeout');
    if (deployTimeout && (isNaN(deployTimeout) || deployTimeout < 1000)) {
      errors.push('deployment.timeout must be at least 1000ms');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
