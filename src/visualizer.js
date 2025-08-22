import * as d3 from "d3";
import { JSDOM } from "jsdom";
import path from "path";
import xmlserializer from "xmlserializer";

// Color palette organized by depth (light to dark)
const colorPalette = {
  blue: [
    "#f5fbff",
    "#d6ecff",
    "#a4cdfe",
    "#7dabf8",
    "#6c8eef",
    "#5469d4",
    "#3d4eac",
    "#2f3d89",
    "#212d63",
    "#131f41",
  ],
  cyan: [
    "#edfdfd",
    "#c4f1f9",
    "#7fd3ed",
    "#4db7e8",
    "#3a97d4",
    "#067ab8",
    "#075996",
    "#06457a",
    "#093353",
    "#042235",
  ],
  green: [
    "#efffed",
    "#cbf4c9",
    "#85d996",
    "#33c27f",
    "#1ea672",
    "#09825d",
    "#0e6245",
    "#0d4b3b",
    "#0b3733",
    "#082429",
  ],
  purple: [
    "#f8f9fe",
    "#e6e6fc",
    "#c7c2ea",
    "#b0a1e1",
    "#9c82db",
    "#8260c3",
    "#61469b",
    "#4b3480",
    "#352465",
    "#1f184e",
  ],
  violet: [
    "#fff8fe",
    "#fce0f6",
    "#f0b4e4",
    "#e28ddc",
    "#c96ed0",
    "#a450b5",
    "#7b3997",
    "#5b2b80",
    "#401d6a",
    "#2d0f55",
  ],
  red: [
    "#fff8f5",
    "#fde2dd",
    "#fbb5b2",
    "#fa8389",
    "#ed5f74",
    "#cd3d64",
    "#a41c4e",
    "#80143f",
    "#5e1039",
    "#420828",
  ],
  orange: [
    "#fffaee",
    "#fee3c0",
    "#f8b886",
    "#f5925e",
    "#e56f4a",
    "#c44c34",
    "#9e2f28",
    "#7e1e23",
    "#5d161b",
    "#420e11",
  ],
  yellow: [
    "#fcf9e9",
    "#f8e5b9",
    "#efc078",
    "#e5993e",
    "#d97917",
    "#bb5504",
    "#983705",
    "#762b0b",
    "#571f0d",
    "#3a1607",
  ],
  grey: [
    "#f7fafc",
    "#e3e8ee",
    "#c1c9d2",
    "#a3acb9",
    "#8792a2",
    "#697386",
    "#4f566b",
    "#3c4257",
    "#2a2f45",
    "#1a1f36",
  ],
};

// File type detection functions
function getFileType(filename) {
  if (!filename) return "directory";

  const ext = path.extname(filename).toLowerCase();
  const basename = path.basename(filename).toLowerCase();

  // Scripts
  if (
    [
      ".js",
      ".ts",
      ".jsx",
      ".tsx",
      ".mjs",
      ".cjs",
      ".py",
      ".rb",
      ".php",
      ".java",
      ".c",
      ".cpp",
      ".cs",
      ".go",
      ".rs",
      ".sh",
      ".bash",
      ".zsh",
      ".fish",
      ".ps1",
    ].includes(ext)
  ) {
    return "script";
  }

  // Styles
  if ([".css", ".scss", ".sass", ".less", ".styl", ".stylus"].includes(ext)) {
    return "style";
  }

  // Images
  if (
    [
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".svg",
      ".webp",
      ".ico",
      ".bmp",
      ".tiff",
      ".tif",
    ].includes(ext)
  ) {
    return "image";
  }

  // Multimedia
  if (
    [
      ".mp4",
      ".mp3",
      ".wav",
      ".ogg",
      ".webm",
      ".avi",
      ".mov",
      ".mkv",
      ".flv",
      ".m4a",
      ".flac",
    ].includes(ext)
  ) {
    return "multimedia";
  }

  // Config and data files get default shape
  return "default";
}

function getColorByDepth(depth, maxDepth, fileType = "directory") {
  // Select palette based on file type
  let paletteKey = "blue"; // Default
  switch (fileType) {
    case "directory":
      paletteKey = "blue";
      break;
    case "script":
      paletteKey = "green";
      break;
    case "style":
      paletteKey = "purple";
      break;
    case "image":
      paletteKey = "orange";
      break;
    case "multimedia":
      paletteKey = "red";
      break;
    case "default":
      paletteKey = "grey";
      break;
  }

  const palette = colorPalette[paletteKey];
  const index = Math.min(
    Math.floor((depth / Math.max(maxDepth, 1)) * (palette.length - 1)),
    palette.length - 1
  );
  return palette[index];
}

/**
 * Generates an SVG visualization of the dependency graph.
 * @param {{nodes: Map, edges: Map}} graph - The dependency graph.
 * @param {string} cycles - Array of detected circular dependencies.
 * @param {string} rootDir - The absolute path to the project root.
 * @param {object} options - CLI options.
 * @returns {string} The serialized SVG content.
 */
export function generateSVG(graph, cycles, rootDir, options) {
  // --- 1. Data Transformation ---
  // Convert flat graph into a D3-compatible hierarchical structure. [7, 8, 9]
  const root = {
    name: path.basename(rootDir),
    children: [],
    isDirectory: true,
    path: rootDir,
    fileType: "directory",
    depth: 0,
  };
  const nodeMap = new Map();

  // First pass: calculate max depth
  let maxDepth = 0;
  for (const nodePath of graph.nodes.keys()) {
    const relativePath = path.relative(rootDir, nodePath);
    const depth = relativePath.split(path.sep).length;
    maxDepth = Math.max(maxDepth, depth);
  }

  for (const nodePath of graph.nodes.keys()) {
    const relativePath = path.relative(rootDir, nodePath);
    const parts = relativePath.split(path.sep);
    let currentLevel = root;

    parts.forEach((part, i) => {
      const isLastPart = i === parts.length - 1;
      const currentPath = path.join(rootDir, ...parts.slice(0, i + 1));
      const currentDepth = i + 1;

      let childNode = nodeMap.get(currentPath);
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
        nodeMap.set(currentPath, childNode);
      }
      currentLevel = childNode;
    });
  }

  // --- 2. D3 Layout Calculation ---
  const hierarchy = d3.hierarchy(root);

  // Store maxDepth for color calculation
  const finalMaxDepth = maxDepth;

  // Calculate 16:9 aspect ratio dimensions first
  const aspectRatio = 16 / 9;
  const margin = { top: 100, right: 100, bottom: 100, left: 100 };

  // Start with minimum dimensions
  let width = 1600; // Increased for better spacing
  let height = width / aspectRatio;

  // Calculate available space for content
  const contentWidth = width - margin.left - margin.right;
  const contentHeight = height - margin.top - margin.bottom;

  // Custom positioning: distribute nodes evenly across depth levels
  const levelWidth = contentWidth / Math.max(maxDepth, 1); // Dynamic width per level
  const levelHeight = 80; // Vertical spacing between nodes

  // Position nodes based on their depth level
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

  // Position nodes vertically within each level
  nodesByLevel.forEach((nodes, level) => {
    const totalHeight = (nodes.length - 1) * levelHeight;
    const startY = -totalHeight / 2;

    nodes.forEach((node, i) => {
      node.x = startY + i * levelHeight;
    });
  });

  // Calculate bounds from positioned nodes
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  hierarchy.each((d) => {
    if (d.x < minX) minX = d.x;
    if (d.x > maxX) maxX = d.x;
    if (d.y < minY) minY = d.y;
    if (d.y > maxY) maxY = d.y;
  });

  // Adjust dimensions if content is larger than expected
  const actualContentWidth = maxY - minY;
  const actualContentHeight = maxX - minX;

  if (actualContentWidth + margin.left + margin.right > width) {
    width = actualContentWidth + margin.left + margin.right;
    height = width / aspectRatio;
  }

  if (actualContentHeight + margin.top + margin.bottom > height) {
    height = actualContentHeight + margin.top + margin.bottom;
    width = height * aspectRatio;
  }

  // --- 3. Server-Side SVG Rendering Setup ---
  const dom = new JSDOM("<!DOCTYPE html><body></body>"); // [11]
  const body = d3.select(dom.window.document.body);

  const svg = body
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("xmlns", "http://www.w3.org/2000/svg");

  const g = svg
    .append("g")
    .attr(
      "transform",
      `translate(${margin.left - minY}, ${margin.top - minX})`
    );

  // --- 4. Embed CSS for Styling and Theming ---
  // [12]
  const styles = `
        :root {
            --bg-primary: #f7fafc;
            --text-primary: #2a2f45;
            --link-stroke: #c1c9d2;
            --cycle-stroke: #cd3d64;
            --dependency-stroke: #067ab8;
        }
        @media (prefers-color-scheme: dark) {
            :root {
                --bg-primary: #1a1f36;
                --text-primary: #f7fafc;
                --link-stroke: #4f566b;
                --cycle-stroke: #ed5f74;
                --dependency-stroke: #4db7e8;
            }
        }
        svg {
            background-color: var(--bg-primary);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            font-size: 12px;
        }
        .link {
            fill: none;
            stroke: var(--link-stroke);
            stroke-opacity: 0.6;
            stroke-width: 1px;
        }
        .dependency-link {
            stroke: var(--dependency-stroke);
            stroke-opacity: 0.8;
        }
        .cycle-link {
            stroke: var(--cycle-stroke) !important;
            stroke-width: 1px !important;
            stroke-opacity: 1;
        }
        .node-shape {
            stroke: none;
        }
        .node text {
            fill: var(--text-primary);
            paint-order: stroke;
            stroke: var(--bg-primary);
            stroke-width: 2px;
            stroke-linecap: butt;
            stroke-linejoin: miter;
        }
        /* Shape definitions */
        .shape-directory {
            fill: var(--color);
        }
        .shape-script {
            fill: var(--color);
        }
        .shape-style {
            fill: var(--color);
        }
        .shape-image {
            fill: var(--color);
        }
        .shape-multimedia {
            fill: var(--color);
        }
        .shape-default {
            fill: var(--color);
        }
    `;
  svg.append("defs").append("style").text(styles);

  // Add shape definitions to defs
  const defs = svg.select("defs");

  // Star shape for images
  const starPath =
    "M0,-8 L2.4,-2.4 L8,0 L2.4,2.4 L0,8 L-2.4,2.4 L-8,0 L-2.4,-2.4 Z";

  // Trapezoid path for multimedia
  const trapezoidPath = "M-6,-4 L6,-4 L4,4 L-4,4 Z";

  // Arrow/tag shape for default files
  const tagPath = "M-8,-4 L4,-4 L8,0 L4,4 L-8,4 Z";

  // --- 5. Render Links ---
  // Structural links (parent-child)
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
    ); // [8, 13]

  // Dependency links (import/export)
  const cycleEdges = new Set();
  cycles.forEach((cycle) => {
    for (let i = 0; i < cycle.length; i++) {
      const source = cycle[i];
      const target = cycle[(i + 1) % cycle.length];
      cycleEdges.add(`${source}->${target}`);
      cycleEdges.add(`${target}->${source}`); // Consider both directions for highlighting
    }
  });

  const dependencyLinks = [];
  for (const [sourcePath, targets] of graph.edges.entries()) {
    for (const targetPath of targets) {
      const sourceNode = nodeMap.get(sourcePath);
      const targetNode = nodeMap.get(targetPath);
      if (sourceNode && targetNode) {
        dependencyLinks.push({ source: sourceNode, target: targetNode });
      }
    }
  }

  g.selectAll(".dependency-link")
    .data(dependencyLinks)
    .enter()
    .append("path")
    .attr(
      "class",
      (d) =>
        `link dependency-link ${cycleEdges.has(`${d.source.path}->${d.target.path}`) ? "cycle-link" : ""}`
    )
    .attr("d", (d) => {
      const source = hierarchy
        .descendants()
        .find((node) => node.data.path === d.source.path);
      const target = hierarchy
        .descendants()
        .find((node) => node.data.path === d.target.path);
      if (!source || !target) return "";
      const path = d3.path();
      path.moveTo(source.y, source.x);
      path.bezierCurveTo(
        source.y + 100,
        source.x,
        target.y - 100,
        target.x,
        target.y,
        target.x
      );
      return path.toString();
    });

  // --- 6. Render Nodes ---
  const node = g
    .selectAll(".node")
    .data(hierarchy.descendants())
    .enter()
    .append("g")
    .attr("class", (d) => `node node--${d.data.fileType}`)
    .attr("transform", (d) => `translate(${d.y},${d.x})`)
    .style("--color", (d) =>
      getColorByDepth(d.data.depth || 0, finalMaxDepth, d.data.fileType)
    );

  // Add shapes based on file type
  node.each(function (d) {
    const element = d3.select(this);
    const color = getColorByDepth(
      d.data.depth || 0,
      finalMaxDepth,
      d.data.fileType
    );

    switch (d.data.fileType) {
      case "directory":
        element
          .append("circle")
          .attr("r", 8)
          .attr("class", "node-shape shape-directory")
          .attr("fill", color);
        break;

      case "script":
        // Diamond shape
        element
          .append("path")
          .attr("d", "M0,-8 L8,0 L0,8 L-8,0 Z")
          .attr("class", "node-shape shape-script")
          .attr("fill", color);
        break;

      case "style":
        // Square shape
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
        // Star shape
        element
          .append("path")
          .attr("d", starPath)
          .attr("class", "node-shape shape-image")
          .attr("fill", color);
        break;

      case "multimedia":
        // Trapezoid shape
        element
          .append("path")
          .attr("d", trapezoidPath)
          .attr("class", "node-shape shape-multimedia")
          .attr("fill", color);
        break;

      default:
        // Tag/label shape
        element
          .append("path")
          .attr("d", tagPath)
          .attr("class", "node-shape shape-default")
          .attr("fill", color);
        break;
    }
  });

  node
    .append("text")
    .attr("dy", "0.31em")
    .attr("x", (d) => (d.children ? -12 : 12))
    .attr("text-anchor", (d) => (d.children ? "end" : "start"))
    .text((d) => d.data.name);

  // --- 7. Serialize and Return SVG ---
  return xmlserializer.serializeToString(svg.node()); // [11]
}
