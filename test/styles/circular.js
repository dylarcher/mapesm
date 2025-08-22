// write functions that act as a callback for node:test test(callback) methods
// specific to the half-circle positioning of nodes in the graph output file

import * as d3 from 'd3';
import assert from 'node:assert';
import { describe, test } from 'node:test';
import { positionNodes } from '../../src/services/provider.js';

/**
 * Tests for half-circle (circular) node positioning layout
 */
export function testCircularPositioning() {
  describe('Half-Circle Node Positioning', () => {
    test('should arrange nodes in half-circle pattern', () => {
      const root = {
        name: 'center',
        children: [
          { name: 'node1', children: [] },
          { name: 'node2', children: [] },
          { name: 'node3', children: [] },
          { name: 'node4', children: [] },
          { name: 'node5', children: [] }
        ]
      };
      const hierarchy = d3.hierarchy(root);

      positionNodes(hierarchy, 2, 800);

      // Root should be at origin
      assert.strictEqual(hierarchy.x, 0);
      assert.strictEqual(hierarchy.y, 0);

      // Children should be arranged in a semi-circle
      const childPositions = hierarchy.children.map(child => ({ x: child.x, y: child.y }));

      // Check that nodes span across x-axis (left and right of center)
      const xPositions = childPositions.map(pos => pos.x);
      const hasNegativeX = xPositions.some(x => x < 0);
      const hasPositiveX = xPositions.some(x => x > 0);

      assert.ok(hasNegativeX && hasPositiveX, 'Nodes should span both sides of center (half-circle)');

      // All children should be at positive y (below root)
      childPositions.forEach((pos, i) => {
        assert.ok(pos.y > 0, `Child ${i} should be positioned below root in half-circle`);
      });
    });

    test('should maintain circular arc relationships', () => {
      const root = {
        name: 'center',
        children: Array.from({ length: 8 }, (_, i) => ({ name: `spoke_${i}`, children: [] }))
      };
      const hierarchy = d3.hierarchy(root);

      positionNodes(hierarchy, 2, 800);

      // Calculate distances from root to each child
      const distances = hierarchy.children.map(child =>
        Math.sqrt(child.x * child.x + child.y * child.y)
      );

      // All distances should be similar (forming a circle)
      const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
      const maxDeviation = Math.max(...distances.map(d => Math.abs(d - avgDistance)));
      const tolerance = avgDistance * 0.3; // 30% tolerance for semi-circle layout

      assert.ok(maxDeviation <= tolerance,
        `Nodes should be roughly equidistant from center (max deviation: ${maxDeviation}, tolerance: ${tolerance})`);
    });

    test('should handle different node counts in circular layout', () => {
      const testCounts = [3, 6, 12];

      testCounts.forEach(count => {
        const root = {
          name: 'center',
          children: Array.from({ length: count }, (_, i) => ({ name: `node_${i}`, children: [] }))
        };
        const hierarchy = d3.hierarchy(root);

        positionNodes(hierarchy, 2, 800);

        // Should spread nodes across the half-circle
        const xPositions = hierarchy.children.map(child => child.x);
        const xRange = Math.max(...xPositions) - Math.min(...xPositions);

        assert.ok(xRange > 0, `${count} nodes should span across x-axis in circular layout`);

        // Verify semi-circle constraint (y > 0)
        hierarchy.children.forEach((child, i) => {
          assert.ok(child.y > 0, `Node ${i} of ${count} should be in lower half (semi-circle)`);
        });
      });
    });

    test('should create angular distribution for circular layout', () => {
      const root = {
        name: 'center',
        children: [
          { name: 'left', children: [] },
          { name: 'center', children: [] },
          { name: 'right', children: [] }
        ]
      };
      const hierarchy = d3.hierarchy(root);

      positionNodes(hierarchy, 2, 800);

      // Calculate angles from root
      const angles = hierarchy.children.map(child => {
        const angle = Math.atan2(child.y, child.x);
        return angle < 0 ? angle + Math.PI : angle; // Normalize to 0-π for semi-circle
      });

      // Sort angles to check distribution
      angles.sort((a, b) => a - b);

      // Should span from roughly 0 to π (180 degrees) for semi-circle
      const angleSpan = angles[angles.length - 1] - angles[0];
      assert.ok(angleSpan > Math.PI * 0.5, 'Nodes should span a significant portion of the semi-circle');
      assert.ok(angleSpan <= Math.PI, 'Nodes should not exceed semi-circle bounds');
    });
  });
}

export function testCircularLevelDistribution() {
  describe('Multi-Level Circular Distribution', () => {
    test('should create concentric semi-circles for multiple levels', () => {
      const root = {
        name: 'center',
        children: [
          {
            name: 'branch1',
            children: [
              { name: 'leaf1a', children: [] },
              { name: 'leaf1b', children: [] }
            ]
          },
          {
            name: 'branch2',
            children: [
              { name: 'leaf2a', children: [] }
            ]
          }
        ]
      };
      const hierarchy = d3.hierarchy(root);

      positionNodes(hierarchy, 3, 800);

      // Group nodes by depth level
      const nodesByLevel = new Map();
      hierarchy.each(node => {
        if (!nodesByLevel.has(node.depth)) {
          nodesByLevel.set(node.depth, []);
        }
        nodesByLevel.get(node.depth).push(node);
      });

      // Each level should have progressively larger radii
      for (let level = 1; level < 3; level++) {
        const currentLevel = nodesByLevel.get(level);
        const nextLevel = nodesByLevel.get(level + 1);

        if (currentLevel && nextLevel) {
          const avgRadiusCurrent = currentLevel.reduce((sum, node) =>
            sum + Math.sqrt(node.x * node.x + node.y * node.y), 0) / currentLevel.length;

          const avgRadiusNext = nextLevel.reduce((sum, node) =>
            sum + Math.sqrt(node.x * node.x + node.y * node.y), 0) / nextLevel.length;

          assert.ok(avgRadiusNext > avgRadiusCurrent,
            `Level ${level + 1} should have larger radius than level ${level} in concentric layout`);
        }
      }
    });
  });
}

export default { testCircularPositioning, testCircularLevelDistribution };
