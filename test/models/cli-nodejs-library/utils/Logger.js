// Logger Utility - Enhanced logging with colors and levels
export class Logger {
  constructor(options = {}) {
    this.level = options.level || 'info';
    this.colors = options.colors !== false;
    this.timestamps = options.timestamps || false;

    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      verbose: 4
    };

    this.colorCodes = {
      reset: '\x1b[0m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      gray: '\x1b[90m'
    };
  }

  shouldLog(level) {
    return this.levels[level] <= this.levels[this.level];
  }

  formatMessage(level, message, meta = {}) {
    let formatted = '';

    if (this.timestamps) {
      formatted += `[${new Date().toISOString()}] `;
    }

    if (this.colors) {
      const color = this.getColorForLevel(level);
      formatted += `${color}${level.toUpperCase()}${this.colorCodes.reset} `;
    } else {
      formatted += `${level.toUpperCase()} `;
    }

    formatted += message;

    if (Object.keys(meta).length > 0) {
      formatted += ` ${JSON.stringify(meta)}`;
    }

    return formatted;
  }

  getColorForLevel(level) {
    const colors = {
      error: this.colorCodes.red,
      warn: this.colorCodes.yellow,
      info: this.colorCodes.blue,
      debug: this.colorCodes.gray,
      verbose: this.colorCodes.magenta,
      success: this.colorCodes.green
    };

    return colors[level] || this.colorCodes.reset;
  }

  error(message, meta) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, meta));
    }
  }

  warn(message, meta) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, meta));
    }
  }

  info(message, meta) {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, meta));
    }
  }

  debug(message, meta) {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, meta));
    }
  }

  verbose(message, meta) {
    if (this.shouldLog('verbose')) {
      console.log(this.formatMessage('verbose', message, meta));
    }
  }

  success(message, meta) {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('success', message, meta));
    }
  }

  // Utility methods for CLI operations
  startSpinner(message) {
    if (!this.shouldLog('info')) return null;

    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let index = 0;

    const spinner = setInterval(() => {
      process.stdout.write(`\r${frames[index]} ${message}`);
      index = (index + 1) % frames.length;
    }, 100);

    return {
      stop: (finalMessage) => {
        clearInterval(spinner);
        process.stdout.write(`\r${finalMessage || message}\n`);
      }
    };
  }

  progress(current, total, message = '') {
    if (!this.shouldLog('info')) return;

    const percentage = Math.round((current / total) * 100);
    const barLength = 30;
    const filledLength = Math.round((barLength * current) / total);

    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);

    process.stdout.write(`\r[${bar}] ${percentage}% ${message}`);

    if (current === total) {
      process.stdout.write('\n');
    }
  }

  table(data, headers) {
    if (!this.shouldLog('info')) return;

    // Simple table implementation
    console.table(data);
  }

  setLevel(level) {
    this.level = level;
  }

  enableColors() {
    this.colors = true;
  }

  disableColors() {
    this.colors = false;
  }
}
