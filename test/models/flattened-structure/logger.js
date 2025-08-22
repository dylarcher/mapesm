// Logging utility module

export const logger = {
  levels: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  },

  currentLevel: 1, // info level by default

  setLevel(level) {
    if (typeof level === 'string') {
      this.currentLevel = this.levels[level] !== undefined ? this.levels[level] : 1;
    } else if (typeof level === 'number') {
      this.currentLevel = level;
    }
  },

  formatMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    const levelStr = level.toUpperCase().padEnd(5);
    let formatted = `[${timestamp}] ${levelStr} ${message}`;

    if (data && Object.keys(data).length > 0) {
      formatted += ` ${JSON.stringify(data, null, 2)}`;
    }

    return formatted;
  },

  shouldLog(level) {
    return this.levels[level] >= this.currentLevel;
  },

  debug(message, data = {}) {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, data));
    }
  },

  info(message, data = {}) {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, data));
    }
  },

  warn(message, data = {}) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, data));
    }
  },

  error(message, data = {}) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, data));
    }
  },

  // Performance logging
  time(label) {
    console.time(label);
  },

  timeEnd(label) {
    console.timeEnd(label);
  },

  // Group logging for related operations
  group(label) {
    console.group(label);
  },

  groupEnd() {
    console.groupEnd();
  }
};
