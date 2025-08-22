// Base Command Class - Foundation for all CLI commands
export class BaseCommand {
  constructor(name, description = '') {
    this.name = name;
    this.description = description;
    this.options = new Map();
    this.arguments = [];
    this.examples = [];
  }

  option(flags, description, defaultValue = null) {
    const option = this.parseOptionFlags(flags);
    this.options.set(option.name, {
      flags,
      description,
      defaultValue,
      short: option.short,
      long: option.long,
      required: flags.includes('<') && flags.includes('>')
    });
    return this;
  }

  argument(name, description, required = true) {
    this.arguments.push({
      name,
      description,
      required
    });
    return this;
  }

  example(command, description) {
    this.examples.push({ command, description });
    return this;
  }

  parseOptionFlags(flags) {
    const parts = flags.split(',').map(f => f.trim());
    let short = null;
    let long = null;
    let name = '';

    for (const part of parts) {
      if (part.startsWith('--')) {
        long = part.replace(/^--/, '').replace(/ .*$/, '');
        name = long.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      } else if (part.startsWith('-')) {
        short = part.replace(/^-/, '').replace(/ .*$/, '');
      }
    }

    return { short, long, name: name || long || short };
  }

  async execute(args, globalOptions = {}) {
    const parsed = this.parseArguments(args);

    if (parsed.help) {
      this.showHelp();
      return;
    }

    // Validate required arguments
    this.validateArguments(parsed.args);

    // Validate required options
    this.validateOptions(parsed.options);

    try {
      await this.run(parsed.args, parsed.options, globalOptions);
    } catch (error) {
      if (globalOptions.verbose) {
        console.error(error.stack);
      } else {
        console.error(`Error: ${error.message}`);
      }
      throw error;
    }
  }

  parseArguments(args) {
    const options = {};
    const positionalArgs = [];
    let showHelp = false;

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg === '--help' || arg === '-h') {
        showHelp = true;
        continue;
      }

      if (arg.startsWith('--')) {
        const optionName = arg.substring(2);
        const option = Array.from(this.options.values()).find(opt => opt.long === optionName);

        if (option) {
          if (args[i + 1] && !args[i + 1].startsWith('-')) {
            options[option.name] = args[++i];
          } else {
            options[option.name] = true;
          }
        } else {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
      } else if (arg.startsWith('-')) {
        const shortFlag = arg.substring(1);
        const option = Array.from(this.options.values()).find(opt => opt.short === shortFlag);

        if (option) {
          if (args[i + 1] && !args[i + 1].startsWith('-')) {
            options[option.name] = args[++i];
          } else {
            options[option.name] = true;
          }
        } else {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
      } else {
        positionalArgs.push(arg);
      }
    }

    // Apply default values
    for (const [name, option] of this.options) {
      if (!(name in options) && option.defaultValue !== null) {
        options[name] = option.defaultValue;
      }
    }

    return { args: positionalArgs, options, help: showHelp };
  }

  validateArguments(args) {
    const requiredArgs = this.arguments.filter(arg => arg.required);
    if (args.length < requiredArgs.length) {
      console.error(`Missing required arguments: ${requiredArgs.slice(args.length).map(arg => arg.name).join(', ')}`);
      this.showHelp();
      process.exit(1);
    }
  }

  validateOptions(options) {
    for (const [name, option] of this.options) {
      if (option.required && !(name in options)) {
        console.error(`Missing required option: --${option.long}`);
        this.showHelp();
        process.exit(1);
      }
    }
  }

  showHelp() {
    console.log(`Command: ${this.name}`);
    console.log(this.description);
    console.log('');

    // Usage
    let usage = `Usage: ${this.name}`;
    if (this.options.size > 0) {
      usage += ' [options]';
    }
    if (this.arguments.length > 0) {
      usage += ' ' + this.arguments.map(arg =>
        arg.required ? `<${arg.name}>` : `[${arg.name}]`
      ).join(' ');
    }
    console.log(usage);
    console.log('');

    // Arguments
    if (this.arguments.length > 0) {
      console.log('Arguments:');
      for (const arg of this.arguments) {
        const name = arg.required ? `<${arg.name}>` : `[${arg.name}]`;
        console.log(`  ${name.padEnd(20)} ${arg.description}`);
      }
      console.log('');
    }

    // Options
    if (this.options.size > 0) {
      console.log('Options:');
      for (const [name, option] of this.options) {
        console.log(`  ${option.flags.padEnd(20)} ${option.description}`);
      }
      console.log('');
    }

    // Examples
    if (this.examples.length > 0) {
      console.log('Examples:');
      for (const example of this.examples) {
        console.log(`  ${example.command}`);
        console.log(`    ${example.description}`);
        console.log('');
      }
    }
  }

  // Abstract method to be implemented by subclasses
  async run(args, options, globalOptions) {
    throw new Error('Command run method must be implemented');
  }
}
