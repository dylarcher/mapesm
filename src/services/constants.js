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
 * Color palette organized by depth (light to dark) for different file types.
 * Each palette provides a gradient from light to dark colors for visual hierarchy.
 * @type {Object<string, string[]>}
 */
export const COLOR_PALETTE = {
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
 * Color palette keys mapped to file types.
 * Associates each file type with a specific color palette for consistent theming.
 * @type {Object<string, string>}
 */
export const FILE_TYPE_COLOR_MAP = {
  directory: "blue",
  script: "green",
  style: "purple",
  image: "orange",
  multimedia: "red",
  default: "grey",
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
 * @type {Object}
 */
export const SVG_CONFIG = {
  aspectRatio: 16 / 9,
  margin: { top: 100, right: 100, bottom: 100, left: 100 },
  defaultWidth: 1600,
  levelHeight: 80,
  nodeRadius: 8,
  nodeOffset: 12,
  curveOffset: 100,
};

/**
 * CSS styles for SVG visualization.
 * Defines styling for nodes, links, and theme support including dark mode compatibility.
 * @type {string}
 */
export const SVG_STYLES = `
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
  .shape-directory,
  .shape-script,
  .shape-style,
  .shape-image,
  .shape-multimedia,
  .shape-default {
    fill: var(--color);
  }
`;

/**
 * Default CLI options.
 * Provides sensible defaults for command line arguments and options.
 * @type {Object}
 */
export const DEFAULT_CLI_OPTIONS = {
  output: "tmp/dependency-graph.svg",
  depth: Infinity,
  hidden: false,
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
