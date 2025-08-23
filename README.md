# Codebase Visualizer

A professional-grade CLI tool to analyze a JavaScript/TypeScript codebase, map its module dependencies, and render the relationships as a sophisticated, accessible, and aesthetically pleasing hierarchical diagram with intelligent overlap prevention.

The generated SVG is interactive, themeable (light/dark mode), and designed with accessibility in mind, using modern color formats that adhere to WCAG 2.2 AA contrast standards. Features advanced node positioning logic that prevents visual overlaps while maintaining readability.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Advanced Features](#advanced-features)
- [How It Works](#how-it-works)
- [Documentation](#documentation)
- [Examples](#examples)
- [Contributing](#contributing)

## Features

- **Hierarchical Visualization**: Generates a tree diagram representing your project's file and directory structure.
- **Dependency Mapping**: Draws connections between modules to show `import` and `export` relationships.
- **Circular Dependency Detection**: Automatically identifies and highlights circular dependencies, a common source of bugs and architectural issues.
- **Intelligent Node Positioning**: Advanced dimension store system with Proxy API that prevents overlapping based on node categories:
  - **Contextual Nodes** (text/labels): Cannot overlap with other text nodes or their 18px buffer zones
  - **Presentational Nodes** (lines/borders/containers): Can overlap with text nodes but maintain spacing from indicators
  - **Indicator Nodes** (markers/shapes/icons): Cannot overlap with text node buffer zones but can overlap with presentational elements
- **Adaptive Layout Algorithms**: Six layout styles with intelligent auto-selection based on graph characteristics:
  - `auto` - Analyzes graph structure and automatically selects optimal layout
  - `circular` - Concentric arc arrangements with adaptive spacing
  - `diagonal` - Staggered positioning with depth-based indentation
  - `linear` - Optimized straight-line progression with depth offsets
  - `tree` - Enhanced traditional hierarchical tree with improved visibility
  - `grid` - Smart grid arrangement with optimal aspect ratio calculation
- **Modern & Accessible UI**:
  - Vibrant color palettes using the perceptually uniform OKLCH color space.
  - WCAG 2.2 AA compliant contrast ratios.
  - Automatic light and dark mode theming based on system preference.
  - Hex color fallbacks for older SVG viewers.
- **Highly Customizable**: Control the output with various CLI options, including directory path, analysis depth, output file, and more.
- **Server-Side Rendering**: Built with Node.js to generate a static, self-contained SVG file without needing a browser.

## Installation

Install the package globally using npm to make the `visualize` command available in your terminal.bash
npm install -g codebase-visualizer

> Note: This is a demonstration package. To install from local files, you would run `npm link` from the project root after cloning.

## Usage

Navigate to your project's root directory and run the command:

```bash
visualize [path][options]
```

### Arguments

- `[path]`: (Optional) The path to the directory you want to analyze. Defaults to the current directory (`.`).

### Options

- `-o, --output <file>`: Specify the output file name. (default: `"dependency-graph.svg"`)
- `-d, --depth <level>`: Limit the analysis to a specific directory depth. (default: `Infinity`)
- `-l, --layout <style>`: Layout style for node positioning: auto, circular, diagonal, linear, tree, grid
- `-m, --mode <mode>`: Theme mode: light, dark, system, auto
- `--direction <direction>` or `--dir <direction>`: Chart flow direction: horizontal *(vertical temporarily disabled)*
- `--hidden`: Include hidden files and folders *(temporarily disabled due to performance issues)*
- `-h, --help`: Display help for command.

### Examples

**Analyze the current directory and save to `dependency-graph.svg`:**

```bash
visualize
```

**Analyze a specific sub-directory:**

```bash
visualize./src
```

**Analyze the current directory and save the output to a custom file:**

```bash
visualize. --output "my-project-map.svg"
```

**Use auto layout with dark theme:**

```bash
visualize ./src --layout auto --mode dark
```

**Analyze with specific depth and layout:**

```bash
visualize ./app --depth 3 --layout circular --mode light
```

## Contributing

We welcome contributions to improve the Codebase Visualizer! Here's how you can help:

### Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Run tests: `npm test`
4. Generate demos: `npm run generate:demos`

### Architecture Overview

- **`src/main.js`** - Main orchestration and analysis pipeline
- **`src/services/`** - Core services (consumer, provider, visualizer, dimension-store)
- **`src/CONF.js`** - Configuration, constants, and color palettes
- **`src/utils.js`** - Utility functions and helpers
- **`bin/`** - CLI entry points and demo generation
- **`test/`** - Comprehensive test suites including unit, integration, and style tests

### Testing

The project includes comprehensive test coverage:

```bash
npm test                    # Run all tests
npm run test:units         # Run unit tests
npm run test:style         # Run style/layout tests
npm run test:state         # Run with coverage reporting
```

### Submitting Changes

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Make your changes and add tests
3. Run the test suite to ensure everything passes
4. Generate demo charts to verify visual output
5. Submit a pull request with a clear description

---

**License**: MIT
**Author**: Award-Winning Writer
**Repository**: Built with modern JavaScript, D3.js, TypeScript Compiler API, and JSDOM

## Advanced Features

### Dimension Store System

The library uses a sophisticated dimension store with Proxy API to track and manage all node dimensions and positions:

- **Reactive Positioning**: Automatically recalculates positions when nodes are added or moved
- **Category-Based Rules**: Enforces different overlap rules based on node type
- **Buffer Management**: Maintains appropriate spacing around text elements (18px buffer)
- **Conflict Resolution**: Automatically repositions nodes to prevent visual conflicts

### Intelligent Layout Selection

The auto layout algorithm analyzes graph characteristics to select optimal positioning:

```bash
# Small graphs (≤8 nodes) → Linear layout
# High branching factor + shallow → Circular layout
# Deep hierarchies (>6 levels) → Diagonal layout
# Wide aspect ratios (>3:1) → Linear layout
# Leaf-heavy structures → Tree layout
```

## How It Works

1. **CLI Interface**: Built with **Commander.js** for robust and user-friendly command-line argument parsing.
2. **File System Traversal**: Recursively scans the target directory using modern, efficient Node.js `fs` APIs.
3. **Code Parsing**: Leverages the powerful **TypeScript Compiler API** to parse JavaScript and TypeScript files into Abstract Syntax Trees (ASTs). This high-fidelity approach allows for accurate extraction of `import`/`export` relationships, including support for path aliases from `tsconfig.json`.
4. **Graph Construction**: Builds an in-memory directed graph of all module dependencies.
5. **Cycle Detection**: A Depth-First Search (DFS) algorithm traverses the graph to identify and report any circular dependencies.
6. **Dimension Store Integration**: Each node is registered with the dimension store, which categorizes nodes and tracks their positions using a Proxy API for reactive updates.
7. **Intelligent Layout**: The auto-selection algorithm analyzes graph characteristics (node count, depth, branching factor) to choose the optimal layout algorithm.
8. **Overlap Prevention**: The dimension store automatically detects and resolves overlaps based on node categories and buffer rules.
9. **Visualization**: Uses **D3.js** to calculate layout positioning with custom algorithms. The layout is rendered into a virtual DOM on the server using **JSDOM**.
10. **SVG Generation**: The final diagram is serialized into a valid SVG string using `xmlserializer` and saved to a file. The SVG includes embedded CSS with modern features like `oklch()` colors and `prefers-color-scheme` for theming.

## Documentation

### Project Structure Documentation

- [Main Documentation](./docs/README.md) - Core project documentation and API reference
- [Source Code Documentation](./src/README.md) - Detailed source code structure and architecture
- [Binary Documentation](./bin/README.md) - CLI tools and command-line interface documentation
- [Test Documentation](./test/README.md) - Test suites and testing methodology
- [Service Documentation](./src/services/README.md) - Service layer architecture and APIs

### API Documentation

The dimension store provides a comprehensive API for managing node positioning:

```javascript
import { dimensionStore, NODE_CATEGORIES } from './src/services/dimension-store.js';

// Set node dimensions with automatic categorization
dimensionStore.setNodeDimensions('node-id', {
  x: 100, y: 100, width: 50, height: 20,
  textContent: 'Label Text', // Automatically categorized as CONTEXTUAL
  shape: 'circle'            // Would be categorized as INDICATORS
});

// Register positioning update callbacks
dimensionStore.onPositioningUpdate((updateInfo) => {
  console.log('Node positions updated:', updateInfo);
});

// Get layout statistics
const stats = dimensionStore.getStatistics();
console.log(`Total nodes: ${stats.totalNodes}, Overlaps: ${stats.overlaps}`);
```
