#!/usr/bin/env node

/**
 * @fileoverview Command Line Interface for the module dependency visualizer tool.
 * Entry point that configures CLI options and coordinates the analysis process.
 * Uses Commander.js for argument parsing and chalk for colored console output.
 */

import chalk from "chalk";
import { Command } from "commander";
import { createRequire } from "module";
import { analyzeAndVisualize } from "../src/main.js";
import { DEFAULT_CLI_OPTIONS, MESSAGES } from "../src/services/constants.js";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");
const program = new Command();

/**
 * CLI program configuration for the codebase visualizer.
 * Sets up the main program with name, description, and version info.
 */
program
  .name("visualize")
  .description(
    chalk.cyan(
      "A CLI tool to visualize module dependencies as a hierarchical SVG diagram."
    )
  )
  .version(pkg.version, "-v, --version", "Output the current version");

/**
 * Main command configuration with arguments and options.
 * Defines the primary command interface including:
 * - Optional path argument (defaults to current directory)
 * - Output file option (auto-saves to tmp/ directory)
 * - Directory depth limit option
 * - Hidden files inclusion option
 *
 * @param {string} [path="."] - The path to the directory to analyze
 * @param {Object} options - Command line options
 * @param {string} options.output - Output file name (saved to tmp/ directory)
 * @param {number} options.depth - Maximum directory depth to analyze
 * @param {boolean} options.hidden - Whether to include hidden files and folders
 */
program
  .argument("[path]", "The path to the directory to analyze", ".")
  .option(
    "-o, --output <file>",
    "Specify the output file name (will be saved to tmp/ directory)",
    DEFAULT_CLI_OPTIONS.output
  )
  .option(
    "-d, --depth <level>",
    "Limit the analysis to a specific directory depth",
    (value) => parseInt(value, 10),
    DEFAULT_CLI_OPTIONS.depth
  )
  .option(
    "--hidden",
    "Include hidden files and folders (e.g. .git, node_modules)",
    DEFAULT_CLI_OPTIONS.hidden
  )
  .action(async (path, options) => {
    console.log(chalk.green.bold(MESSAGES.INITIALIZING));
    console.log(`${chalk.bold("Target Directory:")} ${path}`);
    console.log(`${chalk.bold("Output File:")} ${options.output}`);
    console.log(
      `${chalk.bold("Max Depth:")} ${options.depth === Infinity ? "Infinite" : options.depth}`
    );
    console.log(
      `${chalk.bold("Include Hidden:")} ${options.hidden ? "Yes" : "No"}`
    );
    console.log("");

    try {
      await analyzeAndVisualize(path, options);
    } catch (error) {
      console.error(chalk.red.bold(`\n${MESSAGES.ERROR}`));
      console.error(chalk.red(error.stack));
      process.exit(1);
    }
  });

program.parse(process.argv);
