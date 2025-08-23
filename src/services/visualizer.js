/**
 * @fileoverview SVG visualization generator for dependency graphs.
 * Coordinates the entire SVG generation process from hierarchical structure building
 * through final serialization. Handles layout positioning, dimension calculations,
 * and rendering orchestration for both structural and dependency relationships.
 */

import * as d3 from "d3";
import { SVG_CONFIG, generateFlowBasedColorMap } from "../CONF.js";
import {
  buildHierarchicalStructure,
  calculateSVGDimensions,
  createDependencyLinks,
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
 * Uses the flow-based color system where terminal files get unique colors and propagate back through their paths.
 *
 * @param {{nodes: Map<string, Object>, edges: Map<string, Set<string>>}} graph - The dependency graph
 * @param {string[][]} cycles - Array of detected circular dependencies, where each cycle is an array of file paths
 * @param {string} rootDir - The absolute path to the project root
 * @param {Object} options - CLI options for customization
 * @param {string} options.output - Output file path
 * @param {string} options.layout - Layout style for node positioning
 * @param {string} options.mode - Theme mode ('light', 'dark', 'system', 'auto')
 * @returns {string} The serialized SVG content
 */
export function generateSVG(graph, cycles, rootDir, options) {
  // 1. Generate flow-based color mapping (terminal files get unique colors)
  const pathColorMap = generateFlowBasedColorMap(graph.nodes, rootDir);

  // 2. Data Transformation - Convert flat graph into hierarchical structure
  const { root, maxDepth } = buildHierarchicalStructure(graph.nodes, rootDir);
  const hierarchy = d3.hierarchy(root);

  // 3. Calculate initial SVG dimensions based on hierarchy depth
  const { width: initialWidth, height: initialHeight, contentWidth } =
    calculateSVGDimensions(maxDepth, SVG_CONFIG.aspectRatio, SVG_CONFIG.margin, SVG_CONFIG.defaultWidth);

  // 4. Position nodes using selected layout algorithm
  const layoutStyle = options.layout || 'auto';
  const direction = options.direction || 'horizontal';
  const bounds = positionNodes(hierarchy, maxDepth, contentWidth, layoutStyle, direction);

  // 5. Calculate legend dimensions first
  const legendWidth = 280;
  const legendPadding = 40; // Space around legend
  const legendSpaceNeeded = legendWidth + legendPadding;

  // 6. Crop SVG to content bounds with padding, adding space for legend
  const padding = 40; // Minimal padding around content
  const croppedWidth = (bounds.maxX - bounds.minX) + (padding * 2) + legendSpaceNeeded + 48; // Add 48px to canvas width
  const croppedHeight = Math.max((bounds.maxY - bounds.minY) + (padding * 2), 500); // Ensure minimum height for legend

  // Log cropping results
  console.log(`SVG Cropped: ${Math.round(croppedWidth)}x${Math.round(croppedHeight)} (layout: ${layoutStyle})`);

  // 7. Create base SVG structure with cropped dimensions and theme support
  const themeMode = options.mode || 'system';
  const { svg } = createBaseSVG(croppedWidth, croppedHeight, themeMode);

  // Position chart content to the right of legend space
  // Calculate the maximum text extension to ensure nothing goes off-canvas
  const maxTextExtension = 120; // Maximum expected text width + marker offset
  const chartStartX = legendSpaceNeeded + padding;

  // Adjust chart position to shift left by half the distance from legend edge
  const legendRightEdge = legendSpaceNeeded;
  const shiftAmount = (croppedWidth - legendRightEdge) * 0.3 + 12; // Shift left by 30% of remaining space + 12px (reduced by 12px to shift right)

  const chartOffsetX = Math.max(chartStartX - bounds.minX - shiftAmount, legendSpaceNeeded + 20);
  const chartOffsetY = -bounds.minY + padding;
  const g = svg
    .append("g")
    .attr("transform", `translate(${chartOffsetX}, ${chartOffsetY})`);

  // 8. Render hierarchical structural links (parent-child relationships)
  // 8. Render hierarchical structural links (parent-child relationships)
  renderStructuralLinks(g, hierarchy);

  // 9. Render dependency links with flow-based colors and service file dashed strokes
  const cycleEdges = getCycleEdges(cycles);
  const dependencyLinks = createDependencyLinks(graph.edges, new Map(
    Array.from(graph.nodes.entries()).map(([path, node]) => [path, { ...node, path }])
  ));
  renderDependencyLinks(g, dependencyLinks, cycleEdges, hierarchy, pathColorMap);

  // 10. Render nodes with flow-based color system, home icon for root, default styling for directories
  renderNodes(g, hierarchy, rootDir, pathColorMap);

  // 11. Add legend in the allocated left space
  const legendX = 24; // Fixed position in legend space
  const legendY = 24;
  renderLegend(svg, croppedWidth, croppedHeight, pathColorMap, graph.nodes, legendX, legendY);

  // 11. Serialize SVG to string for file output
  return serializeSVG(svg);
}
