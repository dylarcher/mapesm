/**
 * @fileoverview File analysis and dependency parsing module.
 * Handles file discovery, TypeScript Compiler API integration, and circular dependency detection.
 * Provides core functionality for building and analyzing module dependency graphs.
 */

import { promises as fs } from "fs";
import path from "path";
import ts from "typescript";
import { DEFAULT_IGNORE, RELEVANT_EXTENSIONS } from "../CONF.js";

/**
 * Recursively finds all source files in a directory.
 * Traverses directory structure while respecting depth limits and hidden file preferences.
 * Filters files based on relevant extensions and ignore patterns.
 *
 * @param {string} dir - The directory to start searching from
 * @param {Object} options - CLI options containing depth and hidden flags
 * @param {number} options.depth - Maximum directory depth to search
 * @param {boolean} options.hidden - Whether to include hidden files and directories
 * @returns {Promise<string[]>} A promise that resolves to a list of absolute file paths
 */
export async function findSourceFiles(dir, options) {
  const allFilePaths = [];
  const initialDepth = dir.split(path.sep).length;

  /**
   * Recursively traverses directories to find relevant source files.
   * Respects depth limits and hidden file preferences from CLI options.
   *
   * @param {string} currentDir - Current directory being processed
   * @param {number} currentDepth - Current depth level in the directory tree
   */
  async function recurse(currentDir, currentDepth) {
    if (currentDepth - initialDepth >= options.depth) {
      return;
    }

    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const isHidden = entry.name.startsWith(".");

        // Skip hidden files/directories and ignored directories based on CLI options
        if (!options.hidden && isHidden | DEFAULT_IGNORE.has(entry.name)) {
          continue;
        }

        if (entry.isDirectory()) {
          await recurse(fullPath, currentDepth + 1);
        } else if (
          entry.isFile() &&
          RELEVANT_EXTENSIONS.has(path.extname(entry.name))
        ) {
          // Only include files with relevant extensions (JS/TS)
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
 * Parses files using the TypeScript Compiler API to build a dependency graph.
 * Creates a program instance and analyzes import/export statements to map dependencies.
 * Handles both TypeScript and JavaScript files with proper module resolution.
 *
 * @param {string[]} filePaths - An array of absolute file paths to parse
 * @param {string} rootDir - The root directory of the project
 * @returns {Promise<{graph: {nodes: Map<string, Object>, edges: Map<string, Set<string>>}, tsProgram: ts.Program}>}
 *   A promise that resolves to an object containing the dependency graph and TypeScript program instance
 */
export async function parseFilesAndBuildGraph(filePaths, rootDir) {
  const graph = {
    nodes: new Map(), // Key: absolute path, Value: { path, name }
    edges: new Map(), // Key: source path, Value: Set of target paths
  };

  // Initialize graph nodes for all discovered files
  filePaths.forEach((filePath) => {
    graph.nodes.set(filePath, {
      path: filePath,
      name: path.basename(filePath),
    });
    graph.edges.set(filePath, new Set());
  });

  // Load TypeScript configuration or use defaults
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

  compilerOptions.allowJs = true; // Ensure JS files are processed alongside TS files

  const program = ts.createProgram(filePaths, compilerOptions);

  // Analyze each source file for import/export statements
  for (const sourceFile of program.getSourceFiles()) {
    if (filePaths.includes(sourceFile.fileName)) {
      ts.forEachChild(sourceFile, visit);
    }

    /**
     * Visitor function to process AST nodes and extract module dependencies.
     * Handles import declarations, export declarations, and dynamic imports.
     *
     * @param {ts.Node} node - The AST node to process
     */
    function visit(node) {
      let moduleSpecifier = null;

      // Handle static import/export declarations
      if (ts.isImportDeclaration(node) | ts.isExportDeclaration(node)) {
        if (node.moduleSpecifier) {
          moduleSpecifier = node.moduleSpecifier
            .getText(sourceFile)
            .slice(1, -1);
        }
      } else if (
        // Handle dynamic imports
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword
      ) {
        const arg = node.arguments;
        if (ts.isStringLiteral(arg)) {
          moduleSpecifier = arg.text;
        }
      }

      // Resolve module path and add to dependency graph if it exists in our file set
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
 * Detects circular dependencies in the graph using Depth-First Search algorithm.
 * Implements a DFS-based cycle detection with three-color approach: white (unvisited),
 * gray (in recursion stack), and black (completely processed).
 *
 * @param {{nodes: Map<string, Object>, edges: Map<string, Set<string>>}} graph - The dependency graph
 * @returns {string[][]} An array of cycles, where each cycle is an array of file paths forming a circular dependency
 */
export function detectCircularDependencies(graph) {
  const cycles = [];
  const visited = new Set(); // black set - completely processed nodes
  const recursionStack = new Set(); // gray set - nodes currently in DFS recursion stack
  const pathStack = []; // tracks the current path for cycle reconstruction

  // Start DFS from each unvisited node to ensure all components are checked
  for (const nodePath of graph.nodes.keys()) {
    if (!visited.has(nodePath)) {
      dfs(nodePath);
    }
  }

  /**
   * Depth-first search implementation for cycle detection.
   * Uses three-color approach to track node states during traversal.
   *
   * @param {string} currentNode - The current node being processed
   */
  function dfs(currentNode) {
    visited.add(currentNode);
    recursionStack.add(currentNode);
    pathStack.push(currentNode);

    const neighbors = graph.edges.get(currentNode) || new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        // White node - continue DFS
        dfs(neighbor);
      } else if (recursionStack.has(neighbor)) {
        // Gray node - cycle detected, reconstruct the cycle path
        const cycleStartIndex = pathStack.indexOf(neighbor);
        const cycle = pathStack.slice(cycleStartIndex);
        cycles.push(cycle);
      }
    }

    recursionStack.delete(currentNode);
    pathStack.pop();
  }

  // Filter out duplicate cycles by normalizing and deduplicating
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
