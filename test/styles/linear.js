// write functions that act as a callback for node:test test(callback) methods
// specific to the linear positioning of nodes in the graph output file render

import * as d3 from 'd3';
import assert from 'node:assert';
import { describe, test } from 'node:test';
import { positionNodes } from '../../src/services/provider.js';

/**
 * Tests for linear node positioning and layout verification
 */
export function testLinearPositioning() {
  describe('Linear Node Positioning', () => {
    test('should create linear progression in y-axis by depth', () => {
      const root = {
        name: 'root',
        children: [
          {
            name: 'level1',
            children: [
              {
                name: 'level2',
                children: [
                  { name: 'level3', children: [] }
                ]
              }
            ]
          }
        ]
      };
      const hierarchy = d3.hierarchy(root);

      positionNodes(hierarchy, 4, 800);

      // Collect nodes by depth
      const nodesByDepth = new Map();
      hierarchy.each(node => {
        if (!nodesByDepth.has(node.depth)) {
          nodesByDepth.set(node.depth, []);
        }
        nodesByDepth.get(node.depth).push(node);
      });

      // Verify linear progression in y coordinates
      const depths = Array.from(nodesByDepth.keys()).sort();
      for (let i = 0; i < depths.length - 1; i++) {
        const currentDepth = depths[i];
        const nextDepth = depths[i + 1];

        const currentY = nodesByDepth.get(currentDepth)[0].y;
        const nextY = nodesByDepth.get(nextDepth)[0].y;

        assert.ok(nextY > currentY,
          `Depth ${nextDepth} should have greater y coordinate than depth ${currentDepth} (linear progression)`);
      }
    });

    test('should maintain consistent linear spacing between levels', () => {
      const root = {
        name: 'root',
        children: [
          {
            name: 'level1_a',
            children: [{ name: 'level2_a', children: [] }]
          },
          {
            name: 'level1_b',
            children: [{ name: 'level2_b', children: [] }]
          }
        ]
      };
      const hierarchy = d3.hierarchy(root);

      positionNodes(hierarchy, 3, 800);

      // Calculate level spacing
      const rootY = hierarchy.y;
      const level1Nodes = hierarchy.children;
      const level2Nodes = hierarchy.descendants().filter(d => d.depth === 2);

      const level1Y = level1Nodes[0].y;
      const level2Y = level2Nodes[0].y;

      const spacing1to2 = level1Y - rootY;
      const spacing2to3 = level2Y - level1Y;

      // Linear spacing should be roughly consistent
      const spacingDifference = Math.abs(spacing1to2 - spacing2to3);
      const tolerance = Math.max(spacing1to2, spacing2to3) * 0.2; // 20% tolerance

      assert.ok(spacingDifference <= tolerance,
        `Linear spacing should be consistent between levels (difference: ${spacingDifference}, tolerance: ${tolerance})`);
    });

    test('should handle single-branch linear chains', () => {
      // Create a purely linear chain
      const root = {
        name: 'start',
        children: [
          {
            name: 'step1',
            children: [
              {
                name: 'step2',
                children: [
                  {
                    name: 'step3',
                    children: [
                      { name: 'end', children: [] }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      };
      const hierarchy = d3.hierarchy(root);

      positionNodes(hierarchy, 5, 800);

      // All nodes in chain should have same x coordinate (linear vertical alignment)
      let currentNode = hierarchy;
      const xPositions = [];

      while (currentNode) {
        xPositions.push(currentNode.x);
        currentNode = currentNode.children ? currentNode.children[0] : null;
      }

      // Check vertical alignment (all x positions should be close)
      const avgX = xPositions.reduce((a, b) => a + b, 0) / xPositions.length;
      const maxDeviation = Math.max(...xPositions.map(x => Math.abs(x - avgX)));

      assert.ok(maxDeviation < 50,
        `Linear chain should maintain vertical alignment (max deviation: ${maxDeviation})`);
    });

    test('should distribute siblings linearly along x-axis', () => {
      const root = {
        name: 'parent',
        children: [
          { name: 'child_1', children: [] },
          { name: 'child_2', children: [] },
          { name: 'child_3', children: [] },
          { name: 'child_4', children: [] },
          { name: 'child_5', children: [] }
        ]
      };
      const hierarchy = d3.hierarchy(root);

      positionNodes(hierarchy, 2, 800);

      // Siblings should be distributed along x-axis
      const siblingPositions = hierarchy.children.map(child => child.x).sort((a, b) => a - b);

      // Check for monotonic increase (linear distribution)
      for (let i = 0; i < siblingPositions.length - 1; i++) {
        assert.ok(siblingPositions[i + 1] > siblingPositions[i],
          `Sibling positions should increase linearly (${siblingPositions[i]} -> ${siblingPositions[i + 1]})`);
      }

      // Calculate spacing consistency
      const spacings = [];
      for (let i = 0; i < siblingPositions.length - 1; i++) {
        spacings.push(siblingPositions[i + 1] - siblingPositions[i]);
      }

      // Linear distribution should have relatively consistent spacing
      const avgSpacing = spacings.reduce((a, b) => a + b, 0) / spacings.length;
      const spacingVariance = spacings.reduce((sum, spacing) =>
        sum + Math.pow(spacing - avgSpacing, 2), 0) / spacings.length;

      assert.ok(spacingVariance < avgSpacing * avgSpacing,
        'Linear sibling distribution should have consistent spacing');
    });
  });
}

export function testLinearMeasurements() {
  describe('Linear Layout Measurements', () => {
    test('should calculate linear bounds correctly', () => {
      const root = {
        name: 'origin',
        children: [
          { name: 'left', children: [] },
          { name: 'right', children: [] }
        ]
      };
      const hierarchy = d3.hierarchy(root);

      const bounds = positionNodes(hierarchy, 2, 800);

      assert.ok(typeof bounds.minX === 'number', 'Should provide minX bound');
      assert.ok(typeof bounds.maxX === 'number', 'Should provide maxX bound');
      assert.ok(typeof bounds.minY === 'number', 'Should provide minY bound');
      assert.ok(typeof bounds.maxY === 'number', 'Should provide maxY bound');

      // Bounds should encompass all nodes
      hierarchy.each(node => {
        assert.ok(node.x >= bounds.minX && node.x <= bounds.maxX,
          `Node x (${node.x}) should be within bounds [${bounds.minX}, ${bounds.maxX}]`);
        assert.ok(node.y >= bounds.minY && node.y <= bounds.maxY,
          `Node y (${node.y}) should be within bounds [${bounds.minY}, ${bounds.maxY}]`);
      });
    });

    test('should maintain aspect ratio considerations in linear layout', () => {
      const wideHierarchy = d3.hierarchy({
        name: 'root',
        children: Array.from({ length: 10 }, (_, i) => ({ name: `wide_${i}`, children: [] }))
      });

      const tallHierarchy = d3.hierarchy({
        name: 'root',
        children: [
          {
            name: 'level1',
            children: [
              {
                name: 'level2',
                children: Array.from({ length: 3 }, (_, i) => ({ name: `deep_${i}`, children: [] }))
              }
            ]
          }
        ]
      });

      const wideBounds = positionNodes(wideHierarchy, 2, 800);
      const tallBounds = positionNodes(tallHierarchy, 4, 800);

      const wideAspectRatio = (wideBounds.maxX - wideBounds.minX) / (wideBounds.maxY - wideBounds.minY);
      const tallAspectRatio = (tallBounds.maxX - tallBounds.minX) / (tallBounds.maxY - tallBounds.minY);

      assert.ok(wideAspectRatio > tallAspectRatio,
        'Wide hierarchy should have larger aspect ratio than tall hierarchy in linear layout');
    });
  });
}

export default { testLinearPositioning, testLinearMeasurements };
