/**
 * @fileoverview SVG rendering engine for dependency graph visualization.
 * Handles low-level SVG creation, node positioning, shape rendering, and link drawing.
 * Uses D3.js for DOM manipulation and JSDOM for server-side SVG generation.
 */

import * as d3 from "d3";
import { JSDOM } from "jsdom";
import xmlserializer from "xmlserializer";
import { getColorByDepth } from "../utils.js";
import { SVG_CONFIG, SVG_SHAPES, SVG_STYLES } from "./constants.js";

/**
 * Creates the base SVG structure with dimensions and styling.
 * Initializes the SVG canvas with proper dimensions, viewBox, and embedded CSS styles.
 * Uses JSDOM for server-side DOM manipulation.
 *
 * @param {number} width - SVG width in pixels
 * @param {number} height - SVG height in pixels
 * @returns {Object} Object containing the SVG selection and DOM instance
 * @returns {Object} returns.svg - D3 selection of the SVG element
 * @returns {Object} returns.dom - JSDOM instance for server-side rendering
 */
export function createBaseSVG(width, height) {
  const dom = new JSDOM("<!DOCTYPE html><body></body>");
  const body = d3.select(dom.window.document.body);

  const svg = body
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("xmlns", "http://www.w3.org/2000/svg");

  // Add styles for theming and visual consistency
  svg.append("defs").append("style").text(SVG_STYLES);

  return { svg, dom };
}

/**
 * Positions nodes in the hierarchy using a custom layout algorithm.
 * Implements a level-based positioning system where nodes are arranged by depth
 * with even vertical spacing within each level.
 *
 * @param {Object} hierarchy - D3 hierarchy object
 * @param {number} maxDepth - Maximum depth of the tree for spacing calculations
 * @param {number} contentWidth - Available content width for horizontal positioning
 * @returns {Object} Bounds of the positioned nodes (minX, maxX, minY, maxY)
 */
export function positionNodes(hierarchy, maxDepth, contentWidth) {
  const levelWidth = contentWidth / Math.max(maxDepth, 1);

  // Position nodes based on their depth level horizontally
  hierarchy.each((d) => {
    d.y = d.depth * levelWidth; // Horizontal position based on depth
    d.x = 0; // Will be calculated based on siblings
  });

  // Calculate vertical positions for each level
  const nodesByLevel = new Map();
  hierarchy.each((d) => {
    if (!nodesByLevel.has(d.depth)) {
      nodesByLevel.set(d.depth, []);
    }
    nodesByLevel.get(d.depth).push(d);
  });

  // Position nodes vertically within each level with even spacing
  nodesByLevel.forEach((nodes, level) => {
    const totalHeight = (nodes.length - 1) * SVG_CONFIG.levelHeight;
    const startY = -totalHeight / 2;

    nodes.forEach((node, i) => {
      node.x = startY + i * SVG_CONFIG.levelHeight;
    });
  });

  // Calculate bounds from positioned nodes for dimension adjustments
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  hierarchy.each((d) => {
    if (d.x < minX) minX = d.x;
    if (d.x > maxX) maxX = d.x;
    if (d.y < minY) minY = d.y;
    if (d.y > maxY) maxY = d.y;
  });

  return { minX, maxX, minY, maxY };
}

/**
 * Renders structural links (parent-child relationships) in the hierarchy.
 * Creates curved paths connecting parent nodes to their children using D3's linkHorizontal.
 *
 * @param {Object} g - D3 selection of the main group element
 * @param {Object} hierarchy - D3 hierarchy object containing positioned nodes
 */
export function renderStructuralLinks(g, hierarchy) {
  g.selectAll(".link")
    .data(hierarchy.links())
    .enter()
    .append("path")
    .attr("class", "link")
    .attr(
      "d",
      d3
        .linkHorizontal()
        .x((d) => d.y)
        .y((d) => d.x)
    );
}

/**
 * Renders dependency links (import/export relationships).
 * Creates curved paths for dependencies with special styling for circular dependencies.
 * Uses Bézier curves to avoid overlapping with structural links.
 *
 * @param {Object} g - D3 selection of the main group element
 * @param {Array} dependencyLinks - Array of dependency link objects with source and target properties
 * @param {Set} cycleEdges - Set of edge identifiers that are part of circular dependencies
 * @param {Object} hierarchy - D3 hierarchy object for node position lookup
 */
export function renderDependencyLinks(g, dependencyLinks, cycleEdges, hierarchy) {
  g.selectAll(".dependency-link")
    .data(dependencyLinks)
    .enter()
    .append("path")
    .attr(
      "class",
      (d) =>
        `link dependency-link ${cycleEdges.has(`${d.source.path}->${d.target.path}`) ? "cycle-link" : ""
        }`
    )
    .attr("d", (d) => {
      // Find the corresponding positioned nodes in the hierarchy
      const source = hierarchy
        .descendants()
        .find((node) => node.data.path === d.source.path);
      const target = hierarchy
        .descendants()
        .find((node) => node.data.path === d.target.path);
      if (!source || !target) return "";

      // Create curved path using Bézier curves to avoid overlaps
      const path = d3.path();
      path.moveTo(source.y, source.x);
      path.bezierCurveTo(
        source.y + SVG_CONFIG.curveOffset,
        source.x,
        target.y - SVG_CONFIG.curveOffset,
        target.x,
        target.y,
        target.x
      );
      return path.toString();
    });
}

/**
 * Renders a shape for a node based on its file type.
 * Creates different geometric shapes to visually distinguish file types:
 * - Directories: circles
 * - Scripts: diamonds
 * - Styles: squares
 * - Images: stars
 * - Multimedia: trapezoids
 * - Default: tag shapes
 *
 * @param {Object} element - D3 selection of the node element to append the shape to
 * @param {Object} nodeData - The node data object containing file type and other properties
 * @param {string} color - The hex color code to fill the shape
 */
export function renderNodeShape(element, nodeData, color) {
  switch (nodeData.fileType) {
    case "directory":
      element
        .append("circle")
        .attr("r", SVG_CONFIG.nodeRadius)
        .attr("class", "node-shape shape-directory")
        .attr("fill", color);
      break;

    case "script":
      // Diamond shape for JavaScript/TypeScript files
      element
        .append("path")
        .attr("d", SVG_SHAPES.diamond)
        .attr("class", "node-shape shape-script")
        .attr("fill", color);
      break;

    case "style":
      // Square shape for CSS/SCSS files
      element
        .append("rect")
        .attr("x", -6)
        .attr("y", -6)
        .attr("width", 12)
        .attr("height", 12)
        .attr("class", "node-shape shape-style")
        .attr("fill", color);
      break;

    case "image":
      // Star shape for image files
      element
        .append("path")
        .attr("d", SVG_SHAPES.star)
        .attr("class", "node-shape shape-image")
        .attr("fill", color);
      break;

    case "multimedia":
      // Trapezoid shape for video/audio files
      element
        .append("path")
        .attr("d", SVG_SHAPES.trapezoid)
        .attr("class", "node-shape shape-multimedia")
        .attr("fill", color);
      break;

    default:
      // Tag/label shape for config and other files
      element
        .append("path")
        .attr("d", SVG_SHAPES.tag)
        .attr("class", "node-shape shape-default")
        .attr("fill", color);
      break;
  }
}

/**
 * Renders all nodes in the hierarchy with their shapes and labels.
 * Creates node groups with file type-specific shapes, colors, and text labels.
 * Applies depth-based coloring and positioning for visual hierarchy.
 *
 * @param {Object} g - D3 selection of the main group element
 * @param {Object} hierarchy - D3 hierarchy object containing all positioned nodes
 * @param {number} maxDepth - Maximum depth in the tree for color gradient calculations
 */
export function renderNodes(g, hierarchy, maxDepth) {
  const node = g
    .selectAll(".node")
    .data(hierarchy.descendants())
    .enter()
    .append("g")
    .attr("class", (d) => `node node--${d.data.fileType}`)
    .attr("transform", (d) => `translate(${d.y},${d.x})`)
    .style("--color", (d) =>
      getColorByDepth(d.data.depth || 0, maxDepth, d.data.fileType)
    );

  // Add shapes based on file type with depth-based coloring
  node.each(function (d) {
    const element = d3.select(this);
    const color = getColorByDepth(
      d.data.depth || 0,
      maxDepth,
      d.data.fileType
    );
    renderNodeShape(element, d.data, color);
  });

  // Add text labels with proper positioning based on node type
  node
    .append("text")
    .attr("dy", "0.31em")
    .attr("x", (d) => (d.children ? -SVG_CONFIG.nodeOffset : SVG_CONFIG.nodeOffset))
    .attr("text-anchor", (d) => (d.children ? "end" : "start"))
    .text((d) => d.data.name);
}

/**
 * Serializes the SVG to a string for file output.
 * Uses xmlserializer to convert the DOM SVG element to a string representation.
 *
 * @param {Object} svg - D3 SVG selection containing the complete visualization
 * @returns {string} Serialized SVG content ready for file writing
 */
export function serializeSVG(svg) {
  return xmlserializer.serializeToString(svg.node());
}
