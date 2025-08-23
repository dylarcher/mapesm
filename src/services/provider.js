/**
 * @fileoverview SVG rendering engine for dependency graph visualization.
 * Handles low-level SVG creation, node positioning, shape rendering, and link drawing.
 * Uses D3.js for DOM manipulation and JSDOM for server-side SVG generation.
 */

import * as d3 from "d3";
import { JSDOM } from "jsdom";
import xmlserializer from "xmlserializer";
import { COLOR_PALETTE, getSVGStyles, SHAPE_LEGEND, SVG_CONFIG, SVG_SHAPES } from "../CONF.js";
import { getFlowBasedColor, isServiceFile } from "../utils.js";
import { dimensionStore, NODE_CATEGORIES } from "./dimension-store.js";

/**
 * Calculates optimal bounds for the node graph with intelligent whitespace management.
 * Analyzes node distribution and consolidates excessive spacing while maintaining readability.
 * Ensures proper spacing constraints are met.
 *
 * @param {Object} hierarchy - D3 hierarchy object
 * @returns {Object} Optimal bounds with minimal padding
 */
function calculateOptimalBounds(hierarchy) {
  if (!hierarchy) return { minX: 320, maxX: 420, minY: 0, maxY: 100 }; // Ensure minX is always >= 320

  // Collect all node positions and calculate text extents using the correct coordinate mapping
  // Note: nodes are rendered as translate(d.y, d.x), so we need to map accordingly
  const positions = [];
  const textExtents = [];

  hierarchy.each((d) => {
    const nodeX = d.y;  // d.y is used as x-coordinate in rendering
    const nodeY = d.x;  // d.x is used as y-coordinate in rendering

    positions.push({ x: nodeX, y: nodeY });

    // Calculate text positioning and extents
    const textWidth = (d.data.name.length * 7); // Approximate text width
    const textHeight = 14; // Approximate text height
    const textX = nodeX + (d.children ? -SVG_CONFIG.nodeOffset - textWidth : SVG_CONFIG.nodeOffset);
    const textY = nodeY;

    // Text bounds with 18px buffer
    textExtents.push({
      minX: textX - 18, // 18px buffer around text
      maxX: textX + textWidth + 18,
      minY: textY - textHeight / 2 - 18,
      maxY: textY + textHeight / 2 + 18
    });
  });

  if (positions.length === 0) return { minX: 320, maxX: 420, minY: 0, maxY: 100 }; // Ensure minX is always >= 320

  // Calculate bounds including both nodes and text with buffers
  let minX = Math.min(
    ...positions.map(p => p.x - SVG_CONFIG.nodeRadius),
    ...textExtents.map(t => t.minX)
  );
  let maxX = Math.max(
    ...positions.map(p => p.x + SVG_CONFIG.nodeRadius),
    ...textExtents.map(t => t.maxX)
  );
  let minY = Math.min(
    ...positions.map(p => p.y - SVG_CONFIG.nodeRadius),
    ...textExtents.map(t => t.minY)
  );
  let maxY = Math.max(
    ...positions.map(p => p.y + SVG_CONFIG.nodeRadius),
    ...textExtents.map(t => t.maxY)
  );

  // CRITICAL: Ensure content never overlaps with legend area (0-320px on x-axis)
  const legendSpaceWidth = 320; // Reserve 320px for legend space (280px + 40px padding)
  if (minX < legendSpaceWidth) {
    const shift = legendSpaceWidth - minX;
    minX = legendSpaceWidth;
    maxX += shift;
  }

  // Add additional buffer for markers (12px from text as specified)
  const markerBuffer = 12;
  const finalPadding = 40; // Reduced padding since we already account for text buffers

  return {
    minX: Math.max(minX - finalPadding, 0),
    maxX: maxX + finalPadding + markerBuffer,
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
 * @param {string} mode - Theme mode ('light', 'dark', 'system', 'auto')
 * @returns {Object} Object containing the SVG selection and DOM instance
 * @returns {Object} returns.svg - D3 selection of the SVG element
 * @returns {Object} returns.dom - JSDOM instance for server-side rendering
 */
export function createBaseSVG(width, height, mode = 'system') {
  const dom = new JSDOM("<!DOCTYPE html><body></body>");
  const body = d3.select(dom.window.document.body);

  const svg = body
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("xmlns", "http://www.w3.org/2000/svg");

  // Add styles for theming and visual consistency
  svg.append("defs").append("style").text(getSVGStyles(mode));

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
  auto: (hierarchy, maxDepth, contentWidth, direction = 'horizontal') => {
    const descendants = hierarchy.descendants();
    const totalNodes = descendants.length;
    const leafNodes = descendants.filter(d => !d.children || d.children.length === 0).length;
    const aspectRatio = contentWidth / (maxDepth * 100);
    const branchingFactor = totalNodes / Math.max(maxDepth, 1);

    console.log(`Auto layout analysis: nodes=${totalNodes}, depth=${maxDepth}, branching=${branchingFactor.toFixed(2)}, aspect=${aspectRatio.toFixed(2)}`);

    // Intelligent layout selection based on graph characteristics
    if (totalNodes <= 8) {
      console.log('Selected: Linear layout for small graphs');
      return LAYOUT_ALGORITHMS.linear(hierarchy, maxDepth, contentWidth, direction);
    }

    if (maxDepth <= 2 && totalNodes <= 20) {
      console.log('Selected: Grid layout for shallow, small graphs');
      return LAYOUT_ALGORITHMS.grid(hierarchy, maxDepth, contentWidth, direction);
    }

    if (branchingFactor > 8 && maxDepth <= 4) {
      console.log('Selected: Circular layout for high branching factor');
      return LAYOUT_ALGORITHMS.circular(hierarchy, maxDepth, contentWidth, direction);
    }

    if (aspectRatio > 3) {
      console.log('Selected: Linear layout for wide aspect ratios');
      return LAYOUT_ALGORITHMS.linear(hierarchy, maxDepth, contentWidth, direction);
    }

    if (maxDepth > 6) {
      console.log('Selected: Diagonal layout for deep hierarchies');
      return LAYOUT_ALGORITHMS.diagonal(hierarchy, maxDepth, contentWidth, direction);
    }

    if (leafNodes / totalNodes > 0.7) {
      console.log('Selected: Tree layout for leaf-heavy structures');
      return LAYOUT_ALGORITHMS.tree(hierarchy, maxDepth, contentWidth, direction);
    }

    console.log('Selected: Tree layout as default');
    return LAYOUT_ALGORITHMS.tree(hierarchy, maxDepth, contentWidth, direction);
  },

  /**
   * Circular/half-circle layout - nodes arranged in concentric arcs with improved spacing
   */
  circular: (hierarchy, maxDepth, contentWidth, direction = 'horizontal') => {
    const legendPadding = 340; // Increased to ensure no overlap with legend
    const minLevelWidth = 200; // Minimum width per level
    const levelWidth = Math.max(contentWidth / Math.max(maxDepth, 1), minLevelWidth);
    const nodesByLevel = new Map();

    hierarchy.each((d) => {
      if (!nodesByLevel.has(d.depth)) nodesByLevel.set(d.depth, []);
      nodesByLevel.get(d.depth).push(d);
    });

    nodesByLevel.forEach((nodes, level) => {
      if (direction === 'vertical') {
        // Vertical circular - grow downward with better arc distribution
        const baseX = legendPadding + level * levelWidth;
        if (nodes.length === 1) {
          nodes[0].x = baseX;
          nodes[0].y = 100;
        } else {
          const radius = Math.max(100, nodes.length * 40);
          const arcSpan = Math.min(Math.PI * 0.8, nodes.length * 0.4); // Better arc distribution
          const angleStep = arcSpan / Math.max(nodes.length - 1, 1);
          const startAngle = -arcSpan / 2;

          nodes.forEach((node, i) => {
            const angle = startAngle + (i * angleStep);
            node.x = baseX + radius * Math.sin(angle);
            node.y = 100 + radius * (1 + Math.cos(angle)) / 2;
          });
        }
      } else {
        // Horizontal circular - grow rightward with improved positioning
        const baseY = 100 + level * (levelWidth * 0.6);
        if (nodes.length === 1) {
          nodes[0].x = legendPadding;
          nodes[0].y = baseY;
        } else {
          const radius = Math.max(100, nodes.length * 40);
          const arcSpan = Math.min(Math.PI * 0.8, nodes.length * 0.4);
          const angleStep = arcSpan / Math.max(nodes.length - 1, 1);
          const startAngle = -Math.PI / 2 - arcSpan / 2;

          nodes.forEach((node, i) => {
            const angle = startAngle + (i * angleStep);
            node.x = legendPadding + radius * (1 + Math.sin(angle)) / 2;
            node.y = baseY + radius * Math.cos(angle) * 0.7; // Flatten the arc slightly
          });
        }
      }
    });

    return calculateOptimalBounds(hierarchy);
  },

  /**
   * Diagonal layout - staggered positioning with adaptive indentation
   */
  diagonal: (hierarchy, maxDepth, contentWidth, direction = 'horizontal') => {
    const legendPadding = 340;
    const minLevelWidth = 150;
    const levelWidth = Math.max(contentWidth / Math.max(maxDepth, 1), minLevelWidth);
    const levelHeight = Math.max(80, 500 / Math.max(maxDepth, 1)); // Better vertical distribution
    const indentAmount = Math.max(60, levelWidth * 0.4); // More pronounced indent

    const nodesByLevel = new Map();
    hierarchy.each((d) => {
      if (!nodesByLevel.has(d.depth)) nodesByLevel.set(d.depth, []);
      nodesByLevel.get(d.depth).push(d);
    });

    nodesByLevel.forEach((nodes, level) => {
      if (direction === 'vertical') {
        const xOffset = legendPadding + level * indentAmount;
        const yBase = 100 + level * levelHeight;
        const nodeSpacing = Math.max(50, levelHeight / Math.max(nodes.length, 1));

        nodes.forEach((node, i) => {
          node.x = xOffset + (i * nodeSpacing * 0.3);
          node.y = yBase + (i * nodeSpacing);
        });
      } else {
        const xOffset = legendPadding + level * indentAmount;
        const yBase = 100 + level * levelHeight;
        const nodeSpacing = Math.max(60, levelWidth / Math.max(nodes.length, 1));

        nodes.forEach((node, i) => {
          node.x = xOffset + (i * nodeSpacing * 0.8);
          node.y = yBase + (i * nodeSpacing * 0.4); // Gentle diagonal offset
        });
      }
    });

    return calculateOptimalBounds(hierarchy);
  },

  /**
   * Linear layout - nodes in optimized progression
   */
  linear: (hierarchy, maxDepth, contentWidth, direction = 'horizontal') => {
    const legendPadding = 340;
    const nodes = hierarchy.descendants();
    const minSpacing = 80;
    const spacing = Math.max(minSpacing, contentWidth / Math.max(nodes.length, 1));

    if (direction === 'horizontal') {
      // Horizontal linear with depth-based vertical offset
      let currentX = legendPadding;

      nodes.forEach((d, i) => {
        d.x = currentX;
        d.y = 100 + d.depth * 60 + (Math.sin(i * 0.3) * 15); // Subtle wave pattern
        currentX += spacing;
      });
    } else {
      // Vertical linear
      let currentY = 100;

      nodes.forEach((d, i) => {
        d.x = legendPadding + d.depth * spacing * 0.4;
        d.y = currentY;
        currentY += spacing * 0.9;
      });
    }

    return calculateOptimalBounds(hierarchy);
  },

  /**
   * Tree layout - enhanced traditional hierarchical tree
   */
  tree: (hierarchy, maxDepth, contentWidth, direction = 'horizontal') => {
    const legendPadding = 340;

    // Use more compact tree dimensions to prevent excessive height
    const treeWidth = Math.max(contentWidth * 0.8, 600);
    const treeHeight = Math.max(maxDepth * 100, 300); // Reduced height multiplier

    if (direction === 'vertical') {
      const treeLayout = d3.tree().size([treeWidth, treeHeight]);
      treeLayout(hierarchy);

      hierarchy.each((d) => {
        d.x = d.x; // Keep original x positioning
        d.y = d.y + legendPadding;
      });
    } else {
      const treeLayout = d3.tree().size([treeHeight, treeWidth]);
      treeLayout(hierarchy);

      hierarchy.each((d) => {
        const temp = d.x;
        d.x = d.y;
        d.y = temp + 100; // Offset from top
      });

      // Ensure tree doesn't start too close to legend
      const minX = legendPadding;
      let currentMinX = Infinity;
      hierarchy.each((d) => {
        if (d.x < currentMinX) currentMinX = d.x;
      });

      if (currentMinX < minX) {
        const shift = minX - currentMinX;
        hierarchy.each((d) => {
          d.x += shift;
        });
      }
    }

    return calculateOptimalBounds(hierarchy);
  },

  /**
   * Grid layout - optimized grid with better distribution
   */
  grid: (hierarchy, maxDepth, contentWidth, direction = 'horizontal') => {
    const legendPadding = 340;
    const descendants = hierarchy.descendants();
    const totalNodes = descendants.length;

    // Calculate optimal grid dimensions with better aspect ratio control
    const targetAspectRatio = 16 / 9; // Target aspect ratio
    let cols = Math.ceil(Math.sqrt(totalNodes * targetAspectRatio));
    let rows = Math.ceil(totalNodes / cols);

    // Adjust for better distribution
    if (cols * (rows - 1) >= totalNodes) rows--;

    // Ensure minimum spacing for readability
    const minCellWidth = 120; // Increased minimum cell width
    const minCellHeight = 100; // Increased minimum cell height
    const cellWidth = Math.max(minCellWidth, contentWidth / cols);
    const cellHeight = Math.max(minCellHeight, 500 / rows);

    descendants.forEach((node, i) => {
      if (direction === 'vertical') {
        const col = Math.floor(i / rows);
        const row = i % rows;
        node.x = legendPadding + col * cellWidth;
        node.y = 100 + row * cellHeight;
      } else {
        const row = Math.floor(i / cols);
        const col = i % cols;
        node.x = legendPadding + col * cellWidth;
        node.y = 100 + row * cellHeight;
      }
    });

    return calculateOptimalBounds(hierarchy);
  }
};

/**
 * Positions nodes using the specified layout algorithm with dimension store integration.
 * Enforces spacing constraints: 18px buffer around text, 12px marker-to-text spacing.
 *
 * @param {Object} hierarchy - D3 hierarchy object
 * @param {number} maxDepth - Maximum depth of the tree
 * @param {number} contentWidth - Available content width
 * @param {string} layoutStyle - Layout algorithm to use
 * @param {string} direction - Layout direction
 * @returns {Object} Bounds of the positioned nodes
 */
export function positionNodes(hierarchy, maxDepth, contentWidth, layoutStyle = 'auto', direction = 'horizontal') {
  // Clear previous positioning data
  dimensionStore.clear();

  const algorithm = LAYOUT_ALGORITHMS[layoutStyle] || LAYOUT_ALGORITHMS.auto;
  const bounds = algorithm(hierarchy, maxDepth, contentWidth, direction);

  // Register nodes with dimension store for overlap prevention
  hierarchy.each((d) => {
    const nodeCategory = d.data.isDirectory ? NODE_CATEGORIES.PRESENTATIONAL : NODE_CATEGORIES.INDICATORS;

    // Register the node shape/marker with proper positioning
    dimensionStore.setNodeDimensions(`node-${d.data.path}`, {
      x: d.y,
      y: d.x,
      width: SVG_CONFIG.nodeRadius * 2,
      height: SVG_CONFIG.nodeRadius * 2,
      category: nodeCategory,
      shape: d.data.fileType,
      nodeType: 'shape',
      path: d.data.path,
      isDirectory: d.data.isDirectory,
      buffer: SVG_CONFIG.nodeRadius + 2 // Small buffer around markers
    });

    // Register the text label separately with enforced spacing
    const textWidth = (d.data.name.length * 7); // Approximate text width
    const textHeight = 14; // Approximate text height
    const markerOffset = SVG_CONFIG.nodeRadius + 12; // 12px spacing from marker to text
    const textX = d.y + (d.children ? -markerOffset - textWidth : markerOffset);

    dimensionStore.setNodeDimensions(`text-${d.data.path}`, {
      x: textX + textWidth / 2, // Center of text for positioning calculations
      y: d.x,
      width: textWidth,
      height: textHeight,
      category: NODE_CATEGORIES.CONTEXTUAL,
      nodeType: 'text',
      textContent: d.data.name,
      isLabel: true,
      path: d.data.path,
      buffer: 18 // 18px buffer around text nodes
    });
  });

  // Resolve any overlaps detected during positioning
  dimensionStore.resolveOverlaps();

  // Update node positions based on dimension store resolution
  // This ensures no overlaps occur and all constraints are met
  hierarchy.each((d) => {
    const nodeDimensions = dimensionStore.getNodeDimensions(`node-${d.data.path}`);
    if (nodeDimensions) {
      d.y = nodeDimensions.x;
      d.x = nodeDimensions.y;
    }
  });

  return dimensionStore.getLayoutBounds();
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
 * Adds dashed strokes for service/utility files.
 *
 * @param {Object} g - D3 selection of the main group element
 * @param {Array} dependencyLinks - Array of dependency link objects with source and target properties
 * @param {Set} cycleEdges - Set of edge identifiers that are part of circular dependencies
 * @param {Object} hierarchy - D3 hierarchy object for node position lookup
 * @param {Object} pathColorMap - Flow-based path to color mapping
 */
export function renderDependencyLinks(g, dependencyLinks, cycleEdges, hierarchy, pathColorMap = {}) {
  g.selectAll(".dependency-link")
    .data(dependencyLinks)
    .enter()
    .append("path")
    .attr("class", (d) => {
      let classes = "link dependency-link";

      // Add cycle class if this link is part of a circular dependency
      if (cycleEdges.has(`${d.source.path}->${d.target.path}`)) {
        classes += " cycle-link";
      }

      // Add service class for dashed stroke if target is a service file
      if (isServiceFile(d.target.name, d.target.path)) {
        classes += " service-link";
      }

      return classes;
    })
    .attr("stroke", (d) => {
      // Find the target node to get its color
      const target = hierarchy
        .descendants()
        .find((node) => node.data.path === d.target.path);

      if (target && target.data) {
        // Use the flow-based color system
        const colorInfo = getFlowBasedColor(target.data.path, pathColorMap, target.data.isDirectory);
        return colorInfo.hex;
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
 * Renders a shape for a node based on its file type and color information.
 * Creates different geometric shapes to visually distinguish file types.
 * Handles special cases like root nodes and default directories.
 *
 * @param {Object} element - D3 selection of the node element to append the shape to
 * @param {Object} nodeData - The node data object containing file type and other properties
 * @param {Object} colorInfo - Color information object with hex, type, and hasColor properties
 * @param {boolean} isRoot - Whether this is the root node
 */
export function renderNodeShape(element, nodeData, colorInfo, isRoot = false) {
  const { hex, type, hasColor } = colorInfo;

  // Special handling for root node - home icon with inverted colors
  if (isRoot) {
    element
      .append("path")
      .attr("d", SVG_SHAPES.home)
      .attr("class", "node-shape shape-home")
      .style("--color", hex);
    return;
  }

  // Special handling for directories without colors
  if (type === 'default-directory') {
    element
      .append("circle")
      .attr("r", SVG_CONFIG.nodeRadius)
      .attr("class", "node-shape shape-directory default-directory");
    return;
  }

  // Regular node shapes with colors
  switch (nodeData.fileType) {
    case "directory":
      element
        .append("circle")
        .attr("r", SVG_CONFIG.nodeRadius)
        .attr("class", "node-shape shape-directory")
        .attr("fill", hex);
      break;

    case "script":
      // Diamond shape for JavaScript/TypeScript files
      element
        .append("path")
        .attr("d", SVG_SHAPES.diamond)
        .attr("class", "node-shape shape-script")
        .attr("fill", hex);
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
        .attr("fill", hex);
      break;

    case "image":
      // Octagon shape for image files
      element
        .append("path")
        .attr("d", SVG_SHAPES.octagon)
        .attr("class", "node-shape shape-image")
        .attr("fill", hex);
      break;

    case "multimedia":
      // 5-point star shape for media files
      element
        .append("path")
        .attr("d", SVG_SHAPES.star)
        .attr("class", "node-shape shape-multimedia")
        .attr("fill", hex);
      break;

    default:
      // Triangle shape for config and other files
      element
        .append("path")
        .attr("d", SVG_SHAPES.triangle)
        .attr("class", "node-shape shape-default")
        .attr("fill", hex);
      break;
  }
}

/**
 * Renders all nodes in the hierarchy with their shapes and labels.
 * Creates node groups with file type-specific shapes, colors, and text labels.
 * Uses the flow-based color system and handles special cases for root nodes.
 * Ensures proper spacing constraints: 18px buffer around text, 12px marker-to-text spacing.
 *
 * @param {Object} g - D3 selection of the main group element
 * @param {Object} hierarchy - D3 hierarchy object containing all positioned nodes
 * @param {string} rootDir - Root directory path
 * @param {Object} pathColorMap - Flow-based path to color mapping
 */
export function renderNodes(g, hierarchy, rootDir = "", pathColorMap = {}) {
  const node = g
    .selectAll(".node")
    .data(hierarchy.descendants())
    .enter()
    .append("g")
    .attr("class", (d) => {
      let classes = `node node--${d.data.fileType}`;
      const isRoot = d.data.path === rootDir;
      if (isRoot) classes += " root-node";
      return classes;
    })
    .attr("transform", (d) => `translate(${d.y},${d.x})`);

  // Add shapes based on file type with flow-based coloring
  node.each(function (d) {
    const element = d3.select(this);
    const isRoot = d.data.path === rootDir;
    const colorInfo = getFlowBasedColor(d.data.path, pathColorMap, d.data.isDirectory, isRoot);

    // Set CSS custom property for color
    element.style("--color", colorInfo.hex);

    renderNodeShape(element, d.data, colorInfo, isRoot);
  });

  // Add text labels with proper positioning based on node type and spacing constraints
  node
    .append("text")
    .attr("dy", "0.31em")
    .attr("x", (d) => {
      // Ensure 12px minimum distance between marker and text
      const markerOffset = SVG_CONFIG.nodeRadius + 12; // Node radius + 12px spacing
      return d.children ? -markerOffset : markerOffset;
    })
    .attr("text-anchor", (d) => (d.children ? "end" : "start"))
    .text((d) => d.data.name)
    .each(function (d) {
      // Register text dimensions with dimension store for overlap prevention
      const textElement = d3.select(this);
      const textWidth = d.data.name.length * 7; // Approximate text width
      const textHeight = 14; // Approximate text height
      const textX = d.children ? -SVG_CONFIG.nodeRadius - 12 - textWidth : SVG_CONFIG.nodeRadius + 12;

      dimensionStore.setNodeDimensions(`text-${d.data.path}`, {
        x: d.y + textX,
        y: d.x,
        width: textWidth,
        height: textHeight,
        category: NODE_CATEGORIES.CONTEXTUAL,
        nodeType: 'text',
        textContent: d.data.name,
        isLabel: true,
        path: d.data.path,
        buffer: 18 // 18px buffer around text nodes
      });
    });
}

/**
 * Renders a legend for terminal file colors and file type shapes.
 * Creates a legend that maps colors to terminal files and shapes to file types.
 *
 * @param {Object} svg - D3 SVG selection
 * @param {number} width - SVG width
 * @param {number} height - SVG height
 * @param {Object} pathColorMap - Flow-based path to color mapping
 * @param {Map<string, Object>} nodeMap - Map of file paths to node data
 * @param {number} x - X position for legend (optional, defaults to 24)
 * @param {number} y - Y position for legend (optional, defaults to 24)
 */
export function renderLegend(svg, width, height, pathColorMap, nodeMap, x = 24, y = 24) {
  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${x}, ${y})`); // Position with provided coordinates

  let yOffset = 0;

  // Find terminal files for color legend
  const terminalFiles = [];
  for (const [nodePath, nodeData] of nodeMap.entries()) {
    if (!nodeData.isDirectory && nodeData.fileType !== 'directory' && pathColorMap[nodePath]) {
      terminalFiles.push({
        name: nodeData.name,
        path: nodePath,
        color: pathColorMap[nodePath]
      });
    }
  }

  // Calculate legend background dimensions
  const colorLegendItems = terminalFiles.length;
  const shapeLegendItems = Object.keys(SHAPE_LEGEND).length;
  const totalItems = colorLegendItems + shapeLegendItems + 2; // +2 for titles
  const legendHeight = Math.max(totalItems * SVG_CONFIG.legend.itemHeight + 64, 200); // Extra padding (reduced by 24px)
  const legendWidth = 280;

  // Add legend background
  legend.append("rect")
    .attr("class", "legend-background")
    .attr("x", -10)
    .attr("y", -10)
    .attr("width", legendWidth)
    .attr("height", legendHeight);

  // Series Colors Legend
  if (terminalFiles.length > 0) {
    yOffset += 16; // Move title down by line height to prevent border overlap
    legend.append("text")
      .attr("class", "legend-title")
      .attr("x", 0)
      .attr("y", yOffset)
      .text("Series Colors");
    yOffset += SVG_CONFIG.legend.itemHeight + 5;

    terminalFiles.slice(0, 10).forEach(file => { // Limit to first 10 to avoid crowding
      const color = COLOR_PALETTE[file.color] || COLOR_PALETTE.default;

      const legendItem = legend.append("g")
        .attr("class", "legend-item")
        .attr("transform", `translate(0, ${yOffset})`);

      // Color swatch
      legendItem.append("rect")
        .attr("width", SVG_CONFIG.legend.colorBoxSize)
        .attr("height", SVG_CONFIG.legend.colorBoxSize)
        .attr("fill", color);

      // File name (truncate if too long)
      const displayName = file.name.length > 20 ? file.name.substring(0, 17) + '...' : file.name;
      legendItem.append("text")
        .attr("class", "legend-text")
        .attr("x", SVG_CONFIG.legend.colorBoxSize + SVG_CONFIG.legend.spacing)
        .attr("y", SVG_CONFIG.legend.colorBoxSize / 2)
        .attr("dy", "0.31em")
        .text(displayName);

      yOffset += SVG_CONFIG.legend.itemHeight;
    });

    yOffset += 10; // Extra spacing between sections
  }

  // File Type Marker Shapes Legend
  yOffset += 16; // Move title down by line height for proper spacing
  legend.append("text")
    .attr("class", "legend-title")
    .attr("x", 0)
    .attr("y", yOffset)
    .text("Markers Types");
  yOffset += SVG_CONFIG.legend.itemHeight + 5;

  Object.entries(SHAPE_LEGEND).forEach(([shapeType, info]) => {
    const legendItem = legend.append("g")
      .attr("class", "legend-item")
      .attr("transform", `translate(0, ${yOffset})`);

    // Shape icon
    const shapeGroup = legendItem.append("g")
      .attr("transform", `translate(${SVG_CONFIG.legend.shapeSize / 2}, ${SVG_CONFIG.legend.shapeSize / 2})`);

    // Create shape based on file type using the same logic as renderNodeShape
    const defaultColor = COLOR_PALETTE.default;
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
        .attr("d", SVG_SHAPES.octagon)
        .attr("transform", `scale(${scale})`)
        .attr("fill", color);
      break;

    case "multimedia":
      element.append("path")
        .attr("d", SVG_SHAPES.star)
        .attr("transform", `scale(${scale})`)
        .attr("fill", color);
      break;

    default:
      element.append("path")
        .attr("d", SVG_SHAPES.triangle)
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
