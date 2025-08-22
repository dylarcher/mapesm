#!/usr/bin/env node

import chalk from "chalk";
import { Command } from "commander";
import { createRequire } from "module";
import { analyzeAndVisualize } from "../src/main.js";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

const program = new Command();

program
  .name("visualize")
  .description(
    chalk.cyan(
      "A CLI tool to visualize module dependencies as a hierarchical SVG diagram."
    )
  )
  .version(pkg.version, "-v, --version", "Output the current version");

program
  .argument("[path]", "The path to the directory to analyze", ".")
  .option(
    "-o, --output <file>",
    "Specify the output file name",
    "dependency-graph.svg"
  )
  .option(
    "-d, --depth <level>",
    "Limit the analysis to a specific directory depth",
    (value) => parseInt(value, 10),
    Infinity
  )
  .option(
    "--hidden",
    "Include hidden files and folders (e.g..git, node_modules)"
  )
  .action(async (path, options) => {
    console.log(chalk.green.bold("Codebase Visualizer Initializing..."));
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
      console.log(
        chalk.green.bold(
          `\n✔️  Success! Visualization saved to ${options.output}`
        )
      );
    } catch (error) {
      console.error(chalk.red.bold("\n✖️ An unexpected error occurred:"));
      console.error(chalk.red(error.stack));
      process.exit(1);
    }
  });

program.parse(process.argv);
