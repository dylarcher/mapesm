// Plugin Architecture Demo
const Application = require('./core/Application');
const loggingPlugin = require('./plugins/loggingPlugin');
const validationPlugin = require('./plugins/validationPlugin');
const cachingPlugin = require('./plugins/cachingPlugin');

async function demonstratePluginArchitecture() {
  console.log('=== Plugin Architecture Demo ===\n');
  console.log('This demo shows how plugins can extend core application functionality');
  console.log('through hooks, middleware, and dynamic loading.\n');

  const app = new Application();

  try {
    console.log('1. Loading Plugins\n');

    // Load plugins
    app.loadPlugin('logging', loggingPlugin);
    app.loadPlugin('validation', validationPlugin);
    app.loadPlugin('caching', cachingPlugin);

    // Initialize application
    await app.initialize();

    console.log('\n2. Plugin Statistics\n');
    const stats = app.getPluginStats();
    console.log('📊 Plugin System Stats:');
    console.log(`   - Total plugins: ${stats.totalPlugins}`);
    console.log(`   - Total hooks: ${stats.totalHooks}`);
    console.log(`   - Total middleware: ${stats.totalMiddleware}`);
    console.log(`   - Loaded plugins: ${stats.pluginNames.join(', ')}`);
    console.log(`   - Available hooks: ${stats.hookNames.join(', ')}`);

    console.log('\n3. Testing Core Functionality with Plugins\n');

    // Test data processing (will trigger logging and validation)
    const processedData = await app.processData({
      type: 'user',
      name: 'John Doe',
      email: 'john@example.com'
    });
    console.log('📊 Processed data:', JSON.stringify(processedData, null, 2));

    console.log('\n4. Testing Data Storage with Validation\n');

    // Test valid data
    try {
      await app.saveData('user-123', {
        name: 'Alice Johnson',
        email: 'alice@example.com'
      });
    } catch (error) {
      console.log(`❌ Save failed: ${error.message}`);
    }

    // Test invalid data (should fail validation)
    try {
      await app.saveData('email-456', 'invalid-email');
    } catch (error) {
      console.log(`❌ Save failed: ${error.message}`);
    }

    console.log('\n5. Testing Caching Functionality\n');

    // Save some data
    await app.saveData('config-setting', 'production');

    // Retrieve data (first time - cache miss)
    let result1 = await app.getData('config-setting');
    console.log('First retrieval:', result1);

    // Retrieve data again (second time - cache hit)
    let result2 = await app.getData('config-setting');
    console.log('Second retrieval:', result2);

    console.log('\n6. Plugin-specific Operations\n');

    // Get caching stats
    const cachingPlugin = app.pluginManager.getPlugin('caching');
    console.log('💾 Cache stats:', JSON.stringify(cachingPlugin.getStats(), null, 2));

    // Get validation rules
    const validationPlugin = app.pluginManager.getPlugin('validation');
    console.log('🔍 Validation rules:', validationPlugin.getAllRules());

    // Get recent logs
    const loggingPluginInstance = app.pluginManager.getPlugin('logging');
    const recentLogs = loggingPluginInstance.getLogs('info').slice(-3);
    console.log('📝 Recent info logs:', recentLogs.length);

    console.log('\n7. Dynamic Plugin Management\n');

    // Create a simple runtime plugin
    const metricsPlugin = {
      name: 'metrics',
      version: '1.0.0',

      init() {
        console.log('📈 Initializing Metrics Plugin');
        this.metrics = { operationCount: 0 };
      },

      hooks: {
        'process-data': function (data) {
          this.metrics.operationCount++;
          console.log(`📈 Operation count: ${this.metrics.operationCount}`);
          return data;
        }
      },

      getMetrics() {
        return this.metrics;
      }
    };

    // Load the new plugin
    app.loadPlugin('metrics', metricsPlugin);

    // Test with new plugin
    await app.processData({ type: 'test', value: 'dynamic plugin test' });

    // Get metrics
    const loadedMetricsPlugin = app.pluginManager.getPlugin('metrics');
    console.log('📈 Metrics:', loadedMetricsPlugin.getMetrics());

    console.log('\n8. Plugin Cleanup\n');

    // Unload the metrics plugin
    app.unloadPlugin('metrics');

    // Final statistics
    const finalStats = app.getPluginStats();
    console.log('📊 Final plugin count:', finalStats.totalPlugins);

    console.log('\n9. Application Shutdown\n');
    await app.shutdown();

    console.log('\n✅ Plugin Architecture Demo Complete!\n');
    console.log('Key features demonstrated:');
    console.log('- Dynamic plugin loading and unloading');
    console.log('- Hook system for extending functionality');
    console.log('- Middleware chain for cross-cutting concerns');
    console.log('- Plugin lifecycle management (init/cleanup)');
    console.log('- Plugin communication and data sharing');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.error(error.stack);
  }
}

// Run the demonstration
demonstratePluginArchitecture().catch(console.error);
