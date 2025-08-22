// Logging Plugin
const loggingPlugin = {
  name: 'logging',
  version: '1.0.0',
  description: 'Adds comprehensive logging capabilities',

  init(pluginManager) {
    console.log('🗂️ Initializing Logging Plugin');
    this.logs = [];
  },

  hooks: {
    'pre-init': function (data) {
      this.log('info', 'Application pre-initialization');
      return data;
    },

    'post-init': function (data) {
      this.log('info', 'Application post-initialization');
      return data;
    },

    'process-data': function (data) {
      this.log('debug', `Data processed: ${JSON.stringify(data)}`);
      return data;
    },

    'pre-save': function (data) {
      this.log('debug', `Preparing to save: ${data.key}`);
      return data;
    },

    'post-save': function (data) {
      this.log('info', `Data saved: ${data.key}`);
      return data;
    },

    'get-data': function (data) {
      this.log('debug', `Data retrieved: ${data.key}`);
      return data;
    },

    'shutdown': function (data) {
      this.log('info', 'Application shutting down');
      this.exportLogs();
      return data;
    }
  },

  middleware: async function (context, next) {
    const startTime = Date.now();

    loggingPlugin.log('info', `[MIDDLEWARE] Starting operation`);

    const result = await next();

    const duration = Date.now() - startTime;
    loggingPlugin.log('info', `[MIDDLEWARE] Operation completed in ${duration}ms`);

    return result;
  },

  log(level, message) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message, plugin: 'logging' };

    this.logs.push(logEntry);
    console.log(`📝 [${level.toUpperCase()}] ${message}`);
  },

  getLogs(level = null) {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  },

  exportLogs() {
    console.log('\n📊 LOG SUMMARY:');
    console.log(`Total logs: ${this.logs.length}`);

    const byLevel = this.logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {});

    console.log('By level:', byLevel);
  },

  cleanup() {
    console.log('🧹 Cleaning up Logging Plugin');
    this.logs = [];
  }
};

module.exports = loggingPlugin;
