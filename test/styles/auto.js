// write functions that act as a callback for node:test test(callback) methods
// specific to automatic positioning of nodes in the graph output file render

import * as d3 from 'd3';
import assert from 'node:assert';
import { describe, test } from 'node:test';
import { positionNodes } from '../../src/services/provider.js';

/**
 * Tests for automatic node positioning algorithms
 */
export function testAutomaticPositioning() {
  describe('Automatic Node Positioning', () => {
    test('should automatically position single node at origin', () => {
      const root = { name: 'root', children: [] };
      const hierarchy = d3.hierarchy(root);

      const bounds = positionNodes(hierarchy, 1, 800);

      assert.strictEqual(hierarchy.x, 0, 'Single node should be at x=0');
      assert.strictEqual(hierarchy.y, 0, 'Single node should be at y=0');
      assert.ok(typeof bounds === 'object', 'Should return bounds object');
    });

    test('should automatically distribute multiple nodes', () => {
      const root = {
        name: 'root',
        children: [
          { name: 'child1', children: [] },
          { name: 'child2', children: [] },
          { name: 'child3', children: [] }
        ]
      };
      const hierarchy = d3.hierarchy(root);

      const bounds = positionNodes(hierarchy, 2, 800);

      // Root should be at origin
      assert.strictEqual(hierarchy.x, 0, 'Root should be at x=0');
      assert.strictEqual(hierarchy.y, 0, 'Root should be at y=0');

      // Children should be automatically positioned
      hierarchy.children.forEach((child, index) => {
        assert.ok(typeof child.x === 'number', `Child ${index} should have numeric x position`);
        assert.ok(typeof child.y === 'number', `Child ${index} should have numeric y position`);
        assert.ok(child.y > 0, `Child ${index} should be positioned below root`);
      });

      // Children should have different x positions (spread out)
      const xPositions = hierarchy.children.map(child => child.x);
      const uniqueXPositions = new Set(xPositions);
      assert.ok(uniqueXPositions.size > 1, 'Children should have different x positions');
    });

    test('should handle deep hierarchy automatically', () => {
      const root = {
        name: 'root',
        children: [
          {
            name: 'level1_a',
            children: [
              { name: 'level2_a', children: [] },
              { name: 'level2_b', children: [] }
            ]
          },
          {
            name: 'level1_b',
            children: [
              { name: 'level2_c', children: [] }
            ]
          }
        ]
      };
      const hierarchy = d3.hierarchy(root);

      const bounds = positionNodes(hierarchy, 3, 800);

      // Check that each level has appropriate y positioning
      let maxYAtLevel = { 0: -Infinity, 1: -Infinity, 2: -Infinity };

      hierarchy.each(node => {
        const level = node.depth;
        maxYAtLevel[level] = Math.max(maxYAtLevel[level], node.y);
      });

      assert.ok(maxYAtLevel[0] < maxYAtLevel[1], 'Level 1 nodes should be below level 0');
      assert.ok(maxYAtLevel[1] < maxYAtLevel[2], 'Level 2 nodes should be below level 1');
    });

    test('should maintain relative positioning consistency', () => {
      const createTestHierarchy = () => {
        const root = {
          name: 'project',
          children: [
            { name: 'src', children: [{ name: 'main.js', children: [] }] },
            { name: 'test', children: [{ name: 'test.js', children: [] }] }
          ]
        };
        return d3.hierarchy(root);
      };

      // Run positioning multiple times
      const hierarchy1 = createTestHierarchy();
      const hierarchy2 = createTestHierarchy();

      positionNodes(hierarchy1, 2, 800);
      positionNodes(hierarchy2, 2, 800);

      // Should produce consistent results
      hierarchy1.each((node1, index) => {
        const node2 = hierarchy2.descendants()[index];
        assert.strictEqual(node1.x, node2.x, `Node ${node1.data.name} should have consistent x position`);
        assert.strictEqual(node1.y, node2.y, `Node ${node1.data.name} should have consistent y position`);
      });
    });
  });
}

export function testAutomaticSpacing() {
  describe('Automatic Spacing Algorithms', () => {
    test('should adjust spacing based on node count', () => {
      const smallHierarchy = d3.hierarchy({
        name: 'root',
        children: [
          { name: 'a', children: [] },
          { name: 'b', children: [] }
        ]
      });

      const largeHierarchy = d3.hierarchy({
        name: 'root',
        children: Array.from({ length: 10 }, (_, i) => ({ name: `node_${i}`, children: [] }))
      });

      positionNodes(smallHierarchy, 2, 800);
      positionNodes(largeHierarchy, 2, 800);

      // Calculate average spacing for small hierarchy
      const smallSpacings = [];
      for (let i = 0; i < smallHierarchy.children.length - 1; i++) {
        const spacing = Math.abs(smallHierarchy.children[i + 1].x - smallHierarchy.children[i].x);
        smallSpacings.push(spacing);
      }
      const avgSmallSpacing = smallSpacings.reduce((a, b) => a + b, 0) / smallSpacings.length;

      // Calculate average spacing for large hierarchy
      const largeSpacings = [];
      for (let i = 0; i < largeHierarchy.children.length - 1; i++) {
        const spacing = Math.abs(largeHierarchy.children[i + 1].x - largeHierarchy.children[i].x);
        largeSpacings.push(spacing);
      }
      const avgLargeSpacing = largeSpacings.reduce((a, b) => a + b, 0) / largeSpacings.length;

      // Large hierarchies should have tighter spacing
      assert.ok(avgLargeSpacing <= avgSmallSpacing, 'Large hierarchies should use tighter automatic spacing');
    });
  });
}

export default { testAutomaticPositioning, testAutomaticSpacing };
