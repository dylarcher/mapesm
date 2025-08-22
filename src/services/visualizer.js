/**
 * @fileoverview SVG visualization generator for dependency graphs.
 * Coordinates the entire SVG generation process from hierarchical structure building
 * through final serialization. Handles layout positioning, dimension calculations,
 * and rendering orchestration for both structural and dependency relationships.
 */

import * as d3 from "d3";
import { SVG_CONFIG, generateDirectoryColorMap } from "../CONF.js";
import {
  buildHierarchicalStructure,
  calculateSVGDimensions,
  createDependencyLinks,
  extractSecondLevelDirectories,
  getCycleEdges
} from "../utils.js";
import {
  createBaseSVG,
  positionNodes,
  renderDependencyLinks,
  renderLegend,
  renderNodes,
  renderStructuralLinks,
  serializeSVG,
} from "./provider.js";



/**
 * Generates an SVG visualization of the dependency graph.
 * Orchestrates the complete visualization pipeline from data transformation through final rendering.
 * Handles hierarchical structure building, node positioning, link rendering, and cycle highlighting.
 *
 * @param {{nodes: Map<string, Object>, edges: Map<string, Set<string>>}} graph - The dependency graph
 * @param {string[][]} cycles - Array of detected circular dependencies, where each cycle is an array of file paths
 * @param {string} rootDir - The absolute path to the project root
 * @param {Object} options - CLI options for customization
 * @param {string} options.output - Output file path
 * @param {string} options.layout - Layout style for node positioning
 * @returns {string} The serialized SVG content
 */
export function generateSVG(graph, cycles, rootDir, options) {
  // 1. Extract second-level directories and create dynamic color mapping
  const secondLevelDirs = extractSecondLevelDirectories(graph.nodes, rootDir);
  const directoryColorMap = generateDirectoryColorMap(secondLevelDirs);

  // 2. Data Transformation - Convert flat graph into hierarchical structure
  const { root, maxDepth } = buildHierarchicalStructure(graph.nodes, rootDir);
  const hierarchy = d3.hierarchy(root);

  // 3. Calculate initial SVG dimensions based on hierarchy depth
  const { width: initialWidth, height: initialHeight, contentWidth } =
    calculateSVGDimensions(maxDepth, SVG_CONFIG.aspectRatio, SVG_CONFIG.margin, SVG_CONFIG.defaultWidth);

  // 4. Position nodes using selected layout algorithm
  const layoutStyle = options.layout || 'auto';
  const bounds = positionNodes(hierarchy, maxDepth, contentWidth, layoutStyle);

  // 5. Crop SVG to content bounds with minimal padding (aggressive whitespace removal)
  const padding = 40; // Minimal padding around content
  const croppedWidth = (bounds.maxX - bounds.minX) + (padding * 2);
  const croppedHeight = (bounds.maxY - bounds.minY) + (padding * 2);

  // Log cropping results
  console.log(`SVG Cropped: ${Math.round(croppedWidth)}x${Math.round(croppedHeight)} (layout: ${layoutStyle})`);

  // 6. Create base SVG structure with cropped dimensions
  const { svg } = createBaseSVG(croppedWidth, croppedHeight);
  const g = svg
    .append("g")
    .attr("transform", `translate(${-bounds.minX + padding}, ${-bounds.minY + padding})`);

  // 7. Render hierarchical structural links (parent-child relationships)
  renderStructuralLinks(g, hierarchy);

  // 8. Render dependency links with target node colors and cycle highlighting
  const cycleEdges = getCycleEdges(cycles);
  const dependencyLinks = createDependencyLinks(graph.edges, new Map(
    Array.from(graph.nodes.entries()).map(([path, node]) => [path, { ...node, path }])
  ));
  renderDependencyLinks(g, dependencyLinks, cycleEdges, hierarchy, maxDepth, rootDir, directoryColorMap);

  // 9. Render nodes with consistent directory colors (no depth variations)
  renderNodes(g, hierarchy, maxDepth, rootDir, directoryColorMap);

  // 10. Add compact legend for directory colors and file type shapes
  const legendWidth = 250;
  const legendHeight = (secondLevelDirs.length + Object.keys(SVG_CONFIG).length) * 25 + 80;
  if (croppedWidth > legendWidth + 100) { // Only show legend if there's space
    renderLegend(svg, croppedWidth, croppedHeight, secondLevelDirs, directoryColorMap);
  }

  // 11. Serialize SVG to string for file output
  return serializeSVG(svg);
}
