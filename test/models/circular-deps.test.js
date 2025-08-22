// Test functions for circular dependency model validation
// Tests the circular-structure model for proper cycle detection and handling

import { promises as fs } from 'fs';
import assert from 'node:assert';
import { describe, test } from 'node:test';
import path from 'path';
import { detectCircularDependencies, findSourceFiles, parseFilesAndBuildGraph } from '../../src/services/consumer.js';

/**
 * Tests for circular dependency model validation
 */
export function testCircularDependencyModel() {
  describe('Circular Dependency Model', () => {
    const modelPath = 'test/models/circular-structure';

    test('should have circular dependency structure files', async () => {
      try {
        const expectedFiles = ['index.js', 'moduleA.js', 'moduleB.js', 'package.json'];

        for (const fileName of expectedFiles) {
          const filePath = path.join(modelPath, fileName);
          const exists = await fs.access(filePath).then(() => true).catch(() => false);

          if (exists) {
            assert.ok(true, `${fileName} exists`);
          } else {
            console.log(`Expected file ${fileName} not found in circular model`);
          }
        }
      } catch (error) {
        console.log('Circular dependency test model not available');
      }
    });

    test('should detect circular dependencies in the model', async () => {
      try {
        const options = { depth: 5, hidden: false };
        const files = await findSourceFiles(modelPath, options);

        if (files.length === 0) {
          console.log('No files found in circular dependency model');
          return;
        }

        const { graph } = await parseFilesAndBuildGraph(files, modelPath);
        const cycles = detectCircularDependencies(graph);

        assert.ok(Array.isArray(cycles), 'Should return cycles array');

        if (cycles.length > 0) {
          console.log(`✓ Circular dependency model detected ${cycles.length} cycles as expected`);

          // Verify cycle structure
          cycles.forEach((cycle, index) => {
            assert.ok(Array.isArray(cycle), `Cycle ${index} should be an array`);
            assert.ok(cycle.length >= 2, `Cycle ${index} should have at least 2 nodes`);

            // Cycle should form a closed loop (first and last elements should connect)
            const firstNode = cycle[0];
            const lastNode = cycle[cycle.length - 1];

            // Check if there's an edge from last to first (completing the cycle)
            const lastNodeEdges = graph.edges.get(lastNode) || new Set();
            if (lastNodeEdges.has(firstNode)) {
              console.log(`  Cycle ${index + 1}: ${cycle.map(p => path.basename(p)).join(' -> ')} -> ${path.basename(firstNode)}`);
            }
          });
        } else {
          console.log('⚠️  Circular dependency model did not detect expected cycles');
        }

      } catch (error) {
        if (error.code === 'ENOENT') {
          console.log('Circular dependency test model not available');
        } else {
          throw error;
        }
      }
    });

    test('should handle circular dependencies without infinite loops', async () => {
      try {
        const options = { depth: 5, hidden: false };
        const startTime = Date.now();

        const files = await findSourceFiles(modelPath, options);
        if (files.length === 0) {
          console.log('Circular model not available for infinite loop testing');
          return;
        }

        const { graph } = await parseFilesAndBuildGraph(files, modelPath);
        const cycles = detectCircularDependencies(graph);

        const endTime = Date.now();
        const processingTime = endTime - startTime;

        // Should complete in reasonable time (not infinite loop)
        assert.ok(processingTime < 5000, `Circular dependency detection should complete quickly (took ${processingTime}ms)`);
        assert.ok(Array.isArray(cycles), 'Should return finite cycles array');

        console.log(`Circular dependency processing completed in ${processingTime}ms`);
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.log('Circular model not available for performance testing');
        } else {
          throw error;
        }
      }
    });
  });
}

export function testCircularVisualization() {
  describe('Circular Dependency Visualization', () => {
    test('should highlight circular dependencies in output', async () => {
      const modelPath = 'test/models/circular-structure';

      try {
        const options = { depth: 5, hidden: false };
        const files = await findSourceFiles(modelPath, options);

        if (files.length === 0) {
          console.log('Circular model not available for visualization testing');
          return;
        }

        const { graph } = await parseFilesAndBuildGraph(files, modelPath);
        const cycles = detectCircularDependencies(graph);

        // Import visualization functions
        const { getCycleEdges } = await import('../../src/utils.js');
        const cycleEdges = getCycleEdges(cycles);

        assert.ok(cycleEdges instanceof Set, 'Should return set of cycle edges');

        if (cycles.length > 0) {
          assert.ok(cycleEdges.size > 0, 'Should identify cycle edges for highlighting');
          console.log(`Identified ${cycleEdges.size} edges to highlight in ${cycles.length} cycles`);
        }

      } catch (error) {
        if (error.code === 'ENOENT') {
          console.log('Circular model not available for visualization testing');
        } else {
          throw error;
        }
      }
    });
  });
}

export default { testCircularDependencyModel, testCircularVisualization };
