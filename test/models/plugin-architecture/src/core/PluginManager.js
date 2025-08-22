// Core Plugin System
class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.hooks = new Map();
    this.middleware = [];
  }

  // Register a plugin
  register(pluginName, plugin) {
    if (this.plugins.has(pluginName)) {
      throw new Error(`Plugin '${pluginName}' is already registered`);
    }

    console.log(`🔌 Registering plugin: ${pluginName}`);

    this.plugins.set(pluginName, plugin);

    // Initialize plugin if it has an init method
    if (typeof plugin.init === 'function') {
      plugin.init(this);
    }

    // Register plugin hooks
    if (plugin.hooks) {
      this.registerHooks(pluginName, plugin.hooks);
    }

    // Register middleware
    if (plugin.middleware) {
      this.addMiddleware(plugin.middleware);
    }

    console.log(`✅ Plugin '${pluginName}' registered successfully`);
  }

  // Unregister a plugin
  unregister(pluginName) {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin '${pluginName}' is not registered`);
    }

    console.log(`🔌 Unregistering plugin: ${pluginName}`);

    // Cleanup plugin if it has a cleanup method
    if (typeof plugin.cleanup === 'function') {
      plugin.cleanup();
    }

    // Remove hooks
    this.unregisterHooks(pluginName);

    // Remove middleware
    if (plugin.middleware) {
      this.removeMiddleware(plugin.middleware);
    }

    this.plugins.delete(pluginName);
    console.log(`❌ Plugin '${pluginName}' unregistered`);
  }

  // Get a registered plugin
  getPlugin(pluginName) {
    return this.plugins.get(pluginName);
  }

  // Get all registered plugins
  getAllPlugins() {
    return Array.from(this.plugins.keys());
  }

  // Check if plugin is registered
  hasPlugin(pluginName) {
    return this.plugins.has(pluginName);
  }

  // Hook system
  registerHooks(pluginName, hooks) {
    for (const [hookName, handler] of Object.entries(hooks)) {
      if (!this.hooks.has(hookName)) {
        this.hooks.set(hookName, []);
      }

      this.hooks.get(hookName).push({
        plugin: pluginName,
        handler
      });

      console.log(`🪝 Registered hook '${hookName}' for plugin '${pluginName}'`);
    }
  }

  unregisterHooks(pluginName) {
    for (const [hookName, handlers] of this.hooks.entries()) {
      const filteredHandlers = handlers.filter(h => h.plugin !== pluginName);

      if (filteredHandlers.length === 0) {
        this.hooks.delete(hookName);
      } else {
        this.hooks.set(hookName, filteredHandlers);
      }
    }
  }

  // Execute hooks
  async executeHook(hookName, data = {}) {
    const handlers = this.hooks.get(hookName) || [];

    console.log(`🪝 Executing hook '${hookName}' with ${handlers.length} handler(s)`);

    let result = data;

    for (const { plugin, handler } of handlers) {
      try {
        const hookResult = await handler(result, { plugin, hookName });
        if (hookResult !== undefined) {
          result = hookResult;
        }
      } catch (error) {
        console.error(`❌ Error in hook '${hookName}' for plugin '${plugin}':`, error.message);
      }
    }

    return result;
  }

  // Middleware system
  addMiddleware(middleware) {
    if (typeof middleware === 'function') {
      this.middleware.push(middleware);
      console.log(`⚙️ Added middleware`);
    } else if (Array.isArray(middleware)) {
      middleware.forEach(m => this.addMiddleware(m));
    }
  }

  removeMiddleware(middleware) {
    if (typeof middleware === 'function') {
      const index = this.middleware.indexOf(middleware);
      if (index > -1) {
        this.middleware.splice(index, 1);
        console.log(`⚙️ Removed middleware`);
      }
    }
  }

  // Execute middleware chain
  async executeMiddleware(context, next) {
    let index = 0;

    const dispatch = async (i) => {
      if (i <= index) {
        throw new Error('next() called multiple times');
      }

      index = i;

      const middleware = this.middleware[i];

      if (!middleware) {
        return next ? await next() : undefined;
      }

      return await middleware(context, () => dispatch(i + 1));
    };

    return await dispatch(0);
  }

  // Plugin discovery and loading
  async loadPlugin(pluginPath) {
    try {
      const plugin = require(pluginPath);
      const pluginName = plugin.name || pluginPath.split('/').pop();

      this.register(pluginName, plugin);
      return pluginName;
    } catch (error) {
      console.error(`❌ Failed to load plugin from '${pluginPath}':`, error.message);
      throw error;
    }
  }

  // Get plugin statistics
  getStats() {
    return {
      totalPlugins: this.plugins.size,
      totalHooks: this.hooks.size,
      totalMiddleware: this.middleware.length,
      pluginNames: Array.from(this.plugins.keys()),
      hookNames: Array.from(this.hooks.keys())
    };
  }
}

module.exports = PluginManager;
