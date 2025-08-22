// Commander - Core CLI framework
import { EventEmitter } from 'events';
import { BaseCommand } from './BaseCommand.js';

export class Command extends EventEmitter {
  constructor(name) {
    super();
    this.name = name;
    this.commands = new Map();
    this.globalOptions = new Map();
    this._version = '';
    this._description = '';
  }

  version(ver) {
    this._version = ver;
    return this;
  }

  description(desc) {
    this._description = desc;
    return this;
  }

  globalOption(flags, description, defaultValue = null) {
    const option = this.parseOptionFlags(flags);
    this.globalOptions.set(option.name, {
      flags,
      description,
      defaultValue,
      short: option.short,
      long: option.long
    });
    return this;
  }

  addCommand(command) {
    if (!(command instanceof BaseCommand)) {
      throw new Error('Command must be an instance of BaseCommand');
    }

    this.commands.set(command.name, command);
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

  async parse(argv) {
    const args = argv.slice(2);

    if (args.length === 0) {
      this.showHelp();
      return;
    }

    // Check for global options first
    const { command: commandName, options: globalOpts, args: remainingArgs } = this.parseGlobalOptions(args);

    if (globalOpts.version) {
      console.log(this._version);
      return;
    }

    if (globalOpts.help || !commandName) {
      this.showHelp();
      return;
    }

    // Find and execute command
    const command = this.commands.get(commandName);
    if (!command) {
      console.error(`Unknown command: ${commandName}`);
      this.showAvailableCommands();
      process.exit(1);
    }

    try {
      await command.execute(remainingArgs, globalOpts);
    } catch (error) {
      console.error(`Command '${commandName}' failed:`, error.message);
      process.exit(1);
    }
  }

  parseGlobalOptions(args) {
    const options = {};
    const remainingArgs = [];
    let commandName = null;

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg.startsWith('--')) {
        const optionName = arg.substring(2);
        const option = Array.from(this.globalOptions.values()).find(opt => opt.long === optionName);

        if (option) {
          if (args[i + 1] && !args[i + 1].startsWith('-')) {
            options[option.name] = args[++i];
          } else {
            options[option.name] = true;
          }
        } else {
          remainingArgs.push(arg);
        }
      } else if (arg.startsWith('-')) {
        const shortFlag = arg.substring(1);
        const option = Array.from(this.globalOptions.values()).find(opt => opt.short === shortFlag);

        if (option) {
          if (args[i + 1] && !args[i + 1].startsWith('-')) {
            options[option.name] = args[++i];
          } else {
            options[option.name] = true;
          }
        } else {
          remainingArgs.push(arg);
        }
      } else {
        if (!commandName) {
          commandName = arg;
        } else {
          remainingArgs.push(arg);
        }
      }
    }

    return { command: commandName, options, args: remainingArgs };
  }

  showHelp() {
    console.log(`${this.name} v${this._version}`);
    console.log(this._description);
    console.log('');
    console.log('Usage:');
    console.log(`  ${this.name} [options] <command> [command-options]`);
    console.log('');

    if (this.globalOptions.size > 0) {
      console.log('Global Options:');
      for (const [name, option] of this.globalOptions) {
        console.log(`  ${option.flags.padEnd(20)} ${option.description}`);
      }
      console.log('');
    }

    this.showAvailableCommands();
  }

  showAvailableCommands() {
    if (this.commands.size > 0) {
      console.log('Available Commands:');
      for (const [name, command] of this.commands) {
        console.log(`  ${name.padEnd(15)} ${command.description}`);
      }
      console.log('');
      console.log(`Use '${this.name} <command> --help' for more information about a command.`);
    }
  }
}
