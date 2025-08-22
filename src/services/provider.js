/**
 * @fileoverview SVG rendering engine for dependency graph visualization.
 * Handles low-level SVG creation, node positioning, shape rendering, and link drawing.
 * Uses D3.js for DOM manipulation and JSDOM for server-side SVG generation.
 */

import * as d3 from "d3";
import { JSDOM } from "jsdom";
import xmlserializer from "xmlserializer";
import { COLOR_PALETTE, SHAPE_LEGEND, SVG_CONFIG, SVG_SHAPES, SVG_STYLES } from "../CONF.js";
import { getColorByDepth } from "../utils.js";

/**
 * Calculates optimal bounds for the node graph with intelligent whitespace management.
 * Analyzes node distribution and consolidates excessive spacing while maintaining readability.
 *
 * @param {Object} hierarchy - D3 hierarchy object
 * @returns {Object} Optimal bounds with minimal padding
 */
function calculateOptimalBounds(hierarchy) {
  if (!hierarchy) return { minX: 0, maxX: 100, minY: 0, maxY: 100 };

  // Collect all node positions
  const positions = [];
  hierarchy.each((d) => {
    positions.push({ x: d.x, y: d.y });
  });

  if (positions.length === 0) return { minX: 0, maxX: 100, minY: 0, maxY: 100 };

  // Calculate raw bounds
  let minX = Math.min(...positions.map(p => p.x));
  let maxX = Math.max(...positions.map(p => p.x));
  let minY = Math.min(...positions.map(p => p.y));
  let maxY = Math.max(...positions.map(p => p.y));

  // Add node radius to bounds
  const nodeBuffer = SVG_CONFIG.nodeRadius * 2;
  minX -= nodeBuffer;
  maxX += nodeBuffer;
  minY -= nodeBuffer;
  maxY += nodeBuffer;

  // Intelligent whitespace detection and consolidation
  const currentWidth = maxX - minX;
  const currentHeight = maxY - minY;

  // Analyze node density to determine if consolidation is needed
  const nodeCount = positions.length;
  const area = currentWidth * currentHeight;
  const density = nodeCount / area;

  // Define thresholds for excessive whitespace
  const minDensity = 0.001; // Nodes per square pixel
  const maxWhitespaceRatio = 0.7; // Maximum allowed empty space ratio

  if (density < minDensity && area > 10000) {
    // Excessive whitespace detected - consolidate bounds
    const targetDensity = minDensity * 1.5;
    const targetArea = nodeCount / targetDensity;
    const scaleFactor = Math.sqrt(targetArea / area);

    // Apply gentle consolidation to maintain readability
    const consolidationFactor = Math.max(0.7, Math.min(1.0, scaleFactor));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const halfWidth = (currentWidth * consolidationFactor) / 2;
    const halfHeight = (currentHeight * consolidationFactor) / 2;

    minX = centerX - halfWidth;
    maxX = centerX + halfWidth;
    minY = centerY - halfHeight;
    maxY = centerY + halfHeight;
  }

  // Apply minimal padding for final output
  const finalPadding = 30; // Minimal padding around the entire graph

  return {
    minX: minX - finalPadding,
    maxX: maxX + finalPadding,
    minY: minY - finalPadding,
    maxY: maxY + finalPadding
  };
}

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
 * Layout positioning algorithms for different visualization styles.
 * Each layout provides a unique arrangement strategy for nodes.
 */
const LAYOUT_ALGORITHMS = {
  /**
   * Automatic layout selection based on graph characteristics
   */
  auto: (hierarchy, maxDepth, contentWidth) => {
    const totalNodes = hierarchy.descendants().length;
    const aspectRatio = contentWidth / (maxDepth * 100);

    // Choose layout based on graph characteristics
    if (totalNodes <= 10) return LAYOUT_ALGORITHMS.tree(hierarchy, maxDepth, contentWidth);
    if (aspectRatio > 2) return LAYOUT_ALGORITHMS.horizontal(hierarchy, maxDepth, contentWidth);
    if (maxDepth > 5) return LAYOUT_ALGORITHMS.circular(hierarchy, maxDepth, contentWidth);
    return LAYOUT_ALGORITHMS.diagonal(hierarchy, maxDepth, contentWidth);
  },

  /**
   * Circular/half-circle layout - nodes arranged in concentric arcs
   */
  circular: (hierarchy, maxDepth, contentWidth) => {
    const levelWidth = Math.max(contentWidth / Math.max(maxDepth, 1), 200);
    const nodesByLevel = new Map();

    hierarchy.each((d) => {
      if (!nodesByLevel.has(d.depth)) nodesByLevel.set(d.depth, []);
      nodesByLevel.get(d.depth).push(d);
    });

    nodesByLevel.forEach((nodes, level) => {
      const baseY = level * levelWidth;

      if (nodes.length === 1) {
        nodes[0].x = 0;
        nodes[0].y = baseY;
      } else {
        const radius = Math.max(120, nodes.length * 20);
        const angleStep = Math.PI / Math.max(nodes.length - 1, 1);
        const startAngle = -Math.PI / 2;

        nodes.forEach((node, i) => {
          const angle = startAngle + (i * angleStep);
          node.x = radius * Math.sin(angle);
          node.y = baseY + radius * (0.4 + 0.6 * Math.abs(Math.cos(angle)));
        });
      }
    });

    return calculateOptimalBounds(hierarchy);
  },

  /**
   * Diagonal layout - staggered positioning with indentation
   */
  diagonal: (hierarchy, maxDepth, contentWidth) => {
    const levelWidth = contentWidth / Math.max(maxDepth, 1);
    const levelHeight = 80;
    const indentAmount = 60;

    const nodesByLevel = new Map();
    hierarchy.each((d) => {
      if (!nodesByLevel.has(d.depth)) nodesByLevel.set(d.depth, []);
      nodesByLevel.get(d.depth).push(d);
    });

    nodesByLevel.forEach((nodes, level) => {
      const xOffset = level * indentAmount;
      const yBase = level * levelHeight;

      nodes.forEach((node, i) => {
        node.x = xOffset + (i * 40);
        node.y = yBase + (i * 30);
      });
    });

    return calculateOptimalBounds(hierarchy);
  },

  /**
   * Linear layout - nodes in straight progression
   */
  linear: (hierarchy, maxDepth, contentWidth) => {
    const levelHeight = 100;
    const nodeSpacing = 40;

    hierarchy.each((d, i) => {
      d.x = i * nodeSpacing;
      d.y = d.depth * levelHeight;
    });

    return calculateOptimalBounds(hierarchy);
  },

  /**
   * Horizontal layout - left to right arrangement
   */
  horizontal: (hierarchy, maxDepth, contentWidth) => {
    const levelWidth = contentWidth / Math.max(maxDepth, 1);
    const nodesByLevel = new Map();

    hierarchy.each((d) => {
      if (!nodesByLevel.has(d.depth)) nodesByLevel.set(d.depth, []);
      nodesByLevel.get(d.depth).push(d);
    });

    nodesByLevel.forEach((nodes, level) => {
      const yBase = level * levelWidth;
      const nodeSpacing = 60;

      nodes.forEach((node, i) => {
        node.y = yBase;
        node.x = i * nodeSpacing - (nodes.length - 1) * nodeSpacing / 2;
      });
    });

    return calculateOptimalBounds(hierarchy);
  },

  /**
   * Vertical layout - top to bottom arrangement
   */
  vertical: (hierarchy, maxDepth, contentWidth) => {
    const nodesByLevel = new Map();
    hierarchy.each((d) => {
      if (!nodesByLevel.has(d.depth)) nodesByLevel.set(d.depth, []);
      nodesByLevel.get(d.depth).push(d);
    });

    let currentY = 0;
    nodesByLevel.forEach((nodes, level) => {
      const nodeSpacing = 50;
      const levelHeight = 80;

      nodes.forEach((node, i) => {
        node.x = i * nodeSpacing - (nodes.length - 1) * nodeSpacing / 2;
        node.y = currentY;
      });

      currentY += levelHeight;
    });

    return calculateOptimalBounds(hierarchy);
  },

  /**
   * Tree layout - traditional hierarchical tree
   */
  tree: (hierarchy, maxDepth, contentWidth) => {
    const treeLayout = d3.tree().size([contentWidth, maxDepth * 100]);
    treeLayout(hierarchy);

    // Swap x and y for horizontal tree
    hierarchy.each((d) => {
      const temp = d.x;
      d.x = d.y;
      d.y = temp;
    });

    return calculateOptimalBounds(hierarchy);
  },

  /**
   * Grid layout - organized in regular grid pattern
   */
  grid: (hierarchy, maxDepth, contentWidth) => {
    const descendants = hierarchy.descendants();
    const gridSize = Math.ceil(Math.sqrt(descendants.length));
    const cellSize = Math.min(contentWidth / gridSize, 100);

    descendants.forEach((node, i) => {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      node.x = col * cellSize;
      node.y = row * cellSize;
    });

    return calculateOptimalBounds(hierarchy);
  }
};

/**
 * Positions nodes using the specified layout algorithm.
 *
 * @param {Object} hierarchy - D3 hierarchy object
 * @param {number} maxDepth - Maximum depth of the tree
 * @param {number} contentWidth - Available content width
 * @param {string} layoutStyle - Layout algorithm to use
 * @returns {Object} Bounds of the positioned nodes
 */
export function positionNodes(hierarchy, maxDepth, contentWidth, layoutStyle = 'auto') {
  const algorithm = LAYOUT_ALGORITHMS[layoutStyle] || LAYOUT_ALGORITHMS.auto;
  return algorithm(hierarchy, maxDepth, contentWidth);
}/**
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
 * Creates curved paths for dependencies with colors based on target nodes.
 * Uses adaptive Bézier curves and applies target node colors to connecting lines.
 *
 * @param {Object} g - D3 selection of the main group element
 * @param {Array} dependencyLinks - Array of dependency link objects with source and target properties
 * @param {Set} cycleEdges - Set of edge identifiers that are part of circular dependencies
 * @param {Object} hierarchy - D3 hierarchy object for node position lookup
 * @param {number} maxDepth - Maximum depth for color calculations
 * @param {string} rootDir - Root directory path for color mapping
 * @param {Object} directoryColorMap - Directory to color mapping
 */
export function renderDependencyLinks(g, dependencyLinks, cycleEdges, hierarchy, maxDepth = 1, rootDir = "", directoryColorMap = {}) {
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
    .attr("stroke", (d) => {
      // Find the target node to get its color
      const target = hierarchy
        .descendants()
        .find((node) => node.data.path === d.target.path);

      if (target && target.data) {
        // Use the same color calculation as the target node
        return getColorByDepth(
          target.data.depth || 0,
          maxDepth,
          target.data.fileType,
          target.data.path,
          rootDir,
          directoryColorMap
        );
      }

      // Fallback to default dependency color
      return "var(--dependency-stroke)";
    })
    .attr("stroke-width", (d) => {
      // Thicker lines for cycle links
      return cycleEdges.has(`${d.source.path}->${d.target.path}`) ? 3 : 2;
    })
    .attr("stroke-opacity", 0.8)
    .attr("d", (d) => {
      // Find the corresponding positioned nodes in the hierarchy
      const source = hierarchy
        .descendants()
        .find((node) => node.data.path === d.source.path);
      const target = hierarchy
        .descendants()
        .find((node) => node.data.path === d.target.path);
      if (!source || !target) return "";

      // Create adaptive curved path that works with various layouts
      const path = d3.path();
      path.moveTo(source.y, source.x);

      // Calculate dynamic curve offsets based on distance and direction
      const dx = target.y - source.y;
      const dy = target.x - source.x;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Adaptive curve intensity based on distance
      const curveIntensity = Math.min(distance * 0.25, SVG_CONFIG.curveOffset);

      // Create smooth curves with appropriate control points
      const midX = source.x + dy * 0.3;
      const midY = source.y + dx * 0.4;

      path.bezierCurveTo(
        source.y + curveIntensity,
        midX,
        target.y - curveIntensity,
        target.x + dy * 0.2,
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
 * @param {string} rootDir - Root directory path for color mapping
 * @param {Object} directoryColorMap - Dynamic directory to color palette mapping
 */
export function renderNodes(g, hierarchy, maxDepth, rootDir = "", directoryColorMap = {}) {
  const node = g
    .selectAll(".node")
    .data(hierarchy.descendants())
    .enter()
    .append("g")
    .attr("class", (d) => `node node--${d.data.fileType}`)
    .attr("transform", (d) => `translate(${d.y},${d.x})`)
    .style("--color", (d) =>
      getColorByDepth(d.data.depth || 0, maxDepth, d.data.fileType, d.data.path, rootDir, directoryColorMap)
    );

  // Add shapes based on file type with depth-based coloring
  node.each(function (d) {
    const element = d3.select(this);
    const color = getColorByDepth(
      d.data.depth || 0,
      maxDepth,
      d.data.fileType,
      d.data.path,
      rootDir,
      directoryColorMap
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
 * Renders a legend for directory colors and file type shapes.
 * Creates a legend that maps colors to second-level directories and shapes to file types.
 *
 * @param {Object} svg - D3 SVG selection
 * @param {number} width - SVG width
 * @param {number} height - SVG height
 * @param {string[]} secondLevelDirs - Array of second-level directory names
 * @param {Object} directoryColorMap - Directory to color palette mapping
 */
export function renderLegend(svg, width, height, secondLevelDirs, directoryColorMap) {
  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width - SVG_CONFIG.margin.right + SVG_CONFIG.legend.x}, ${SVG_CONFIG.legend.y})`);

  let yOffset = 0;

  // Calculate legend background dimensions
  const directoryLegendItems = secondLevelDirs.length;
  const shapeLegendItems = Object.keys(SHAPE_LEGEND).length;
  const totalItems = directoryLegendItems + shapeLegendItems + 2; // +2 for titles
  const legendHeight = totalItems * SVG_CONFIG.legend.itemHeight + 40; // Extra padding
  const legendWidth = 250;

  // Add legend background
  legend.append("rect")
    .attr("class", "legend-background")
    .attr("x", -10)
    .attr("y", -10)
    .attr("width", legendWidth)
    .attr("height", legendHeight);

  // Directory Colors Legend
  legend.append("text")
    .attr("class", "legend-title")
    .attr("x", 0)
    .attr("y", yOffset)
    .text("Directory Colors");
  yOffset += SVG_CONFIG.legend.itemHeight + 5;

  secondLevelDirs.forEach(dirName => {
    const paletteKey = directoryColorMap[dirName] || 'default';
    const color = COLOR_PALETTE[paletteKey]; // Now just a single color

    const legendItem = legend.append("g")
      .attr("class", "legend-item")
      .attr("transform", `translate(0, ${yOffset})`);

    // Color swatch
    legendItem.append("rect")
      .attr("width", SVG_CONFIG.legend.colorBoxSize)
      .attr("height", SVG_CONFIG.legend.colorBoxSize)
      .attr("fill", color);

    // Directory name
    legendItem.append("text")
      .attr("class", "legend-text")
      .attr("x", SVG_CONFIG.legend.colorBoxSize + SVG_CONFIG.legend.spacing)
      .attr("y", SVG_CONFIG.legend.colorBoxSize / 2)
      .attr("dy", "0.31em")
      .text(dirName);

    yOffset += SVG_CONFIG.legend.itemHeight;
  });

  yOffset += 10; // Extra spacing between sections

  // File Type Shapes Legend
  legend.append("text")
    .attr("class", "legend-title")
    .attr("x", 0)
    .attr("y", yOffset)
    .text("File Type Shapes");
  yOffset += SVG_CONFIG.legend.itemHeight + 5;

  Object.entries(SHAPE_LEGEND).forEach(([shapeType, info]) => {
    const legendItem = legend.append("g")
      .attr("class", "legend-item")
      .attr("transform", `translate(0, ${yOffset})`);

    // Shape icon
    const shapeGroup = legendItem.append("g")
      .attr("transform", `translate(${SVG_CONFIG.legend.shapeSize / 2}, ${SVG_CONFIG.legend.shapeSize / 2})`);

    // Create shape based on file type using the same logic as renderNodeShape
    const defaultColor = COLOR_PALETTE.default; // Use single default color
    renderShapeForLegend(shapeGroup, shapeType, defaultColor);

    // Shape description
    legendItem.append("text")
      .attr("class", "legend-text")
      .attr("x", SVG_CONFIG.legend.shapeSize + SVG_CONFIG.legend.spacing)
      .attr("y", SVG_CONFIG.legend.shapeSize / 2)
      .attr("dy", "0.31em")
      .text(info.name);

    yOffset += SVG_CONFIG.legend.itemHeight;
  });
}

/**
 * Renders a shape for the legend based on file type.
 * Creates a smaller version of node shapes for the legend display.
 *
 * @param {Object} element - D3 selection to append the shape to
 * @param {string} shapeType - The file type/shape identifier
 * @param {string} color - Color for the shape
 */
export function renderShapeForLegend(element, shapeType, color) {
  const scale = 0.6; // Smaller size for legend

  switch (shapeType) {
    case "directory":
      element.append("circle")
        .attr("r", SVG_CONFIG.nodeRadius * scale)
        .attr("fill", color);
      break;

    case "script":
      element.append("path")
        .attr("d", SVG_SHAPES.diamond)
        .attr("transform", `scale(${scale})`)
        .attr("fill", color);
      break;

    case "style":
      element.append("rect")
        .attr("x", -6 * scale)
        .attr("y", -6 * scale)
        .attr("width", 12 * scale)
        .attr("height", 12 * scale)
        .attr("fill", color);
      break;

    case "image":
      element.append("path")
        .attr("d", SVG_SHAPES.star)
        .attr("transform", `scale(${scale})`)
        .attr("fill", color);
      break;

    case "multimedia":
      element.append("path")
        .attr("d", SVG_SHAPES.trapezoid)
        .attr("transform", `scale(${scale})`)
        .attr("fill", color);
      break;

    default:
      element.append("path")
        .attr("d", SVG_SHAPES.tag)
        .attr("transform", `scale(${scale})`)
        .attr("fill", color);
      break;
  }
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
