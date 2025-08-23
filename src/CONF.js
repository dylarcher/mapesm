/**
 * @fileoverview Constants and configuration values used throughout the application.
 * Defines file type mappings, color palettes, SVG configurations, styling, and console messages.
 * Central location for all application constants to ensure consistenexport const SVG_SHAPES = {
  star: "M0,-8 L2.4,-2.4 L8,0 L2.4,2.4 L0,8 L-2.4,2.4 L-8,0 L-2.4,-2.4 Z",
  trapezoid: "M-6,-4 L6,-4 L4,4 L-4,4 Z",
  tag: "M0,-8 L2.4,-2.4 L8,0 L2.4,2.4 L0,8 L-2.4,2.4 L-8,0 L-2.4,-2.4 Z", // Star shape for other files
  diamond: "M0,-8 L8,0 L0,8 L-8,0 Z",
  home: "M-5,3 C-5,1.3 -3.7,0 -2,0 C-0.3,0 1,1.3 1,3 C1,4.7 -0.3,6 -2,6 C-3.7,6 -5,4.7 -5,3 Z M1,-6 L7,6", // "./" shape: dot (circle) and forward slash (line)
};maintainability.
 */

import path from "path";

/**
 * Theme mode constants for the visualization.
 * @type {Object<string, string>}
 */
export const THEME_MODES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
  AUTO: "auto"
};

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
 * Vibrant color palette for nodes with distinct hues and high visibility.
 * Colors are carefully selected to ensure no two look too similar and maintain
 * consistent vibrancy and brightness across all hues.
 * @type {Object<string, string>}
 */
export const COLOR_PALETTE = {
  // Vibrant primary colors with optimal distinctiveness
  blue: "#2563eb",       // Vibrant blue
  orange: "#ea580c",     // Vibrant orange
  yellow: "#eab308",     // Vibrant yellow
  purple: "#9333ea",     // Vibrant purple
  pink: "#ec4899",       // Vibrant pink
  red: "#dc2626",        // Vibrant red
  green: "#16a34a",      // Vibrant green
  cyan: "#06b6d4",       // Vibrant cyan
  violet: "#7c3aed",     // Vibrant violet
  olive: "#84cc16",      // Vibrant olive/lime
  sage: "#10b981",       // Vibrant sage/emerald
  amber: "#f59e0b",      // Vibrant amber
  brown: "#a16207",      // Vibrant brown
  grey: "#64748b",       // Vibrant grey
  maroon: "#b91c1c",     // Vibrant maroon

  // Additional distinct hues for variety
  teal: "#0d9488",       // Vibrant teal
  indigo: "#4338ca",     // Vibrant indigo
  rose: "#e11d48",       // Vibrant rose
  lime: "#65a30d",       // Vibrant lime
  sky: "#0284c7",        // Vibrant sky blue
  mint: "#059669",       // Vibrant mint
  coral: "#f97316",      // Vibrant coral
  lavender: "#8b5cf6",   // Vibrant lavender
  gold: "#ca8a04",       // Vibrant gold
  forest: "#166534",     // Vibrant forest green
  crimson: "#be123c",    // Vibrant crimson
  aqua: "#0891b2",       // Vibrant aqua
  plum: "#a21caf",       // Vibrant plum
  bronze: "#92400e",     // Vibrant bronze
  slate: "#475569",      // Vibrant slate

  // Directory mappings (can be overridden dynamically)
  async: "#2563eb",      // Blue
  core: "#9333ea",       // Purple
  data: "#10b981",       // Sage/emerald
  dom: "#16a34a",        // Green
  forms: "#f59e0b",      // Amber
  i18n: "#ea580c",       // Orange
  platform: "#7c3aed",   // Violet
  reactive: "#ec4899",   // Pink
  resilience: "#dc2626", // Red
  services: "#06b6d4",   // Cyan
  state: "#84cc16",      // Olive/lime
  sync: "#0d9488",       // Teal
  types: "#4338ca",      // Indigo
  utils: "#ca8a04",      // Gold
  components: "#e11d48", // Rose
  modules: "#65a30d",    // Lime
  config: "#8b5cf6",     // Lavender
  assets: "#f97316",     // Coral
  styles: "#059669",     // Mint
  tests: "#0284c7",      // Sky

  default: "#64748b"     // Default vibrant grey
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
 * Generates a color map for terminal files (files with extensions) and their flow paths.
 * This creates a mapping where each terminal file gets a unique color, and all nodes
 * in the path leading to that terminal file inherit the same color.
 * @param {Map<string, Object>} nodeMap - Map of file paths to node data
 * @param {string} rootDir - Root directory path
 * @returns {Object} Flow-based color mapping
 */
export function generateFlowBasedColorMap(nodeMap, rootDir) {
  const terminalFiles = [];
  const pathColorMap = {};

  // Find all terminal files (files with extensions that aren't directories)
  for (const [nodePath, nodeData] of nodeMap.entries()) {
    if (!nodeData.isDirectory && nodeData.fileType !== 'directory') {
      terminalFiles.push(nodePath);
    }
  }

  // Define primary vibrant colors in order of preference
  const primaryColors = [
    'blue', 'orange', 'green', 'purple', 'red', 'cyan', 'yellow', 'pink',
    'violet', 'teal', 'lime', 'amber', 'rose', 'indigo', 'mint', 'coral'
  ];

  // Secondary colors for when we need more variety
  const secondaryColors = [
    'sage', 'olive', 'brown', 'grey', 'maroon', 'lavender', 'gold',
    'forest', 'crimson', 'aqua', 'plum', 'bronze', 'slate', 'sky'
  ];

  const allColors = [...primaryColors, ...secondaryColors];
  const usedColors = new Set();

  // Function to calculate color distance (simplified HSV distance)
  const getColorDistance = (color1, color2) => {
    const colorValues = {
      blue: [240, 100, 92], orange: [22, 95, 92], green: [142, 76, 65], purple: [271, 81, 92],
      red: [0, 82, 86], cyan: [188, 95, 83], yellow: [48, 95, 92], pink: [328, 81, 93],
      violet: [258, 90, 93], teal: [180, 91, 58], lime: [84, 85, 65], amber: [43, 96, 96],
      rose: [348, 83, 88], indigo: [238, 85, 79], mint: [160, 95, 41], coral: [20, 95, 98]
    };

    const [h1, s1, v1] = colorValues[color1] || [0, 0, 50];
    const [h2, s2, v2] = colorValues[color2] || [0, 0, 50];

    const hDiff = Math.min(Math.abs(h1 - h2), 360 - Math.abs(h1 - h2));
    const sDiff = Math.abs(s1 - s2);
    const vDiff = Math.abs(v1 - v2);

    return Math.sqrt(hDiff * hDiff * 0.7 + sDiff * sDiff * 0.2 + vDiff * vDiff * 0.1);
  };

  // Assign colors to terminal files
  terminalFiles.forEach((terminalPath, index) => {
    let bestColor = null;
    let maxMinDistance = 0;

    // Try each available color and find the one with maximum minimum distance to used colors
    for (const color of allColors) {
      if (usedColors.has(color)) continue;

      let minDistance = Infinity;
      for (const usedColor of usedColors) {
        const distance = getColorDistance(color, usedColor);
        minDistance = Math.min(minDistance, distance);
      }

      // For first color, just use the first available
      if (usedColors.size === 0 || minDistance > maxMinDistance) {
        maxMinDistance = minDistance;
        bestColor = color;
      }
    }

    // If all colors are used, cycle through primary colors with offset
    if (!bestColor) {
      bestColor = primaryColors[index % primaryColors.length];
    }

    // Apply color to the terminal file and all nodes in its path
    const relativePath = path.relative(rootDir, terminalPath);
    const pathParts = relativePath.split(path.sep);

    for (let i = 0; i < pathParts.length; i++) {
      const partialPath = path.join(rootDir, ...pathParts.slice(0, i + 1));
      pathColorMap[partialPath] = bestColor;
    }

    usedColors.add(bestColor);
  });

  return pathColorMap;
}

/**
 * Legacy generateDirectoryColorMap function for backward compatibility.
 * Now delegates to the new flow-based color system.
 * @deprecated Use generateFlowBasedColorMap instead
 */
export function generateDirectoryColorMap(directoryNames) {
  // This function is kept for backward compatibility but is no longer the primary coloring method
  return {};
}/**
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
  star: "M0,-8 L1.2,-1.2 L8,-1.2 L2.4,2.4 L4,8 L0,4.8 L-4,8 L-2.4,2.4 L-8,-1.2 L-1.2,-1.2 Z", // 5-point star for media files
  triangle: "M0,-8 L6,6 L-6,6 Z", // Triangle shape for other files
  octagon: "M0,-8 L2.4,-2.4 L8,0 L2.4,2.4 L0,8 L-2.4,2.4 L-8,0 L-2.4,-2.4 Z", // Octagon shape for image files
  tag: "M-8,-4 L4,-4 L8,0 L4,4 L-8,4 Z", // Tag shape for legacy compatibility
  diamond: "M0,-8 L8,0 L0,8 L-8,0 Z",
  home: "M-6,-6 C-6,-6 -6,-6 -6,-6 L-3,-6 L0,-2 L3,-6 L6,-6 L6,6 L-6,6 Z", // "./" (dot with forward slash) shape
};

/**
 * Directory and file classification patterns.
 * Used to identify service/utility files that should have dashed strokes.
 * @type {Object<string, RegExp[]>}
 */
export const FILE_CLASSIFICATIONS = {
  service: [
    /service/i, /util/i, /helper/i, /config/i, /middleware/i, /handler/i,
    /manager/i, /provider/i, /adapter/i, /repository/i, /dao/i
  ]
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
 * @param {string} mode - Theme mode: 'light', 'dark', or 'system'/'auto'
 * @returns {string} CSS styles string
 */
export function getSVGStyles(mode = THEME_MODES.SYSTEM) {
  const baseStyles = `
  :root {
    --bg-primary: #f7fafc;
    --text-primary: #2a2f45;
    --link-stroke: #c1c9d2;
    --cycle-stroke: #cd3d64;
    --dependency-stroke: #067ab8;
    --legend-bg: rgba(255, 255, 255, 0.95);
    --legend-border: #e2e8f0;
    --default-directory-stroke: #9ca3af;
    --default-directory-fill: var(--bg-primary);
  }

  ${mode === THEME_MODES.DARK ? `
  :root {
    --bg-primary: #1a1f36;
    --text-primary: #f7fafc;
    --link-stroke: #4f566b;
    --cycle-stroke: #ed5f74;
    --dependency-stroke: #4db7e8;
    --legend-bg: rgba(26, 31, 54, 0.95);
    --legend-border: #4f566b;
    --default-directory-stroke: #6b7280;
    --default-directory-fill: var(--bg-primary);
  }
  ` : mode === THEME_MODES.SYSTEM || mode === THEME_MODES.AUTO ? `
  @media (prefers-color-scheme: dark) {
    :root {
      --bg-primary: #1a1f36;
      --text-primary: #f7fafc;
      --link-stroke: #4f566b;
      --cycle-stroke: #ed5f74;
      --dependency-stroke: #4db7e8;
      --legend-bg: rgba(26, 31, 54, 0.95);
      --legend-border: #4f566b;
      --default-directory-stroke: #6b7280;
      --default-directory-fill: var(--bg-primary);
    }
  }
  ` : ''}

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

  .service-link {
    stroke-dasharray: 3,3;
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

  .default-directory {
    fill: var(--default-directory-fill);
    stroke: var(--default-directory-stroke);
    stroke-width: 2px;
  }

  .root-node .node-shape {
    stroke: var(--color);
    stroke-width: 2px;
    fill: var(--bg-primary);
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

  return baseStyles;
}

/**
 * Legacy SVG_STYLES constant for backward compatibility.
 * @type {string}
 */
export const SVG_STYLES = getSVGStyles();

/**
 * Shape legend configuration for the legend
 * Maps file types to their human-readable names and descriptions
 * @type {Object<string, Object>}
 */
export const SHAPE_LEGEND = {
  directory: { name: "Directory", description: "Contains other files/folders" },
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
  TREE: "tree",
  GRID: "grid"
};

/**
 * Direction modes for chart layout flow.
 * Determines the primary flow direction of the visualization.
 * @type {Object<string, string>}
 */
export const DIRECTION_MODES = {
  HORIZONTAL: "horizontal",
  // VERTICAL: "vertical" // TEMPORARILY DISABLED - needs layout fixes
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
  tree: "Traditional tree layout with branching structure",
  grid: "Organize nodes in a regular grid pattern"
};

/**
 * Direction mode descriptions for help text and documentation.
 * @type {Object<string, string>}
 */
export const DIRECTION_DESCRIPTIONS = {
  horizontal: "Chart flows from left to right",
  vertical: "Chart flows from top to bottom"
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
  mode: THEME_MODES.SYSTEM,
  direction: DIRECTION_MODES.HORIZONTAL,
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
