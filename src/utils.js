/**
 * @fileoverview Utility functions for data processing, file operations, and visualization helpers.
 * Provides reusable functions for color assignment, hierarchical structure building,
 * SVG dimension calculations, dependency cycle analysis, and file system operations.
 */

import path from "path";
import {
  COLOR_PALETTE,
  FILE_TYPE_MAPPINGS
} from "./CONF.js";

/**
 * Determines the file type based on the filename extension.
 * Checks against predefined file type mappings to categorize files.
 *
 * @param {string} filename - The filename to analyze
 * @returns {string} The file type ('directory', 'script', 'style', 'image', 'multimedia', or 'default')
 */
export function getFileType(filename) {
  if (!filename) return "directory";

  const ext = path.extname(filename).toLowerCase();

  // Check each file type mapping
  for (const [fileType, extensions] of Object.entries(FILE_TYPE_MAPPINGS)) {
    if (extensions.includes(ext)) {
      return fileType;
    }
  }

  // Config and data files get default shape
  return "default";
}

/**
 * Gets the color for a node based on its second-level directory assignment.
 * Colors are now consistent within each directory (no depth variation).
 * Nodes furthest from root get priority for color application.
 *
 * @param {number} depth - The depth level of the node (0 = root, 1 = first level, etc.)
 * @param {number} maxDepth - The maximum depth in the tree (used to determine priority)
 * @param {string} [fileType="directory"] - The file type of the node
 * @param {string} [nodePath=""] - The full path of the node for directory analysis
 * @param {string} [rootDir=""] - The root directory path
 * @param {Object} [directoryColorMap={}] - Dynamic directory to single color mapping
 * @returns {string} The hex color code
 */
export function getColorByDepth(depth, maxDepth, fileType = "directory", nodePath = "", rootDir = "", directoryColorMap = {}) {
  let paletteKey = "default";

  // For second-level directories and deeper, determine color based on second-level directory
  if (depth > 0 && nodePath && rootDir) {
    const relativePath = path.relative(rootDir, nodePath);
    const pathParts = relativePath.split(path.sep);

    if (pathParts.length > 0 && pathParts[0] !== '.') {
      const secondLevelDir = pathParts[0];
      paletteKey = directoryColorMap[secondLevelDir] || "default";
    }
  }

  // Apply color with priority to nodes furthest from origin
  const color = COLOR_PALETTE[paletteKey] || COLOR_PALETTE.default;

  // Add opacity based on distance from root (furthest nodes get full opacity)
  const opacity = Math.max(0.4, depth / Math.max(maxDepth, 1));

  // Convert hex to rgba for opacity support
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Extracts second-level directory names from a node map.
 * Identifies all unique directory names at depth 1 from the root for dynamic color mapping.
 * Only includes actual directories, not individual files at the root level.
 *
 * @param {Map<string, Object>} nodeMap - Map of file paths to node data
 * @param {string} rootDir - The root directory path
 * @returns {string[]} Array of unique second-level directory names
 */
export function extractSecondLevelDirectories(nodeMap, rootDir) {
  const secondLevelDirs = new Set();

  for (const [nodePath, nodeData] of nodeMap.entries()) {
    const relativePath = path.relative(rootDir, nodePath);
    const pathParts = relativePath.split(path.sep);

    // Only consider paths with at least one directory level
    // And only add if it's a directory or if the first part represents a directory containing files
    if (pathParts.length > 1 && pathParts[0] !== '.' && pathParts[0] !== '') {
      secondLevelDirs.add(pathParts[0]);
    } else if (pathParts.length === 1 && nodeData.isDirectory) {
      // Also include direct child directories
      secondLevelDirs.add(pathParts[0]);
    }
  }

  return Array.from(secondLevelDirs).sort(); // Sort for consistent color assignment
}/**
 * Converts a flat file path list into a hierarchical tree structure.
 * Builds a tree by parsing relative paths and creating nested directory structures.
 * Calculates maximum depth for the entire tree structure.
 *
 * @param {Map<string, Object>} nodeMap - Map of file paths to node data
 * @param {string} rootDir - The root directory path
 * @returns {Object} Object containing the root node and maxDepth
 * @returns {Object} returns.root - The root node of the hierarchical tree
 * @returns {number} returns.maxDepth - The maximum depth found in the tree
 */
export function buildHierarchicalStructure(nodeMap, rootDir) {
  const root = {
    name: path.basename(rootDir),
    children: [],
    isDirectory: true,
    path: rootDir,
    fileType: "directory",
    depth: 0,
  };

  const hierarchyMap = new Map();
  hierarchyMap.set(rootDir, root);

  // First pass: calculate max depth
  let maxDepth = 0;
  for (const nodePath of nodeMap.keys()) {
    const relativePath = path.relative(rootDir, nodePath);
    const depth = relativePath.split(path.sep).length;
    maxDepth = Math.max(maxDepth, depth);
  }

  // Build the hierarchy by traversing each file path
  for (const nodePath of nodeMap.keys()) {
    const relativePath = path.relative(rootDir, nodePath);
    const parts = relativePath.split(path.sep);
    let currentLevel = root;

    parts.forEach((part, i) => {
      const isLastPart = i === parts.length - 1;
      const currentPath = path.join(rootDir, ...parts.slice(0, i + 1));
      const currentDepth = i + 1;

      let childNode = hierarchyMap.get(currentPath);
      if (!childNode) {
        childNode = {
          name: part,
          children: isLastPart ? undefined : [],
          isDirectory: !isLastPart,
          path: currentPath,
          fileType: isLastPart ? getFileType(part) : "directory",
          depth: currentDepth,
        };
        currentLevel.children.push(childNode);
        hierarchyMap.set(currentPath, childNode);
      }
      currentLevel = childNode;
    });
  }

  return { root, maxDepth };
}

/**
 * Calculates SVG dimensions based on content and aspect ratio.
 * Determines initial canvas size for the visualization with extra space for half-circle layout.
 *
 * @param {number} maxDepth - Maximum depth of the tree
 * @param {number} aspectRatio - Desired aspect ratio
 * @param {Object} margin - Margin configuration
 * @param {number} defaultWidth - Default width to start with
 * @returns {Object} Object containing width, height, contentWidth, and contentHeight
 */
export function calculateSVGDimensions(maxDepth, aspectRatio, margin, defaultWidth) {
  // Increase default width for half-circle layout which needs more horizontal space
  let width = Math.max(defaultWidth, 1800); // Minimum width increased
  let height = width / aspectRatio;

  const contentWidth = width - margin.left - margin.right;
  const contentHeight = height - margin.top - margin.bottom;

  return { width, height, contentWidth, contentHeight };
}

/**
 * Calculates optimal SVG dimensions based on node bounds with intelligent spacing optimization.
 * Automatically adjusts dimensions to minimize whitespace while maintaining readability.
 *
 * @param {Object} bounds - The bounds object containing minX, maxX, minY, maxY
 * @param {boolean} includeLegend - Whether to include space for the legend
 * @returns {Object} Width and height for the SVG canvas
 */
export function adjustDimensionsForContent(bounds, includeLegend = false) {
  // Calculate content dimensions from bounds
  const contentWidth = Math.abs(bounds.maxX - bounds.minX);
  const contentHeight = Math.abs(bounds.maxY - bounds.minY);

  // Apply smart minimum dimensions based on content
  const minWidth = Math.max(400, contentWidth * 1.1); // 10% buffer minimum
  const minHeight = Math.max(300, contentHeight * 1.1);

  // Calculate base dimensions with optimized spacing
  let width = Math.max(minWidth, contentWidth + 60); // Minimal horizontal padding
  let height = Math.max(minHeight, contentHeight + 60); // Minimal vertical padding

  // Add legend space only if needed and requested
  if (includeLegend) {
    const legendWidth = 280; // Fixed legend width
    const legendHeight = 150; // Estimated legend height

    // Only add legend space if content is large enough to warrant it
    if (width > 600) {
      width += legendWidth;
    } else {
      // For smaller graphs, stack legend vertically
      height += legendHeight;
    }
  }

  // Apply maximum reasonable dimensions to prevent extremely large outputs
  width = Math.min(width, 4000);
  height = Math.min(height, 3000);

  // Ensure minimum usable dimensions
  width = Math.max(width, 500);
  height = Math.max(height, 400);

  return {
    width: Math.round(width),
    height: Math.round(height),
    // Return optimization info for debugging
    optimized: {
      contentWidth: Math.round(contentWidth),
      contentHeight: Math.round(contentHeight),
      paddingRatio: Math.round(((width * height) - (contentWidth * contentHeight)) / (width * height) * 100),
      densityScore: Math.round((contentWidth * contentHeight) / (width * height) * 100)
    }
  };
}

/**
 * Identifies edges that are part of circular dependencies.
 * Creates a set of edge identifiers for highlighting cycles in the visualization.
 * Considers both directions for proper cycle highlighting.
 *
 * @param {Array<Array<string>>} cycles - Array of cycles, each cycle is an array of file paths
 * @returns {Set<string>} Set of edge identifiers in the format "source->target"
 */
export function getCycleEdges(cycles) {
  const cycleEdges = new Set();

  cycles.forEach((cycle) => {
    for (let i = 0; i < cycle.length; i++) {
      const source = cycle[i];
      const target = cycle[(i + 1) % cycle.length];
      cycleEdges.add(`${source}->${target}`);
      cycleEdges.add(`${target}->${source}`); // Consider both directions for highlighting
    }
  });

  return cycleEdges;
}

/**
 * Creates dependency links from the graph edges.
 * Converts the raw graph edge data into link objects suitable for visualization rendering.
 *
 * @param {Map<string, Set<string>>} graphEdges - Map of source paths to sets of target paths
 * @param {Map<string, Object>} nodeMap - Map of file paths to node data
 * @returns {Array<Object>} Array of dependency link objects with source and target properties
 */
export function createDependencyLinks(graphEdges, nodeMap) {
  const dependencyLinks = [];

  for (const [sourcePath, targets] of graphEdges.entries()) {
    for (const targetPath of targets) {
      const sourceNode = nodeMap.get(sourcePath);
      const targetNode = nodeMap.get(targetPath);
      if (sourceNode && targetNode) {
        dependencyLinks.push({ source: sourceNode, target: targetNode });
      }
    }
  }

  return dependencyLinks;
}

/**
 * Ensures the output directory exists.
 * Creates the directory structure if it doesn't exist, handling the case
 * where the directory might already exist.
 *
 * @param {string} outputPath - The output file path
 * @returns {Promise<string>} The directory path that was created or verified
 */
export async function ensureOutputDirectory(outputPath) {
  const { promises: fs } = await import("fs");
  const outputDir = path.dirname(outputPath);

  try {
    await fs.mkdir(outputDir, { recursive: true });
  } catch (error) {
    // Directory might already exist, which is fine
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }

  return outputDir;
}

/**
 * Formats cycle output for display.
 * Converts absolute file paths in a cycle to relative paths for cleaner console output.
 *
 * @param {Array<string>} cycle - Array of file paths in the cycle
 * @param {string} rootDir - The root directory path for relative path calculation
 * @returns {string} Formatted cycle path string with arrow indicators
 */
export function formatCyclePath(cycle, rootDir) {
  return cycle
    .map((p) => `    -> ${path.relative(rootDir, p)}`)
    .join("\n");
}

/**
 * Validates that a directory contains source files.
 * Throws an error if no source files are found in the specified directory.
 *
 * @param {Array<string>} files - Array of file paths
 * @param {string} rootDir - The root directory that was searched
 * @throws {Error} If no source files are found
 */
export function validateSourceFiles(files, rootDir) {
  if (files.length === 0) {
    throw new Error(
      `No source files found in "${rootDir}". Please specify a directory with JavaScript or TypeScript files.`
    );
  }
}

/**
 * Creates a spinner with consistent styling.
 * Provides a standardized spinner instance for use throughout the application
 * with consistent appearance and behavior.
 *
 * @param {string} initialMessage - The initial message to display
 * @returns {Promise<Object>} Promise that resolves to a Spinner instance with consistent configuration
 */
export async function createStyledSpinner(initialMessage) {
  const chalk = await import("chalk").then(m => m.default);
  const { Spinner } = await import("cli-spinner");

  const spinner = new Spinner(chalk.blue(`%s ${initialMessage}`));
  spinner.setSpinnerString(18);
  return spinner;
}
