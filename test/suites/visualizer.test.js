// write functions that act as a callback for node:test test(callback) methods
// specific to the visualizer service located in the source (src) services directory

import assert from 'node:assert';
import { describe, test } from 'node:test';
import { generateSVG } from '../../src/services/visualizer.js';

/**
 * Tests for the visualizer service functions
 */
export function testGenerateSVG() {
  describe('generateSVG function', () => {
    test('should be a function', () => {
      assert.strictEqual(typeof generateSVG, 'function');
    });

    test('should generate SVG from simple graph', () => {
      // Create a simple test graph
      const graph = {
        nodes: new Map([
          ['/root/src/main.js', { path: '/root/src/main.js', name: 'main.js' }],
          ['/root/src/utils.js', { path: '/root/src/utils.js', name: 'utils.js' }]
        ]),
        edges: new Map([
          ['/root/src/main.js', new Set(['/root/src/utils.js'])],
          ['/root/src/utils.js', new Set()]
        ])
      };

      const cycles = [];
      const rootDir = '/root';
      const options = { output: 'test.svg' };

      const svgContent = generateSVG(graph, cycles, rootDir, options);

      assert.ok(typeof svgContent === 'string');
      assert.ok(svgContent.length > 0);
      assert.ok(svgContent.includes('<svg'), 'Should contain SVG element');
      assert.ok(svgContent.includes('main.js'), 'Should contain node labels');
      assert.ok(svgContent.includes('utils.js'), 'Should contain node labels');
    });

    test('should handle empty graph', () => {
      const graph = {
        nodes: new Map(),
        edges: new Map()
      };

      const cycles = [];
      const rootDir = '/root';
      const options = { output: 'empty.svg' };

      const svgContent = generateSVG(graph, cycles, rootDir, options);

      assert.ok(typeof svgContent === 'string');
      assert.ok(svgContent.length > 0);
      assert.ok(svgContent.includes('<svg'), 'Should contain SVG element');
    });

    test('should handle graph with cycles', () => {
      // Create a graph with circular dependencies
      const graph = {
        nodes: new Map([
          ['/root/a.js', { path: '/root/a.js', name: 'a.js' }],
          ['/root/b.js', { path: '/root/b.js', name: 'b.js' }]
        ]),
        edges: new Map([
          ['/root/a.js', new Set(['/root/b.js'])],
          ['/root/b.js', new Set(['/root/a.js'])]
        ])
      };

      const cycles = [['/root/a.js', '/root/b.js']];
      const rootDir = '/root';
      const options = { output: 'cyclic.svg' };

      const svgContent = generateSVG(graph, cycles, rootDir, options);

      assert.ok(typeof svgContent === 'string');
      assert.ok(svgContent.length > 0);
      assert.ok(svgContent.includes('<svg'), 'Should contain SVG element');
      assert.ok(svgContent.includes('a.js'), 'Should contain node labels');
      assert.ok(svgContent.includes('b.js'), 'Should contain node labels');

      // Should include cycle styling
      assert.ok(svgContent.includes('cycle-link') || svgContent.includes('stroke'), 'Should include link styling');
    });

    test('should generate different output for different graphs', () => {
      const graph1 = {
        nodes: new Map([['/root/single.js', { path: '/root/single.js', name: 'single.js' }]]),
        edges: new Map([['/root/single.js', new Set()]])
      };

      const graph2 = {
        nodes: new Map([
          ['/root/src/main.js', { path: '/root/src/main.js', name: 'main.js' }],
          ['/root/src/utils.js', { path: '/root/src/utils.js', name: 'utils.js' }],
          ['/root/test/test.js', { path: '/root/test/test.js', name: 'test.js' }]
        ]),
        edges: new Map([
          ['/root/src/main.js', new Set(['/root/src/utils.js'])],
          ['/root/src/utils.js', new Set()],
          ['/root/test/test.js', new Set(['/root/src/main.js'])]
        ])
      };

      const cycles = [];
      const rootDir = '/root';
      const options = { output: 'test.svg' };

      const svg1 = generateSVG(graph1, cycles, rootDir, options);
      const svg2 = generateSVG(graph2, cycles, rootDir, options);

      assert.ok(typeof svg1 === 'string');
      assert.ok(typeof svg2 === 'string');
      assert.notEqual(svg1, svg2, 'Different graphs should generate different SVG');
      assert.ok(svg2.length > svg1.length, 'More complex graph should generate larger SVG');
    });

    test('should include legend in generated SVG', () => {
      const graph = {
        nodes: new Map([
          ['/root/src/main.js', { path: '/root/src/main.js', name: 'main.js' }],
          ['/root/test/test.js', { path: '/root/test/test.js', name: 'test.js' }]
        ]),
        edges: new Map([
          ['/root/src/main.js', new Set()],
          ['/root/test/test.js', new Set()]
        ])
      };

      const cycles = [];
      const rootDir = '/root';
      const options = { output: 'test.svg' };

      const svgContent = generateSVG(graph, cycles, rootDir, options);

      assert.ok(svgContent.includes('legend'), 'Should include legend elements');
      assert.ok(svgContent.includes('Directory Colors') || svgContent.includes('File Type'), 'Should include legend labels');
    });

    test('should handle complex directory structure', () => {
      const graph = {
        nodes: new Map([
          ['/root/src/components/Button.jsx', { path: '/root/src/components/Button.jsx', name: 'Button.jsx' }],
          ['/root/src/utils/helpers.js', { path: '/root/src/utils/helpers.js', name: 'helpers.js' }],
          ['/root/test/unit/button.test.js', { path: '/root/test/unit/button.test.js', name: 'button.test.js' }],
          ['/root/docs/README.md', { path: '/root/docs/README.md', name: 'README.md' }]
        ]),
        edges: new Map([
          ['/root/src/components/Button.jsx', new Set(['/root/src/utils/helpers.js'])],
          ['/root/src/utils/helpers.js', new Set()],
          ['/root/test/unit/button.test.js', new Set(['/root/src/components/Button.jsx'])],
          ['/root/docs/README.md', new Set()]
        ])
      };

      const cycles = [];
      const rootDir = '/root';
      const options = { output: 'complex.svg' };

      const svgContent = generateSVG(graph, cycles, rootDir, options);

      assert.ok(typeof svgContent === 'string');
      assert.ok(svgContent.length > 0);
      assert.ok(svgContent.includes('Button.jsx'), 'Should contain React component');
      assert.ok(svgContent.includes('helpers.js'), 'Should contain utility file');
      assert.ok(svgContent.includes('button.test.js'), 'Should contain test file');
      assert.ok(svgContent.includes('README.md'), 'Should contain documentation file');
    });
  });
}

export function testVisualizerIntegration() {
  describe('Visualizer service integration', () => {
    test('should work with real project structure', () => {
      // Simulate a real project structure
      const graph = {
        nodes: new Map([
          ['/project/src/index.js', { path: '/project/src/index.js', name: 'index.js' }],
          ['/project/src/config.js', { path: '/project/src/config.js', name: 'config.js' }],
          ['/project/src/services/api.js', { path: '/project/src/services/api.js', name: 'api.js' }],
          ['/project/src/services/auth.js', { path: '/project/src/services/auth.js', name: 'auth.js' }],
          ['/project/src/components/App.jsx', { path: '/project/src/components/App.jsx', name: 'App.jsx' }],
          ['/project/src/styles/main.css', { path: '/project/src/styles/main.css', name: 'main.css' }],
          ['/project/test/api.test.js', { path: '/project/test/api.test.js', name: 'api.test.js' }],
          ['/project/test/auth.test.js', { path: '/project/test/auth.test.js', name: 'auth.test.js' }]
        ]),
        edges: new Map([
          ['/project/src/index.js', new Set(['/project/src/config.js', '/project/src/components/App.jsx'])],
          ['/project/src/config.js', new Set()],
          ['/project/src/services/api.js', new Set(['/project/src/config.js'])],
          ['/project/src/services/auth.js', new Set(['/project/src/services/api.js'])],
          ['/project/src/components/App.jsx', new Set(['/project/src/services/auth.js', '/project/src/styles/main.css'])],
          ['/project/src/styles/main.css', new Set()],
          ['/project/test/api.test.js', new Set(['/project/src/services/api.js'])],
          ['/project/test/auth.test.js', new Set(['/project/src/services/auth.js'])]
        ])
      };

      const cycles = [];
      const rootDir = '/project';
      const options = { output: 'project-visualization.svg' };

      const svgContent = generateSVG(graph, cycles, rootDir, options);

      assert.ok(typeof svgContent === 'string');
      assert.ok(svgContent.length > 1000, 'Complex project should generate substantial SVG');
      assert.ok(svgContent.includes('<svg'), 'Should be valid SVG');
      assert.ok(svgContent.includes('index.js'), 'Should include main entry point');
      assert.ok(svgContent.includes('App.jsx'), 'Should include React component');
      assert.ok(svgContent.includes('main.css'), 'Should include CSS file');
      assert.ok(svgContent.includes('api.test.js'), 'Should include test files');

      // Should have proper structure
      assert.ok(svgContent.includes('xmlns="http://www.w3.org/2000/svg"'), 'Should have proper SVG namespace');
      assert.ok(svgContent.includes('viewBox'), 'Should have viewBox for scaling');

      console.log(`Integration test: Generated ${svgContent.length} character SVG for 8-node project`);
    });
  });
}

export default {
  testGenerateSVG,
  testVisualizerIntegration
};
