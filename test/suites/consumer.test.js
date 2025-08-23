// write functions that act as a callback for node:test test(callback) methods
// specific to the consumer service located in the source (src) services directory

import assert from 'node:assert';
import { describe, test } from 'node:test';
import path from 'path';
import {
  detectCircularDependencies,
  findSourceFiles,
  parseFilesAndBuildGraph
} from '../../src/services/consumer.js';

/**
 * Tests for the consumer service functions
 */
export function testFindSourceFiles() {
  describe('findSourceFiles function', () => {
    test('should be a function', () => {
      assert.strictEqual(typeof findSourceFiles, 'function');
    });

    test('should find JavaScript files in test models', async () => {
      const testDir = 'test/models/small-size-project';
      const options = { depth: 5, hidden: false };

      try {
        const files = await findSourceFiles(testDir, options);
        assert.ok(Array.isArray(files));

        // Should find the index.js file
        const hasJsFile = files.some(file => file.endsWith('.js'));
        assert.ok(hasJsFile, 'Should find at least one JavaScript file');

        // All files should be absolute paths
        files.forEach(file => {
          assert.ok(path.isAbsolute(file), `File path should be absolute: ${file}`);
        });
      } catch (error) {
        // If directory doesn't exist, skip test
        if (error.code === 'ENOENT') {
          console.log('Test directory not found, skipping test');
          return;
        }
        throw error;
      }
    });

    test('should respect depth option', async () => {
      const testDir = 'test/models/small-size-project';
      const shallowOptions = { depth: 1, hidden: false };
      const deepOptions = { depth: 10, hidden: false };

      try {
        const shallowFiles = await findSourceFiles(testDir, shallowOptions);
        const deepFiles = await findSourceFiles(testDir, deepOptions);

        assert.ok(Array.isArray(shallowFiles));
        assert.ok(Array.isArray(deepFiles));

        // Deep search should find at least as many files as shallow
        assert.ok(deepFiles.length >= shallowFiles.length);
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.log('Test directory not found, skipping test');
          return;
        }
        throw error;
      }
    });

    test('should handle non-existent directory', async () => {
      const nonExistentDir = '/path/that/does/not/exist';
      const options = { depth: 5, hidden: false };

      const files = await findSourceFiles(nonExistentDir, options);
      assert.ok(Array.isArray(files));
      assert.strictEqual(files.length, 0);
    });
  });
}

export function testParseFilesAndBuildGraph() {
  describe('parseFilesAndBuildGraph function', () => {
    test('should be a function', () => {
      assert.strictEqual(typeof parseFilesAndBuildGraph, 'function');
    });

    test('should parse files and build graph structure', async () => {
      // Create a minimal test with actual files
      const testDir = 'test/models/small-size-project';
      const options = { depth: 3, hidden: false };

      try {
        const files = await findSourceFiles(testDir, options);
        if (files.length === 0) {
          console.log('No files found, skipping graph test');
          return;
        }

        const result = await parseFilesAndBuildGraph(files, testDir);

        assert.ok(result.graph);
        assert.ok(result.graph.nodes instanceof Map);
        assert.ok(result.graph.edges instanceof Map);
        assert.ok(result.tsProgram);

        // Should have nodes for each file
        assert.ok(result.graph.nodes.size > 0);

        // Each file should have an entry in edges (even if empty)
        files.forEach(file => {
          assert.ok(result.graph.nodes.has(file), `Graph should contain node for ${file}`);
          assert.ok(result.graph.edges.has(file), `Graph should contain edges for ${file}`);
        });
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.log('Test directory not found, skipping test');
          return;
        }
        throw error;
      }
    });

    test('should handle empty file list', async () => {
      const result = await parseFilesAndBuildGraph([], '/.tmp');

      assert.ok(result.graph);
      assert.ok(result.graph.nodes instanceof Map);
      assert.ok(result.graph.edges instanceof Map);
      assert.strictEqual(result.graph.nodes.size, 0);
      assert.strictEqual(result.graph.edges.size, 0);
    });
  });
}

export function testDetectCircularDependencies() {
  describe('detectCircularDependencies function', () => {
    test('should be a function', () => {
      assert.strictEqual(typeof detectCircularDependencies, 'function');
    });

    test('should detect no cycles in empty graph', () => {
      const graph = {
        nodes: new Map(),
        edges: new Map()
      };

      const cycles = detectCircularDependencies(graph);
      assert.ok(Array.isArray(cycles));
      assert.strictEqual(cycles.length, 0);
    });

    test('should detect no cycles in acyclic graph', () => {
      const graph = {
        nodes: new Map([
          ['a.js', {}],
          ['b.js', {}],
          ['c.js', {}]
        ]),
        edges: new Map([
          ['a.js', new Set(['b.js'])],
          ['b.js', new Set(['c.js'])],
          ['c.js', new Set()]
        ])
      };

      const cycles = detectCircularDependencies(graph);
      assert.ok(Array.isArray(cycles));
      assert.strictEqual(cycles.length, 0);
    });

    test('should detect simple cycle', () => {
      const graph = {
        nodes: new Map([
          ['a.js', {}],
          ['b.js', {}]
        ]),
        edges: new Map([
          ['a.js', new Set(['b.js'])],
          ['b.js', new Set(['a.js'])]
        ])
      };

      const cycles = detectCircularDependencies(graph);
      assert.ok(Array.isArray(cycles));
      assert.ok(cycles.length > 0, 'Should detect at least one cycle');
    });

    test('should handle disconnected graph components', () => {
      const graph = {
        nodes: new Map([
          ['a.js', {}],
          ['b.js', {}],
          ['c.js', {}],
          ['d.js', {}]
        ]),
        edges: new Map([
          ['a.js', new Set(['b.js'])],
          ['b.js', new Set()],
          ['c.js', new Set(['d.js'])],
          ['d.js', new Set()]
        ])
      };

      const cycles = detectCircularDependencies(graph);
      assert.ok(Array.isArray(cycles));
      assert.strictEqual(cycles.length, 0);
    });
  });
}

export function testConsumerIntegration() {
  describe('Consumer service integration', () => {
    test('should work together to analyze project structure', async () => {
      const testDir = 'test/models/small-size-project';
      const options = { depth: 3, hidden: false };

      try {
        // Step 1: Find files
        const files = await findSourceFiles(testDir, options);

        if (files.length === 0) {
          console.log('No files found, skipping integration test');
          return;
        }

        // Step 2: Parse and build graph
        const { graph } = await parseFilesAndBuildGraph(files, testDir);

        // Step 3: Detect cycles
        const cycles = detectCircularDependencies(graph);

        assert.ok(Array.isArray(files));
        assert.ok(graph.nodes instanceof Map);
        assert.ok(graph.edges instanceof Map);
        assert.ok(Array.isArray(cycles));

        console.log(`Integration test: Found ${files.length} files, ${graph.nodes.size} nodes, ${cycles.length} cycles`);
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.log('Test directory not found, skipping integration test');
          return;
        }
        throw error;
      }
    });
  });
}

export default {
  testFindSourceFiles,
  testParseFilesAndBuildGraph,
  testDetectCircularDependencies,
  testConsumerIntegration
};
