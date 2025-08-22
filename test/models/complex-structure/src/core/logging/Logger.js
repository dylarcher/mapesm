class Logger {
  constructor(config = {}) {
    this.level = config.level || 'info';
    this.file = config.file || null;
  }

  log(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta
    };

    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, meta);

    // In a real implementation, you would write to file here
    if (this.file) {
      // writeToFile(this.file, logEntry);
    }
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  debug(message, meta = {}) {
    if (this.level === 'debug') {
      this.log('debug', message, meta);
    }
  }
}

module.exports = Logger;
