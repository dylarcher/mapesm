// write functions that act as a callback for node:test test(callback) methods
// specific to the diagonally positioned nodes in the graph output file render

import * as d3 from 'd3';
import assert from 'node:assert';
import { describe, test } from 'node:test';
import { positionNodes } from '../../src/services/provider.js';

/**
 * Tests for diagonal node positioning patterns and layouts
 */
export function testDiagonalPositioning() {
  describe('Diagonal Node Positioning', () => {
    test('should create diagonal relationships between parent-child nodes', () => {
      const root = {
        name: 'parent',
        children: [
          {
            name: 'child',
            children: [
              { name: 'grandchild', children: [] }
            ]
          }
        ]
      };
      const hierarchy = d3.hierarchy(root);

      positionNodes(hierarchy, 3, 800);

      const parent = hierarchy;
      const child = hierarchy.children[0];
      const grandchild = child.children[0];

      // Calculate vectors between generations
      const parentToChild = { x: child.x - parent.x, y: child.y - parent.y };
      const childToGrandchild = { x: grandchild.x - child.x, y: grandchild.y - child.y };

      // Both vectors should have non-zero x and y components (diagonal)
      assert.notEqual(parentToChild.x, 0, 'Parent to child should have horizontal component');
      assert.notEqual(parentToChild.y, 0, 'Parent to child should have vertical component');
      assert.notEqual(childToGrandchild.x, 0, 'Child to grandchild should have horizontal component');
      assert.notEqual(childToGrandchild.y, 0, 'Child to grandchild should have vertical component');

      // Calculate diagonal angles
      const angle1 = Math.atan2(parentToChild.y, parentToChild.x);
      const angle2 = Math.atan2(childToGrandchild.y, childToGrandchild.x);

      // Angles should not be 0, π/2, π, or 3π/2 (not purely horizontal/vertical)
      const pureAngles = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2];
      const tolerance = 0.1;

      pureAngles.forEach(pureAngle => {
        assert.ok(Math.abs(angle1 - pureAngle) > tolerance, 'Connection should not be purely horizontal/vertical');
        assert.ok(Math.abs(angle2 - pureAngle) > tolerance, 'Connection should not be purely horizontal/vertical');
      });
    });

    test('should maintain diagonal flow consistency', () => {
      const root = {
        name: 'start',
        children: [
          {
            name: 'branch1',
            children: [{ name: 'end1', children: [] }]
          },
          {
            name: 'branch2',
            children: [{ name: 'end2', children: [] }]
          }
        ]
      };
      const hierarchy = d3.hierarchy(root);

      positionNodes(hierarchy, 3, 800);

      // Check diagonal consistency across branches
      const branch1 = hierarchy.children[0];
      const branch2 = hierarchy.children[1];
      const end1 = branch1.children[0];
      const end2 = branch2.children[0];

      // Both branches should follow similar diagonal patterns
      const diag1 = { x: end1.x - branch1.x, y: end1.y - branch1.y };
      const diag2 = { x: end2.x - branch2.x, y: end2.y - branch2.y };

      const angle1 = Math.atan2(diag1.y, diag1.x);
      const angle2 = Math.atan2(diag2.y, diag2.x);

      // Angles should be in same general quadrant (consistent diagonal flow)
      const quadrant1 = Math.floor(angle1 / (Math.PI / 2));
      const quadrant2 = Math.floor(angle2 / (Math.PI / 2));

      // Allow for adjacent quadrants due to semi-circle layout
      const quadrantDifference = Math.abs(quadrant1 - quadrant2);
      assert.ok(quadrantDifference <= 1, 'Diagonal branches should flow in similar directions');
    });

    test('should create meaningful diagonal distances', () => {
      const root = {
        name: 'center',
        children: [
          { name: 'ne', children: [] }, // northeast
          { name: 'nw', children: [] }, // northwest
          { name: 'se', children: [] }, // southeast
          { name: 'sw', children: [] }  // southwest
        ]
      };
      const hierarchy = d3.hierarchy(root);

      positionNodes(hierarchy, 2, 800);

      hierarchy.children.forEach(child => {
        const distance = Math.sqrt(child.x * child.x + child.y * child.y);
        const horizontalDistance = Math.abs(child.x);
        const verticalDistance = Math.abs(child.y);

        // Diagonal distance should be greater than either component alone
        assert.ok(distance > horizontalDistance, 'Diagonal distance should exceed horizontal component');
        assert.ok(distance > verticalDistance, 'Diagonal distance should exceed vertical component');

        // Should not be purely horizontal or vertical (both components should be significant)
        const ratio = Math.min(horizontalDistance, verticalDistance) / Math.max(horizontalDistance, verticalDistance);
        assert.ok(ratio > 0.1, 'Should have significant diagonal component, not purely horizontal/vertical');
      });
    });

    test('should handle diagonal space utilization efficiently', () => {
      const root = {
        name: 'hub',
        children: Array.from({ length: 8 }, (_, i) => ({
          name: `spoke_${i}`,
          children: [{ name: `end_${i}`, children: [] }]
        }))
      };
      const hierarchy = d3.hierarchy(root);

      const bounds = positionNodes(hierarchy, 3, 800);

      // Calculate total diagonal space used
      const totalWidth = bounds.maxX - bounds.minX;
      const totalHeight = bounds.maxY - bounds.minY;
      const diagonalSpace = Math.sqrt(totalWidth * totalWidth + totalHeight * totalHeight);

      // Verify nodes are spread across diagonal quadrants
      const quadrants = { ne: 0, nw: 0, se: 0, sw: 0 };

      hierarchy.descendants().forEach(node => {
        if (node.depth > 0) { // Skip root
          if (node.x >= 0 && node.y >= 0) quadrants.ne++;
          if (node.x < 0 && node.y >= 0) quadrants.nw++;
          if (node.x >= 0 && node.y < 0) quadrants.se++;
          if (node.x < 0 && node.y < 0) quadrants.sw++;
        }
      });

      // Should utilize multiple quadrants for good diagonal distribution
      const occupiedQuadrants = Object.values(quadrants).filter(count => count > 0).length;
      assert.ok(occupiedQuadrants >= 2, 'Should utilize multiple quadrants for diagonal layout');
      assert.ok(diagonalSpace > totalWidth, 'Diagonal space should exceed linear width');
      assert.ok(diagonalSpace > totalHeight, 'Diagonal space should exceed linear height');
    });
  });
}

export function testDiagonalMeasurements() {
  describe('Diagonal Layout Measurements', () => {
    test('should calculate diagonal angles correctly', () => {
      const root = {
        name: 'origin',
        children: [
          { name: 'diagonal_target', children: [] }
        ]
      };
      const hierarchy = d3.hierarchy(root);

      positionNodes(hierarchy, 2, 800);

      const child = hierarchy.children[0];
      const angle = Math.atan2(child.y, child.x);
      const degrees = angle * 180 / Math.PI;

      // Should be in reasonable diagonal range (not 0°, 90°, 180°, 270°)
      const diagonalRanges = [
        { min: 15, max: 75 },   // NE quadrant
        { min: 105, max: 165 }, // NW quadrant
        { min: 195, max: 255 }, // SW quadrant
        { min: 285, max: 345 }  // SE quadrant
      ];

      const normalizedDegrees = degrees < 0 ? degrees + 360 : degrees;
      const isInDiagonalRange = diagonalRanges.some(range =>
        normalizedDegrees >= range.min && normalizedDegrees <= range.max
      );

      assert.ok(isInDiagonalRange, `Angle ${normalizedDegrees}° should be in a diagonal range`);
    });

    test('should maintain diagonal proportions under different scales', () => {
      const createHierarchy = () => ({
        name: 'base',
        children: [
          { name: 'diag1', children: [] },
          { name: 'diag2', children: [] }
        ]
      });

      const hierarchy1 = d3.hierarchy(createHierarchy());
      const hierarchy2 = d3.hierarchy(createHierarchy());

      positionNodes(hierarchy1, 2, 400);  // Smaller canvas
      positionNodes(hierarchy2, 2, 1200); // Larger canvas

      // Calculate aspect ratios of diagonal relationships
      const calcAspectRatio = (hierarchy) => {
        const child = hierarchy.children[0];
        return Math.abs(child.x) / Math.abs(child.y);
      };

      const ratio1 = calcAspectRatio(hierarchy1);
      const ratio2 = calcAspectRatio(hierarchy2);

      // Diagonal proportions should be similar regardless of scale
      const proportionDifference = Math.abs(ratio1 - ratio2) / Math.max(ratio1, ratio2);
      assert.ok(proportionDifference < 0.3, 'Diagonal proportions should be consistent across different scales');
    });
  });
}

export default { testDiagonalPositioning, testDiagonalMeasurements };
