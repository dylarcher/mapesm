# Codebase Visualizer

A professional-grade CLI tool to analyze a JavaScript/TypeScript codebase, map its module dependencies, and render the relationships as a sophisticated, accessible, and aesthetically pleasing hierarchical diagram.

The generated SVG is interactive, themeable (light/dark mode), and designed with accessibility in mind, using modern color formats that adhere to WCAG 2.2 AA contrast standards.

## Features

- **Hierarchical Visualization**: Generates a tree diagram representing your project's file and directory structure.
- **Dependency Mapping**: Draws connections between modules to show `import` and `export` relationships.
- **Circular Dependency Detection**: Automatically identifies and highlights circular dependencies, a common source of bugs and architectural issues.
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
- `--hidden`: Include hidden files and folders (those starting with a dot).
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

## How It Works

1. **CLI Interface**: Built with **Commander.js** for robust and user-friendly command-line argument parsing.
2. **File System Traversal**: Recursively scans the target directory using modern, efficient Node.js `fs` APIs.
3. **Code Parsing**: Leverages the powerful **TypeScript Compiler API** to parse JavaScript and TypeScript files into Abstract Syntax Trees (ASTs). This high-fidelity approach allows for accurate extraction of `import`/`export` relationships, including support for path aliases from `tsconfig.json`.
4. **Graph Construction**: Builds an in-memory directed graph of all module dependencies.
5. **Cycle Detection**: A Depth-First Search (DFS) algorithm traverses the graph to identify and report any circular dependencies.
6. **Visualization**: Uses **D3.js** to calculate a tidy tree layout (`d3.tree`). The layout is rendered into a virtual DOM on the server using **JSDOM**, ensuring that the browser-centric D3 library can run in a Node.js environment.
7. **SVG Generation**: The final diagram is serialized into a valid SVG string using `xmlserializer` and saved to a file. The SVG includes embedded CSS with modern features like `oklch()` colors and `prefers-color-scheme` for theming.
