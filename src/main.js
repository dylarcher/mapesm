import chalk from "chalk";
import { Spinner } from "cli-spinner";
import { promises as fs } from "fs";
import path from "path";
import {
  detectCircularDependencies,
  findSourceFiles,
  parseFilesAndBuildGraph,
} from "./parser.js";
import { generateSVG } from "./visualizer.js";

export async function analyzeAndVisualize(rootDir, options) {
  const spinner = new Spinner(
    chalk.blue("%s Analyzing codebase... This may take a moment.")
  );
  spinner.setSpinnerString(18);
  spinner.start();

  try {
    // 1. Find all relevant source files
    spinner.setSpinnerTitle(chalk.blue("%s Finding source files..."));
    const absolutePath = path.resolve(rootDir);
    const allFiles = await findSourceFiles(absolutePath, options);
    if (allFiles.length === 0) {
      throw new Error(
        `No source files found in "${rootDir}". Please specify a directory with JavaScript or TypeScript files.`
      );
    }

    // 2. Parse files, build dependency graph
    spinner.setSpinnerTitle(
      chalk.blue("%s Parsing files and building dependency graph...")
    );
    const { graph, tsProgram } = await parseFilesAndBuildGraph(
      allFiles,
      absolutePath
    );

    // 3. Detect circular dependencies
    spinner.setSpinnerTitle(
      chalk.blue("%s Detecting circular dependencies...")
    );
    const cycles = detectCircularDependencies(graph);

    // Stop spinner before logging results
    spinner.stop(true);

    if (cycles.length > 0) {
      console.log(
        chalk.yellow.bold(
          `\n⚠️  Found ${cycles.length} circular dependenc(ies):`
        )
      );
      cycles.forEach((cycle, index) => {
        console.log(chalk.yellow(`  Cycle ${index + 1}:`));
        const cyclePath = cycle
          .map((p) => `    -> ${path.relative(absolutePath, p)}`)
          .join("\n");
        console.log(chalk.red(cyclePath));
        console.log(chalk.red(`    -> ${path.relative(absolutePath, cycle)}`)); // Close the loop
      });
    } else {
      console.log(chalk.green("\n✅ No circular dependencies found."));
    }

    // 4. Generate the SVG visualization
    console.log(chalk.blue("\n🎨 Generating SVG visualization..."));
    const svgContent = generateSVG(graph, cycles, absolutePath, options);

    // 5. Write the SVG to a file
    await fs.writeFile(options.output, svgContent);
  } catch (error) {
    spinner.stop(true);
    throw error;
  }
}
