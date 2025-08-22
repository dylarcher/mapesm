import { promises as fs } from "fs";
import path from "path";
import ts from "typescript";

const RELEVANT_EXTENSIONS = new Set([
  ".js",
  ".mjs",
  ".cjs",
  ".jsx",
  ".ts",
  ".tsx",
]);
const DEFAULT_IGNORE = new Set([
  "node_modules",
  ".git",
  ".vscode",
  "dist",
  "build",
]);

/**
 * Recursively finds all source files in a directory. [1, 2]
 * @param {string} dir - The directory to start searching from.
 * @param {object} options - CLI options.
 * @returns {Promise<string>} A list of absolute file paths.
 */
export async function findSourceFiles(dir, options) {
  const allFilePaths = [];
  const initialDepth = dir.split(path.sep).length;

  async function recurse(currentDir, currentDepth) {
    if (currentDepth - initialDepth >= options.depth) {
      return;
    }

    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const isHidden = entry.name.startsWith(".");

        if (!options.hidden && isHidden | DEFAULT_IGNORE.has(entry.name)) {
          continue;
        }

        if (entry.isDirectory()) {
          await recurse(fullPath, currentDepth + 1);
        } else if (
          entry.isFile() &&
          RELEVANT_EXTENSIONS.has(path.extname(entry.name))
        ) {
          allFilePaths.push(fullPath);
        }
      }
    } catch (err) {
      console.error(`Error reading directory: ${currentDir}`, err);
    }
  }

  await recurse(dir, initialDepth);
  return allFilePaths;
}

/**
 * Parses files using the TypeScript Compiler API to build a dependency graph. [3, 4]
 * @param {string} filePaths - An array of absolute file paths to parse.
 * @param {string} rootDir - The root directory of the project.
 * @returns {Promise<{graph: {nodes: Map, edges: Map}, tsProgram: ts.Program}>} The dependency graph and TS program instance.
 */
export async function parseFilesAndBuildGraph(filePaths, rootDir) {
  const graph = {
    nodes: new Map(), // Key: absolute path, Value: { path, name }
    edges: new Map(), // Key: source path, Value: Set of target paths
  };

  filePaths.forEach((filePath) => {
    graph.nodes.set(filePath, {
      path: filePath,
      name: path.basename(filePath),
    });
    graph.edges.set(filePath, new Set());
  });

  const tsconfigPath = ts.findConfigFile(
    rootDir,
    ts.sys.fileExists,
    "tsconfig.json"
  );
  const compilerOptions = tsconfigPath
    ? ts.parseJsonConfigFileContent(
        ts.readConfigFile(tsconfigPath, ts.sys.readFile).config,
        ts.sys,
        rootDir
      ).options
    : ts.getDefaultCompilerOptions();

  compilerOptions.allowJs = true; // Ensure JS files are processed

  const program = ts.createProgram(filePaths, compilerOptions);

  for (const sourceFile of program.getSourceFiles()) {
    if (filePaths.includes(sourceFile.fileName)) {
      ts.forEachChild(sourceFile, visit);
    }

    function visit(node) {
      let moduleSpecifier = null;

      if (ts.isImportDeclaration(node) | ts.isExportDeclaration(node)) {
        if (node.moduleSpecifier) {
          moduleSpecifier = node.moduleSpecifier
            .getText(sourceFile)
            .slice(1, -1);
        }
      } else if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword
      ) {
        const arg = node.arguments;
        if (ts.isStringLiteral(arg)) {
          moduleSpecifier = arg.text;
        }
      }

      if (moduleSpecifier) {
        const resolved = ts.resolveModuleName(
          moduleSpecifier,
          sourceFile.fileName,
          compilerOptions,
          ts.sys
        ).resolvedModule;

        if (resolved && graph.nodes.has(resolved.resolvedFileName)) {
          graph.edges.get(sourceFile.fileName).add(resolved.resolvedFileName);
        }
      }
      ts.forEachChild(node, visit);
    }
  }

  return { graph, tsProgram: program };
}

/**
 * Detects circular dependencies in the graph using Depth-First Search. [5, 6]
 * @param {{nodes: Map, edges: Map}} graph - The dependency graph.
 * @returns {string} An array of cycles, where each cycle is an array of file paths.
 */
export function detectCircularDependencies(graph) {
  const cycles = [];
  const visited = new Set(); // black set
  const recursionStack = new Set(); // gray set
  const pathStack = [];

  for (const nodePath of graph.nodes.keys()) {
    if (!visited.has(nodePath)) {
      dfs(nodePath);
    }
  }

  function dfs(currentNode) {
    visited.add(currentNode);
    recursionStack.add(currentNode);
    pathStack.push(currentNode);

    const neighbors = graph.edges.get(currentNode) || new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      } else if (recursionStack.has(neighbor)) {
        // Cycle detected
        const cycleStartIndex = pathStack.indexOf(neighbor);
        const cycle = pathStack.slice(cycleStartIndex);
        cycles.push(cycle);
      }
    }

    recursionStack.delete(currentNode);
    pathStack.pop();
  }

  // Filter out duplicate cycles
  const uniqueCycles = [];
  const seenCycles = new Set();
  for (const cycle of cycles) {
    const sortedCycle = [...cycle].sort().join(",");
    if (!seenCycles.has(sortedCycle)) {
      uniqueCycles.push(cycle);
      seenCycles.add(sortedCycle);
    }
  }

  return uniqueCycles;
}
