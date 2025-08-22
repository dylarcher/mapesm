// Console Logger Adapter
class ConsoleLogger {
  constructor() {
    this.name = 'ConsoleLogger';
  }

  info(message, meta = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] INFO: ${message}`, meta);
  }

  error(message, error = null) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR: ${message}`, error);
  }

  warn(message, meta = {}) {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] WARN: ${message}`, meta);
  }

  debug(message, meta = {}) {
    const timestamp = new Date().toISOString();
    console.debug(`[${timestamp}] DEBUG: ${message}`, meta);
  }
}

module.exports = ConsoleLogger;
