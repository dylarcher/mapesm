// write functions that act as a callback for node:test test(callback) methods
// specific to the horizontally (x-axis) aligned nodes in the graph output file

import * as d3 from 'd3';
import assert from 'node:assert';
import { describe, test } from 'node:test';
import { positionNodes } from '../../src/services/provider.js';

/**
 * Tests for horizontal node alignment and x-axis distribution
 */
export function testHorizontalAlignment() {
  describe('Horizontal Node Alignment', () => {
    test('should align nodes at same level horizontally', () => {
      const root = {
        name: 'center',
        children: [
          { name: 'left', children: [] },
          { name: 'middle', children: [] },
          { name: 'right', children: [] }
        ]
      };
      const hierarchy = d3.hierarchy(root);

      positionNodes(hierarchy, 2, 800, 'linear', 'horizontal');

      // All children should be at the same y level (horizontal alignment)
      const childrenYPositions = hierarchy.children.map(child => child.y);
      const uniqueYPositions = [...new Set(childrenYPositions.map(y => Math.round(y)))];

      // Should have roughly the same y coordinate (allowing for small variations)
      assert.ok(uniqueYPositions.length <= 2, 'Children should be horizontally aligned at similar y levels');

      // Should span horizontally across x-axis
      const xPositions = hierarchy.children.map(child => child.x);
      const xRange = Math.max(...xPositions) - Math.min(...xPositions);

      assert.ok(xRange > 0, 'Nodes should be distributed horizontally across x-axis');
      assert.ok(xRange > 100, 'Horizontal distribution should be significant');
    });

    test('should maintain horizontal spacing consistency', () => {
      const root = {
        name: 'base',
        children: Array.from({ length: 6 }, (_, i) => ({ name: `node_${i}`, children: [] }))
      };
      const hierarchy = d3.hierarchy(root);

      positionNodes(hierarchy, 2, 800, 'linear', 'horizontal');

      // Sort children by x position for spacing analysis
      const sortedChildren = hierarchy.children.sort((a, b) => a.x - b.x);

      // Calculate horizontal spacings between adjacent nodes
      const spacings = [];
      for (let i = 0; i < sortedChildren.length - 1; i++) {
        const spacing = sortedChildren[i + 1].x - sortedChildren[i].x;
        spacings.push(spacing);
      }

      // Horizontal spacings should be relatively consistent
      const avgSpacing = spacings.reduce((a, b) => a + b, 0) / spacings.length;
      const spacingVariance = spacings.reduce((sum, spacing) =>
        sum + Math.pow(spacing - avgSpacing, 2), 0) / spacings.length;
      const spacingStdDev = Math.sqrt(spacingVariance);

      // Standard deviation should be reasonable compared to average
      const coefficientOfVariation = spacingStdDev / avgSpacing;
      assert.ok(coefficientOfVariation < 0.5, 'Horizontal spacing should be relatively consistent');
    });

    test('should handle horizontal bounds correctly', () => {
      const root = {
        name: 'origin',
        children: [
          { name: 'leftmost', children: [] },
          { name: 'center', children: [] },
          { name: 'rightmost', children: [] }
        ]
      };
      const hierarchy = d3.hierarchy(root);

      const bounds = positionNodes(hierarchy, 2, 800, 'linear', 'horizontal');

      // Verify that bounds encompass all horizontal positions
      const allXPositions = hierarchy.descendants().map(node => node.x);
      const actualMinX = Math.min(...allXPositions);
      const actualMaxX = Math.max(...allXPositions);

      assert.ok(bounds.minX <= actualMinX, 'Bounds minX should encompass leftmost node');
      assert.ok(bounds.maxX >= actualMaxX, 'Bounds maxX should encompass rightmost node');

      // Horizontal span should be reasonable
      const horizontalSpan = bounds.maxX - bounds.minX;
      assert.ok(horizontalSpan > 0, 'Should have positive horizontal span');
    });

    test('should distribute siblings horizontally with balanced spacing', () => {
      const root = {
        name: 'parent',
        children: [
          { name: 'first', children: [] },
          { name: 'second', children: [] },
          { name: 'third', children: [] },
          { name: 'fourth', children: [] },
          { name: 'fifth', children: [] }
        ]
      };
      const hierarchy = d3.hierarchy(root);

      positionNodes(hierarchy, 2, 800, 'linear', 'horizontal');

      // Check horizontal distribution balance
      const childXPositions = hierarchy.children.map(child => child.x).sort((a, b) => a - b);

      // Calculate center of mass
      const centerOfMass = childXPositions.reduce((sum, x) => sum + x, 0) / childXPositions.length;

      // Should be roughly centered around the parent (which is at x=0)
      assert.ok(Math.abs(centerOfMass) < 50, 'Horizontal distribution should be balanced around center');

      // Should have nodes on both sides of center
      const leftNodes = childXPositions.filter(x => x < -10);
      const rightNodes = childXPositions.filter(x => x > 10);

      assert.ok(leftNodes.length > 0, 'Should have nodes on the left side');
      assert.ok(rightNodes.length > 0, 'Should have nodes on the right side');
    });
  });
}

export function testHorizontalScaling() {
  describe('Horizontal Layout Scaling', () => {
    test('should scale horizontally with canvas width', () => {
      const createHierarchy = () => ({
        name: 'root',
        children: Array.from({ length: 4 }, (_, i) => ({ name: `child_${i}`, children: [] }))
      });

      const narrowHierarchy = d3.hierarchy(createHierarchy());
      const wideHierarchy = d3.hierarchy(createHierarchy());

      const narrowBounds = positionNodes(narrowHierarchy, 2, 400, 'linear', 'horizontal');  // Narrow canvas
      const wideBounds = positionNodes(wideHierarchy, 2, 1200, 'linear', 'horizontal');     // Wide canvas

      // Wide canvas should allow for more horizontal spread
      const narrowSpan = narrowBounds.maxX - narrowBounds.minX;
      const wideSpan = wideBounds.maxX - wideBounds.minX;

      // Wide layout should have larger or equal horizontal span
      assert.ok(wideSpan >= narrowSpan, 'Wide canvas should allow for greater horizontal distribution');

      // Both should maintain proper horizontal distribution
      assert.ok(narrowSpan > 0, 'Narrow layout should still have horizontal spread');
      assert.ok(wideSpan > 0, 'Wide layout should have horizontal spread');
    });

    test('should maintain horizontal proportions across different node counts', () => {
      const smallSet = d3.hierarchy({
        name: 'root',
        children: [
          { name: 'a', children: [] },
          { name: 'b', children: [] }
        ]
      });

      const largeSet = d3.hierarchy({
        name: 'root',
        children: Array.from({ length: 8 }, (_, i) => ({ name: `node_${i}`, children: [] }))
      });

      const smallBounds = positionNodes(smallSet, 2, 800, 'linear', 'horizontal');
      const largeBounds = positionNodes(largeSet, 2, 800, 'linear', 'horizontal');

      // Large set should use more horizontal space efficiently
      const smallSpan = smallBounds.maxX - smallBounds.minX;
      const largeSpan = largeBounds.maxX - largeBounds.minX;

      assert.ok(largeSpan >= smallSpan, 'Larger node sets should use more horizontal space');

      // But both should utilize available horizontal space appropriately
      assert.ok(smallSpan > 50, 'Small sets should still spread horizontally');
      assert.ok(largeSpan < 1000, 'Large sets should not exceed reasonable bounds');
    });
  });
}

export default { testHorizontalAlignment, testHorizontalScaling };
