# Services

Provides encapsulated, reusable logic classes and services to make available the common, grouped, or complex functionality.

## Table of Contents

- [Service Architecture](#service-architecture)
- [Core Services](#core-services)
- [Service APIs](#service-apis)

## Service Architecture

The service layer follows a modular architecture with clearly defined responsibilities:

```
services/
├── consumer.js          # File discovery and dependency graph construction
├── provider.js          # SVG rendering and node positioning
├── visualizer.js        # High-level visualization orchestration
└── dimension-store.js   # Node dimension management and overlap prevention
```

## Core Services

### Consumer Service (`consumer.js`)

Responsible for file system analysis and dependency graph construction:

- **File Discovery**: Recursively finds relevant source files
- **AST Parsing**: Uses TypeScript Compiler API for accurate code analysis
- **Graph Building**: Constructs dependency relationships from import/export statements
- **Cycle Detection**: Implements DFS algorithm to identify circular dependencies

**Key Functions:**
- `findSourceFiles(rootDir, options)` - Discovers source files in directory tree
- `parseFilesAndBuildGraph(files, rootDir)` - Parses files and builds dependency graph
- `detectCircularDependencies(graph)` - Identifies circular dependency cycles

### Provider Service (`provider.js`)

Handles low-level SVG rendering and node positioning logic:

- **SVG Generation**: Creates base SVG structure with embedded styles
- **Layout Algorithms**: Six different positioning algorithms with intelligent auto-selection
- **Node Rendering**: Draws shapes, text labels, and dependency links
- **Dimension Management**: Integrates with dimension store for overlap prevention

**Key Functions:**
- `createBaseSVG(width, height, mode)` - Creates base SVG with theming
- `positionNodes(hierarchy, maxDepth, contentWidth, layoutStyle, direction)` - Positions nodes using selected algorithm
- `renderNodes(g, hierarchy, rootDir, pathColorMap)` - Renders node shapes and labels
- `renderDependencyLinks(g, links, cycleEdges, hierarchy, colorMap)` - Draws dependency connections

### Visualizer Service (`visualizer.js`)

High-level orchestration of the complete visualization pipeline:

- **Pipeline Management**: Coordinates all visualization stages
- **Data Transformation**: Converts flat graph to hierarchical structure
- **Color Management**: Applies flow-based color mapping system
- **Final Assembly**: Combines all rendered elements into final SVG

**Key Functions:**
- `generateSVG(graph, cycles, rootDir, options)` - Main visualization entry point

### Dimension Store Service (`dimension-store.js`)

Advanced node positioning and overlap prevention system:

- **Reactive State Management**: Uses Proxy API for automatic position updates
- **Node Categorization**: Classifies nodes as contextual, presentational, or indicators
- **Overlap Detection**: Detects violations of category-based spacing rules
- **Automatic Resolution**: Repositions nodes to prevent visual conflicts
- **Layout Bounds**: Tracks and optimizes overall layout boundaries

**Key Classes & Functions:**
- `class DimensionStore` - Main store class with Proxy-based reactivity
- `NODE_CATEGORIES` - Node classification constants
- `OVERLAP_BUFFERS` - Spacing rules and buffer distances

## Service APIs

### Dimension Store API

```javascript
import { dimensionStore, NODE_CATEGORIES } from './dimension-store.js';

// Set node dimensions with automatic categorization
dimensionStore.setNodeDimensions('node-id', {
  x: 100, y: 100,
  width: 50, height: 20,
  textContent: 'Node Label',  // → CONTEXTUAL category
  shape: 'circle'             // → INDICATORS category
});

// Get node information
const node = dimensionStore.getNodeDimensions('node-id');
console.log(node.category); // 'contextual'

// Register for position updates
dimensionStore.onPositioningUpdate(({ store, prop, oldValue, newValue }) => {
  console.log('Positioning updated:', prop);
});

// Get layout statistics
const stats = dimensionStore.getStatistics();
console.log({
  totalNodes: stats.totalNodes,
  overlaps: stats.overlaps,
  density: stats.density,
  categories: stats.categories
});

// Manual overlap resolution
dimensionStore.resolveOverlaps();
```

### Node Categories & Overlap Rules

The dimension store enforces these overlap prevention rules:

1. **Contextual nodes (text)** cannot overlap:
   - Other contextual nodes
   - Any node within their 18px buffer zone

2. **Indicator nodes (shapes/icons)** cannot overlap:
   - Contextual nodes' 18px buffer zones
   - Other indicators within minimum spacing

3. **Presentational nodes (lines/borders)** can overlap:
   - Contextual nodes (allowed for visual layering)
   - Other presentational nodes
   - Indicator nodes (with margin)

### Layout Algorithm Selection

The auto layout uses intelligent selection based on graph characteristics:

```javascript
// Analysis factors:
const { totalNodes, maxDepth, branchingFactor, aspectRatio, leafNodes } = analyzeGraph(hierarchy);

// Selection logic:
if (totalNodes <= 8) return 'linear';
if (maxDepth <= 2 && totalNodes <= 20) return 'grid';
if (branchingFactor > 8 && maxDepth <= 4) return 'circular';
if (aspectRatio > 3) return 'linear';
if (maxDepth > 6) return 'diagonal';
if (leafNodes / totalNodes > 0.7) return 'tree';
return 'tree'; // default
```

Each algorithm is optimized for specific graph structures to maximize readability and minimize visual clutter.
