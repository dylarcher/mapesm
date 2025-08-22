/**
 * @fileoverview Constants and configuration values used throughout the application.
 * Defines file type mappings, color palettes, SVG configurations, styling, and console messages.
 * Central location for all application constants to ensure consistency and maintainability.
 */

/**
 * File extensions that are considered relevant source files.
 * Used to filter files during directory traversal and analysis.
 * @type {Set<string>}
 */
export const RELEVANT_EXTENSIONS = new Set([
  ".js",
  ".mjs",
  ".cjs",
  ".jsx",
  ".ts",
  ".tsx",
]);

/**
 * Directory names to ignore during file system traversal.
 * Common directories that typically don't contain relevant source code.
 * @type {Set<string>}
 */
export const DEFAULT_IGNORE = new Set([
  "node_modules",
  ".git",
  ".vscode",
  "dist",
  "build",
]);

/**
 * Color palette for nodes - simplified to use consistent colors without depth variations.
 * Each directory gets a single distinctive color for all its nodes.
 * @type {Object<string, string>}
 */
export const COLOR_PALETTE = {
  // Single colors for each directory type - no depth variations
  async: "#3b82f6",     // Blue
  core: "#0ea5e9",      // Sky blue
  data: "#10b981",      // Emerald
  dom: "#22c55e",       // Green
  forms: "#f59e0b",     // Amber
  i18n: "#ea580c",      // Orange
  platform: "#a855f7",  // Purple
  reactive: "#ec4899",   // Pink
  resilience: "#ef4444", // Red
  services: "#64748b",   // Slate
  state: "#6b7280",     // Gray
  sync: "#737373",      // Neutral
  types: "#495057",     // Dark gray
  utils: "#d97706",     // Orange-amber
  default: "#8792a2"    // Default gray-blue
};

/**
 * File type mappings for different file extensions.
 * Categorizes files into logical groups for consistent styling and shape assignment.
 * @type {Object<string, string[]>}
 */
export const FILE_TYPE_MAPPINGS = {
  script: [
    ".js", ".ts", ".jsx", ".tsx", ".mjs", ".cjs", ".py", ".rb", ".php",
    ".java", ".c", ".cpp", ".cs", ".go", ".rs", ".sh", ".bash", ".zsh",
    ".fish", ".ps1"
  ],
  style: [".css", ".scss", ".sass", ".less", ".styl", ".stylus"],
  image: [
    ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico", ".bmp",
    ".tiff", ".tif"
  ],
  multimedia: [
    ".mp4", ".mp3", ".wav", ".ogg", ".webm", ".avi", ".mov", ".mkv",
    ".flv", ".m4a", ".flac"
  ],
};

/**
 * Function to dynamically generate directory color mapping.
 * Creates distinct color families for each major module/directory.
 * This function should be called with the actual directory names found in the project.
 * @param {string[]} directoryNames - Array of directory names to map to color palettes
 * @returns {Object<string, string>} Directory name to single color mapping
 */
export function generateDirectoryColorMap(directoryNames) {
  const colorPaletteKeys = Object.keys(COLOR_PALETTE).filter(key => key !== 'default');
  const directoryColorMap = {};

  directoryNames.forEach((dirName, index) => {
    // Cycle through available colors if we have more directories than colors
    const paletteKey = colorPaletteKeys[index % colorPaletteKeys.length];
    directoryColorMap[dirName] = paletteKey;
  });

  // Always include default fallback
  directoryColorMap.default = 'default';

  return directoryColorMap;
}

/**
 * Color palette keys mapped to file types for fallback scenarios.
 * Associates each file type with a specific color palette for consistent theming.
 * @type {Object<string, string>}
 */
export const FILE_TYPE_COLOR_MAP = {
  directory: "default",
  script: "default",
  style: "default",
  image: "default",
  multimedia: "default",
  default: "default",
};

/**
 * SVG shape paths for different node types.
 * Defines custom shape geometries for visual distinction of file types.
 * @type {Object<string, string>}
 */
export const SVG_SHAPES = {
  star: "M0,-8 L2.4,-2.4 L8,0 L2.4,2.4 L0,8 L-2.4,2.4 L-8,0 L-2.4,-2.4 Z",
  trapezoid: "M-6,-4 L6,-4 L4,4 L-4,4 Z",
  tag: "M-8,-4 L4,-4 L8,0 L4,4 L-8,4 Z",
  diamond: "M0,-8 L8,0 L0,8 L-8,0 Z",
};

/**
 * SVG layout configuration.
 * Defines dimensions, spacing, and positioning parameters for the visualization layout.
 * Updated for better viewport utilization and legend space.
 * @type {Object}
 */
export const SVG_CONFIG = {
  aspectRatio: 16 / 9,
  margin: { top: 120, right: 350, bottom: 120, left: 150 }, // Increased margins for half-circle layout
  defaultWidth: 1800, // Increased default width
  levelHeight: 80, // Increased for better spacing with half-circle layout
  nodeRadius: 8,
  nodeOffset: 12,
  curveOffset: 120, // Increased curve offset for better visual separation
  legend: {
    x: 30, // Relative to right margin
    y: 50,
    itemHeight: 25,
    colorBoxSize: 12,
    shapeSize: 16,
    spacing: 8,
    fontSize: "14px",
  }
};

/**
 * CSS styles for SVG visualization.
 * Defines styling for nodes, links, legends and theme support including dark mode compatibility.
 * @type {string}
 */
export const SVG_STYLES = `
  :root {
    --bg-primary: #f7fafc;
    --text-primary: #2a2f45;
    --link-stroke: #c1c9d2;
    --cycle-stroke: #cd3d64;
    --dependency-stroke: #067ab8;
    --legend-bg: rgba(255, 255, 255, 0.95);
    --legend-border: #e2e8f0;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --bg-primary: #1a1f36;
      --text-primary: #f7fafc;
      --link-stroke: #4f566b;
      --cycle-stroke: #ed5f74;
      --dependency-stroke: #4db7e8;
      --legend-bg: rgba(26, 31, 54, 0.95);
      --legend-border: #4f566b;
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
    stroke-width: 2px !important;
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
  .shape-directory,
  .shape-script,
  .shape-style,
  .shape-image,
  .shape-multimedia,
  .shape-default {
    fill: var(--color);
  }

  /* Legend styles */
  .legend {
    font-size: 14px;
  }

  .legend-title {
    font-size: 16px;
    font-weight: bold;
    fill: var(--text-primary);
  }

  .legend-background {
    fill: var(--legend-bg);
    stroke: var(--legend-border);
    stroke-width: 1px;
    rx: 4;
  }

  .legend-text {
    fill: var(--text-primary);
    font-size: 13px;
  }

  .legend-item {
    cursor: help;
  }
`;

/**
 * Shape legend configuration for the legend
 * Maps file types to their human-readable names and descriptions
 * @type {Object<string, Object>}
 */
export const SHAPE_LEGEND = {
  directory: { name: "Directory/Folder", description: "Contains other files/folders" },
  script: { name: "Script Files", description: "JS, TS, Python, etc." },
  style: { name: "Stylesheet", description: "CSS, SCSS, LESS files" },
  image: { name: "Image Files", description: "PNG, JPG, SVG, etc." },
  multimedia: { name: "Media Files", description: "Audio, Video files" },
  default: { name: "Other Files", description: "Config, Data, etc." },
};

/**
 * Available layout styles for node positioning.
 * Each style provides a different visual arrangement of the dependency graph.
 * @type {Object<string, string>}
 */
export const LAYOUT_STYLES = {
  AUTO: "auto",
  CIRCULAR: "circular",
  DIAGONAL: "diagonal",
  LINEAR: "linear",
  HORIZONTAL: "horizontal",
  VERTICAL: "vertical",
  TREE: "tree",
  GRID: "grid"
};

/**
 * Layout style descriptions for help text and documentation.
 * @type {Object<string, string>}
 */
export const LAYOUT_DESCRIPTIONS = {
  auto: "Automatically choose the best layout based on graph size and structure",
  circular: "Arrange nodes in concentric half-circles with depth levels",
  diagonal: "Stagger nodes diagonally, indenting each level",
  linear: "Arrange nodes in a straight line progression by depth",
  horizontal: "Display nodes from left to right in horizontal bands",
  vertical: "Display nodes from top to bottom in vertical columns",
  tree: "Traditional tree layout with branching structure",
  grid: "Organize nodes in a regular grid pattern"
};

/**
 * Default CLI options.
 * Provides sensible defaults for command line arguments and options.
 * @type {Object}
 */
export const DEFAULT_CLI_OPTIONS = {
  output: "tmp/dependency-graph.svg",
  depth: Infinity,
  hidden: false,
  layout: LAYOUT_STYLES.AUTO,
};

/**
 * Console message templates.
 * Standardized messages for user feedback during analysis and visualization process.
 * @type {Object<string, string>}
 */
export const MESSAGES = {
  INITIALIZING: "Codebase Visualizer Initializing...",
  FINDING_FILES: "Finding source files...",
  PARSING_FILES: "Parsing files and building dependency graph...",
  DETECTING_CYCLES: "Detecting circular dependencies...",
  GENERATING_SVG: "🎨 Generating SVG visualization...",
  SUCCESS: "✔️  Success! Visualization saved to",
  ERROR: "✖️ An unexpected error occurred:",
  NO_FILES_ERROR: "No source files found in \"{rootDir}\". Please specify a directory with JavaScript or TypeScript files.",
  CYCLES_FOUND: "⚠️  Found {count} circular dependenc(ies):",
  NO_CYCLES: "✅ No circular dependencies found.",
};
