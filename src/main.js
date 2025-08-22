/**
 * @fileoverview Main orchestration module for the codebase visualizer.
 * Coordinates the entire analysis pipeline from file discovery through SVG generation.
 * Handles user feedback via spinners and manages output to the tmp/ directory.
 */

import chalk from "chalk";
import { promises as fs } from "fs";
import path from "path";
import { MESSAGES } from "./CONF.js";
import {
  detectCircularDependencies,
  findSourceFiles,
  parseFilesAndBuildGraph,
} from "./services/consumer.js";
import { generateSVG } from "./services/visualizer.js";
import {
  ensureOutputDirectory,
  formatCyclePath,
  validateSourceFiles
} from "./utils.js";

/**
 * Analyzes a codebase and generates an SVG visualization of its dependency graph.
 * Orchestrates the complete analysis pipeline:
 * 1. File discovery and validation
 * 2. Dependency graph construction via TypeScript Compiler API
 * 3. Circular dependency detection using DFS algorithm
 * 4. SVG visualization generation
 * 5. Output file creation in tmp/ directory
 *
 * Ensures all output is saved to tmp/ directory regardless of user input path.
 * Provides progress feedback via CLI spinners and detailed console output.
 *
 * @param {string} rootDir - The root directory to analyze
 * @param {Object} options - Configuration options
 * @param {string} options.output - Output file path for the SVG
 * @param {number} options.depth - Maximum directory depth to analyze
 * @param {boolean} options.hidden - Whether to include hidden files and directories
 * @returns {Promise<void>} Promise that resolves when the analysis and visualization are complete
 */
export async function analyzeAndVisualize(rootDir, options) {
  // Ensure output goes to tmp/ directory
  const outputPath = options.output.startsWith('tmp/')
    ? options.output
    : path.join('tmp', path.basename(options.output));

  // Update options with the corrected path
  const updatedOptions = { ...options, output: outputPath };

  const { Spinner } = await import("cli-spinner");
  const spinner = new Spinner(chalk.blue(`%s ${MESSAGES.FINDING_FILES}`));
  spinner.setSpinnerString(18);
  spinner.start();

  try {
    // 1. Find all relevant source files
    spinner.setSpinnerTitle(chalk.blue(`%s ${MESSAGES.FINDING_FILES}`));
    const absolutePath = path.resolve(rootDir);
    const allFiles = await findSourceFiles(absolutePath, updatedOptions);
    validateSourceFiles(allFiles, rootDir);

    // 2. Parse files, build dependency graph using TypeScript Compiler API
    spinner.setSpinnerTitle(chalk.blue(`%s ${MESSAGES.PARSING_FILES}`));
    const { graph } = await parseFilesAndBuildGraph(allFiles, absolutePath);

    // 3. Detect circular dependencies using DFS algorithm
    spinner.setSpinnerTitle(chalk.blue(`%s ${MESSAGES.DETECTING_CYCLES}`));
    const cycles = detectCircularDependencies(graph);

    // Stop spinner before logging results
    spinner.stop(true);

    // Report circular dependencies with detailed path information
    if (cycles.length > 0) {
      console.log(
        chalk.yellow.bold(
          `\n⚠️  ${MESSAGES.CYCLES_FOUND.replace('{count}', cycles.length)}`
        )
      );
      cycles.forEach((cycle, index) => {
        console.log(chalk.yellow(`  Cycle ${index + 1}:`));
        const cyclePath = formatCyclePath(cycle, absolutePath);
        console.log(chalk.red(cyclePath));
        console.log(chalk.red(`    -> ${path.relative(absolutePath, cycle[0])}`)); // Close the loop
      });
    } else {
      console.log(chalk.green(`\n${MESSAGES.NO_CYCLES}`));
    }

    // 4. Generate the SVG visualization with hierarchical layout
    console.log(chalk.blue(`\n${MESSAGES.GENERATING_SVG}`));
    const svgContent = generateSVG(graph, cycles, absolutePath, updatedOptions);

    // 5. Ensure output directory exists and write the SVG file
    await ensureOutputDirectory(updatedOptions.output);
    await fs.writeFile(updatedOptions.output, svgContent);

    console.log(
      chalk.green.bold(`\n${MESSAGES.SUCCESS} ${updatedOptions.output}`)
    );
  } catch (error) {
    spinner.stop(true);
    throw error;
  }
}
