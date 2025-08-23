// write functions that act as a callback for node:test test(callback) methods
// specific to the vertically (y-axis) aligned nodes in the graph output file

import * as d3 from 'd3';
import assert from 'node:assert';
import { describe, test } from 'node:test';
import { positionNodes } from '../../src/services/provider.js';

/**
 * Tests for vertical node alignment and y-axis distribution
 */
export function testVerticalAlignment() {
  describe('Vertical Node Alignment', () => {
    test('should align nodes vertically by depth levels', () => {
      const root = {
        name: 'top',
        children: [
          {
            name: 'middle',
            children: [
              { name: 'bottom', children: [] }
            ]
          }
        ]
      };
      const hierarchy = d3.hierarchy(root);

      positionNodes(hierarchy, 3, 800, 'linear', 'vertical');

      // Each depth level should have progressively larger y values
      const topY = hierarchy.y;                    // depth 0
      const middleY = hierarchy.children[0].y;     // depth 1
      const bottomY = hierarchy.children[0].children[0].y; // depth 2

      assert.ok(middleY > topY, 'Middle level should be below top level');
      assert.ok(bottomY > middleY, 'Bottom level should be below middle level');

      // Vertical progression should be consistent
      const firstGap = middleY - topY;
      const secondGap = bottomY - middleY;
      const gapRatio = Math.max(firstGap, secondGap) / Math.min(firstGap, secondGap);

      assert.ok(gapRatio < 3, 'Vertical gaps should be relatively consistent');
    });

    test('should maintain vertical spacing between generations', () => {
      const root = {
        name: 'generation_0',
        children: [
          {
            name: 'generation_1a',
            children: [
              { name: 'generation_2a', children: [] },
              { name: 'generation_2b', children: [] }
            ]
          },
          {
            name: 'generation_1b',
            children: [
              { name: 'generation_2c', children: [] }
            ]
          }
        ]
      };
      const hierarchy = d3.hierarchy(root);

      positionNodes(hierarchy, 3, 800, 'linear', 'vertical');

      // Group nodes by depth
      const nodesByDepth = new Map();
      hierarchy.each(node => {
        if (!nodesByDepth.has(node.depth)) {
          nodesByDepth.set(node.depth, []);
        }
        nodesByDepth.get(node.depth).push(node);
      });

      // Check vertical separation between levels
      for (let depth = 0; depth < 2; depth++) {
        const currentLevel = nodesByDepth.get(depth);
        const nextLevel = nodesByDepth.get(depth + 1);

        if (currentLevel && nextLevel) {
          const currentLevelY = currentLevel[0].y;
          const nextLevelMinY = Math.min(...nextLevel.map(node => node.y));

          const verticalSeparation = nextLevelMinY - currentLevelY;
          assert.ok(verticalSeparation > 20,
            `Level ${depth + 1} should be sufficiently below level ${depth} (separation: ${verticalSeparation})`);
        }
      }
    });

    test('should handle single-column vertical alignment', () => {
      // Create a perfectly linear vertical chain
      const root = {
        name: 'top',
        children: [
          {
            name: 'second',
            children: [
              {
                name: 'third',
                children: [
                  { name: 'bottom', children: [] }
                ]
              }
            ]
          }
        ]
      };
      const hierarchy = d3.hierarchy(root);

      positionNodes(hierarchy, 4, 800, 'linear', 'vertical');

      // All nodes in the chain should have similar x coordinates (vertical alignment)
      const xPositions = [];
      let currentNode = hierarchy;

      while (currentNode) {
        xPositions.push(currentNode.x);
        currentNode = currentNode.children ? currentNode.children[0] : null;
      }

      // Calculate variance in x positions
      const avgX = xPositions.reduce((a, b) => a + b, 0) / xPositions.length;
      const xVariance = xPositions.reduce((sum, x) => sum + Math.pow(x - avgX, 2), 0) / xPositions.length;
      const xStdDev = Math.sqrt(xVariance);

      assert.ok(xStdDev < 20, 'Nodes in vertical chain should be closely aligned horizontally');
    });

    test('should distribute vertically within canvas bounds', () => {
      const root = {
        name: 'root',
        children: [
          {
            name: 'level1',
            children: [
              {
                name: 'level2',
                children: [
                  {
                    name: 'level3',
                    children: [
                      { name: 'level4', children: [] }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      };
      const hierarchy = d3.hierarchy(root);

      const bounds = positionNodes(hierarchy, 5, 800, 'linear', 'vertical');

      // Verify vertical bounds encompass all nodes
      const allYPositions = hierarchy.descendants().map(node => node.y);
      const actualMinY = Math.min(...allYPositions);
      const actualMaxY = Math.max(...allYPositions);

      assert.ok(bounds.minY <= actualMinY, 'Bounds minY should encompass topmost node');
      assert.ok(bounds.maxY >= actualMaxY, 'Bounds maxY should encompass bottommost node');

      // Should use reasonable vertical space
      const verticalSpan = bounds.maxY - bounds.minY;
      assert.ok(verticalSpan > 0, 'Should have positive vertical span');
      assert.ok(verticalSpan > 100, 'Should use meaningful vertical space');
    });
  });
}

export function testVerticalScaling() {
  describe('Vertical Layout Scaling', () => {
    test('should scale vertically with hierarchy depth', () => {
      const shallowHierarchy = d3.hierarchy({
        name: 'root',
        children: [{ name: 'child', children: [] }]
      });

      const deepHierarchy = d3.hierarchy({
        name: 'root',
        children: [
          {
            name: 'level1',
            children: [
              {
                name: 'level2',
                children: [
                  {
                    name: 'level3',
                    children: [
                      { name: 'level4', children: [] }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      });

      const shallowBounds = positionNodes(shallowHierarchy, 2, 800, 'linear', 'vertical');
      const deepBounds = positionNodes(deepHierarchy, 5, 800, 'linear', 'vertical');

      // Deep hierarchy should use more vertical space
      const shallowHeight = shallowBounds.maxY - shallowBounds.minY;
      const deepHeight = deepBounds.maxY - deepBounds.minY;

      assert.ok(deepHeight > shallowHeight, 'Deeper hierarchy should use more vertical space');
      assert.ok(deepHeight > shallowHeight * 2, 'Vertical scaling should be significant');
    });

    test('should maintain proportional vertical spacing', () => {
      const createChain = (depth) => {
        let current = { name: `level_${depth}`, children: [] };
        for (let i = depth - 1; i >= 0; i--) {
          current = { name: `level_${i}`, children: [current] };
        }
        return current;
      };

      const mediumChain = d3.hierarchy(createChain(3));
      const longChain = d3.hierarchy(createChain(6));

      positionNodes(mediumChain, 4, 800, 'linear', 'vertical');
      positionNodes(longChain, 7, 800, 'linear', 'vertical');

      // Calculate average vertical step size
      const getMediumSteps = () => {
        const steps = [];
        let node = mediumChain;
        while (node.children && node.children.length > 0) {
          const step = node.children[0].y - node.y;
          steps.push(step);
          node = node.children[0];
        }
        return steps.reduce((a, b) => a + b, 0) / steps.length;
      };

      const getLongSteps = () => {
        const steps = [];
        let node = longChain;
        while (node.children && node.children.length > 0) {
          const step = node.children[0].y - node.y;
          steps.push(step);
          node = node.children[0];
        }
        return steps.reduce((a, b) => a + b, 0) / steps.length;
      };

      const mediumStepSize = getMediumSteps();
      const longStepSize = getLongSteps();

      // Step sizes should be reasonable and proportional
      assert.ok(mediumStepSize > 0, 'Medium chain should have positive vertical steps');
      assert.ok(longStepSize > 0, 'Long chain should have positive vertical steps');

      // Longer chains might have smaller steps to fit, but should still be reasonable
      const stepRatio = mediumStepSize / longStepSize;
      assert.ok(stepRatio >= 0.5 && stepRatio <= 3, 'Vertical step sizes should be proportionally reasonable');
    });

    test('should handle mixed vertical distributions', () => {
      const root = {
        name: 'root',
        children: [
          {
            name: 'shallow_branch',
            children: [{ name: 'shallow_end', children: [] }]
          },
          {
            name: 'deep_branch',
            children: [
              {
                name: 'deep_middle',
                children: [
                  {
                    name: 'deep_end',
                    children: []
                  }
                ]
              }
            ]
          }
        ]
      };
      const hierarchy = d3.hierarchy(root);

      positionNodes(hierarchy, 4, 800, 'linear', 'vertical');

      // Both branches should start at the same level
      const shallowBranch = hierarchy.children[0];
      const deepBranch = hierarchy.children[1];

      // Level 1 nodes should be at similar y positions
      const level1YDifference = Math.abs(shallowBranch.y - deepBranch.y);
      assert.ok(level1YDifference < 50, 'First level branches should be at similar vertical positions');

      // Deep branch should extend further vertically
      const shallowEnd = shallowBranch.children[0];
      const deepEnd = deepBranch.children[0].children[0];

      assert.ok(deepEnd.y > shallowEnd.y, 'Deeper branch should extend further vertically');
    });
  });
}

export default { testVerticalAlignment, testVerticalScaling };
