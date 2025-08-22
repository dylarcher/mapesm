#!/usr/bin/env node

// CLI Application Entry Point
import { BuildCommand } from '../commands/BuildCommand.js';
import { DeployCommand } from '../commands/DeployCommand.js';
import { InitCommand } from '../commands/InitCommand.js';
import { ServeCommand } from '../commands/ServeCommand.js';
import { ConfigManager } from '../config/ConfigManager.js';
import { Command } from '../lib/Commander.js';
import { Logger } from '../utils/Logger.js';

const logger = new Logger();
const config = new ConfigManager();

async function main() {
  try {
    const program = new Command('mycli')
      .version('1.0.0')
      .description('A powerful CLI tool for modern development workflows');

    // Global options
    program
      .globalOption('-v, --verbose', 'Enable verbose output')
      .globalOption('-q, --quiet', 'Suppress non-error output')
      .globalOption('--config <path>', 'Path to config file')
      .globalOption('--no-color', 'Disable colored output');

    // Register commands
    program.addCommand(new InitCommand(config, logger));
    program.addCommand(new BuildCommand(config, logger));
    program.addCommand(new DeployCommand(config, logger));
    program.addCommand(new ServeCommand(config, logger));

    // Parse arguments and execute
    await program.parse(process.argv);

  } catch (error) {
    logger.error('CLI execution failed:', error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error.message);
  process.exit(1);
});

main();
