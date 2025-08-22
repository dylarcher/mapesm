/**
 * @fileoverview SVG visualization generator for dependency graphs.
 * Coordinates the entire SVG generation process from hierarchical structure building
 * through final serialization. Handles layout positioning, dimension calculations,
 * and rendering orchestration for both structural and dependency relationships.
 */

import * as d3 from "d3";
import {
  adjustDimensionsForContent,
  buildHierarchicalStructure,
  calculateSVGDimensions,
  createDependencyLinks,
  getCycleEdges,
} from "../utils.js";
import { SVG_CONFIG } from "./constants.js";
import {
  createBaseSVG,
  positionNodes,
  renderDependencyLinks,
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
 * @returns {string} The serialized SVG content
 */
export function generateSVG(graph, cycles, rootDir, options) {
  // 1. Data Transformation - Convert flat graph into hierarchical structure
  const { root, maxDepth } = buildHierarchicalStructure(graph.nodes, rootDir);
  const hierarchy = d3.hierarchy(root);

  // 2. Calculate initial SVG dimensions based on hierarchy depth
  const { width: initialWidth, height: initialHeight, contentWidth } =
    calculateSVGDimensions(maxDepth, SVG_CONFIG.aspectRatio, SVG_CONFIG.margin, SVG_CONFIG.defaultWidth);

  // 3. Position nodes using custom layout algorithm
  const bounds = positionNodes(hierarchy, maxDepth, contentWidth);

  // 4. Adjust dimensions based on actual content bounds to ensure everything fits
  const { width, height } = adjustDimensionsForContent(
    bounds,
    SVG_CONFIG.margin,
    SVG_CONFIG.aspectRatio,
    initialWidth,
    initialHeight
  );

  // 5. Create base SVG structure with proper dimensions and styling
  const { svg } = createBaseSVG(width, height);
  const g = svg
    .append("g")
    .attr("transform", `translate(${SVG_CONFIG.margin.left - bounds.minY}, ${SVG_CONFIG.margin.top - bounds.minX})`);

  // 6. Render hierarchical structural links (parent-child relationships)
  renderStructuralLinks(g, hierarchy);

  // 7. Render dependency links with special highlighting for cycles
  const cycleEdges = getCycleEdges(cycles);
  const dependencyLinks = createDependencyLinks(graph.edges, new Map(
    Array.from(graph.nodes.entries()).map(([path, node]) => [path, { ...node, path }])
  ));
  renderDependencyLinks(g, dependencyLinks, cycleEdges, hierarchy);

  // 8. Render nodes with file type-specific shapes and colors
  renderNodes(g, hierarchy, maxDepth);

  // 9. Serialize SVG to string for file output
  return serializeSVG(svg);
}
