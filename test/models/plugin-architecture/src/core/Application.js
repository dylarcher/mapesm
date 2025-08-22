// Core Application with Plugin Support
const PluginManager = require('./PluginManager');

class Application {
  constructor() {
    this.pluginManager = new PluginManager();
    this.data = new Map();
    this.config = {
      name: 'Plugin Demo App',
      version: '1.0.0'
    };
  }

  async initialize() {
    console.log(`🚀 Initializing ${this.config.name} v${this.config.version}`);

    // Execute pre-init hooks
    await this.pluginManager.executeHook('pre-init', { app: this });

    console.log('✅ Application initialized');

    // Execute post-init hooks
    await this.pluginManager.executeHook('post-init', { app: this });
  }

  async processData(data) {
    console.log(`📊 Processing data: ${JSON.stringify(data)}`);

    const context = {
      app: this,
      data,
      processed: false
    };

    // Execute through middleware chain
    const result = await this.pluginManager.executeMiddleware(context, async () => {
      // Core processing logic
      const processedData = {
        ...data,
        processed: true,
        timestamp: new Date(),
        processedBy: 'core'
      };

      // Execute data processing hooks
      return await this.pluginManager.executeHook('process-data', processedData);
    });

    return result;
  }

  async saveData(key, value) {
    console.log(`💾 Saving data: ${key}`);

    // Execute pre-save hooks
    const preResult = await this.pluginManager.executeHook('pre-save', { key, value });

    this.data.set(key, preResult.value || value);

    // Execute post-save hooks
    await this.pluginManager.executeHook('post-save', { key, value: this.data.get(key) });

    return this.data.get(key);
  }

  async getData(key) {
    console.log(`📖 Retrieving data: ${key}`);

    const value = this.data.get(key);

    // Execute data retrieval hooks
    const result = await this.pluginManager.executeHook('get-data', { key, value });

    return result.value || value;
  }

  async shutdown() {
    console.log('🔄 Shutting down application');

    // Execute shutdown hooks
    await this.pluginManager.executeHook('shutdown', { app: this });

    console.log('👋 Application shutdown complete');
  }

  // Plugin management methods
  loadPlugin(pluginName, plugin) {
    return this.pluginManager.register(pluginName, plugin);
  }

  unloadPlugin(pluginName) {
    return this.pluginManager.unregister(pluginName);
  }

  getPluginStats() {
    return this.pluginManager.getStats();
  }
}

module.exports = Application;
