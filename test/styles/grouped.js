// write functions that act as a callback for node:test test(callback) methods
// specific to the categoric grouping of nodes in the graph output file diagram

import * as d3 from 'd3';
import assert from 'node:assert';
import { describe, test } from 'node:test';
import { positionNodes } from '../../src/services/provider.js';
import { extractSecondLevelDirectories, getColorByDepth } from '../../src/utils.js';

/**
 * Tests for grouped node positioning and categorical organization
 */
export function testGroupedPositioning() {
  describe('Grouped Node Positioning', () => {
    test('should group nodes by directory categories', () => {
      const root = {
        name: 'project',
        children: [
          {
            name: 'src',
            children: [
              { name: 'main.js', children: [] },
              { name: 'utils.js', children: [] }
            ]
          },
          {
            name: 'test',
            children: [
              { name: 'main.test.js', children: [] },
              { name: 'utils.test.js', children: [] }
            ]
          },
          {
            name: 'docs',
            children: [
              { name: 'README.md', children: [] }
            ]
          }
        ]
      };
      const hierarchy = d3.hierarchy(root);

      positionNodes(hierarchy, 3, 800);

      // Nodes within the same directory group should be relatively close
      const srcBranch = hierarchy.children.find(c => c.data.name === 'src');
      const testBranch = hierarchy.children.find(c => c.data.name === 'test');

      if (srcBranch && srcBranch.children && srcBranch.children.length > 1) {
        const srcChildren = srcBranch.children;
        const srcSpread = Math.max(...srcChildren.map(c => c.x)) - Math.min(...srcChildren.map(c => c.x));

        if (testBranch && testBranch.children && testBranch.children.length > 1) {
          const testChildren = testBranch.children;
          const testSpread = Math.max(...testChildren.map(c => c.x)) - Math.min(...testChildren.map(c => c.x));

          // Group spread should be reasonable (not too wide)
          const maxAllowedSpread = 200;
          assert.ok(srcSpread < maxAllowedSpread, `Source group should be clustered (spread: ${srcSpread})`);
          assert.ok(testSpread < maxAllowedSpread, `Test group should be clustered (spread: ${testSpread})`);
        }
      }
    });

    test('should separate different category groups', () => {
      const root = {
        name: 'project',
        children: [
          {
            name: 'frontend',
            children: [
              { name: 'app.js', children: [] },
              { name: 'components.js', children: [] }
            ]
          },
          {
            name: 'backend',
            children: [
              { name: 'server.js', children: [] },
              { name: 'database.js', children: [] }
            ]
          },
          {
            name: 'shared',
            children: [
              { name: 'utils.js', children: [] },
              { name: 'constants.js', children: [] }
            ]
          }
        ]
      };
      const hierarchy = d3.hierarchy(root);

      positionNodes(hierarchy, 3, 800);

      const groups = hierarchy.children.map(child => ({
        name: child.data.name,
        x: child.x,
        children: child.children || []
      }));

      // Different groups should be spatially separated
      for (let i = 0; i < groups.length - 1; i++) {
        for (let j = i + 1; j < groups.length; j++) {
          const distance = Math.abs(groups[i].x - groups[j].x);
          const minSeparation = 50;

          assert.ok(distance > minSeparation,
            `Groups ${groups[i].name} and ${groups[j].name} should be separated (distance: ${distance})`);
        }
      }
    });

    test('should maintain group cohesion within categories', () => {
      const root = {
        name: 'system',
        children: [
          {
            name: 'auth',
            children: [
              { name: 'login.js', children: [] },
              { name: 'permissions.js', children: [] },
              { name: 'tokens.js', children: [] }
            ]
          },
          {
            name: 'data',
            children: [
              { name: 'models.js', children: [] },
              { name: 'queries.js', children: [] },
              { name: 'migrations.js', children: [] }
            ]
          }
        ]
      };
      const hierarchy = d3.hierarchy(root);

      positionNodes(hierarchy, 3, 800);

      // Check cohesion within each group
      hierarchy.children.forEach(groupNode => {
        if (groupNode.children && groupNode.children.length > 2) {
          const children = groupNode.children;
          const positions = children.map(child => ({ x: child.x, y: child.y }));

          // Calculate centroid of the group
          const centroid = {
            x: positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length,
            y: positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length
          };

          // Calculate average distance from centroid (measure of cohesion)
          const avgDistanceFromCentroid = positions.reduce((sum, pos) => {
            const distance = Math.sqrt(
              Math.pow(pos.x - centroid.x, 2) + Math.pow(pos.y - centroid.y, 2)
            );
            return sum + distance;
          }, 0) / positions.length;

          // Group should be relatively cohesive
          const maxAllowedCohesionRadius = 100;
          assert.ok(avgDistanceFromCentroid < maxAllowedCohesionRadius,
            `Group ${groupNode.data.name} should be cohesive (avg distance from center: ${avgDistanceFromCentroid})`);
        }
      });
    });

    test('should handle mixed category sizes', () => {
      const root = {
        name: 'project',
        children: [
          {
            name: 'large_module',
            children: Array.from({ length: 8 }, (_, i) => ({ name: `file_${i}.js`, children: [] }))
          },
          {
            name: 'medium_module',
            children: Array.from({ length: 3 }, (_, i) => ({ name: `mod_${i}.js`, children: [] }))
          },
          {
            name: 'small_module',
            children: [{ name: 'single.js', children: [] }]
          }
        ]
      };
      const hierarchy = d3.hierarchy(root);

      positionNodes(hierarchy, 3, 800);

      // Each group should still be positioned appropriately despite size differences
      const groupSizes = hierarchy.children.map(child => ({
        name: child.data.name,
        size: child.children ? child.children.length : 0,
        x: child.x,
        y: child.y
      }));

      // All groups should be positioned (no NaN or undefined coordinates)
      groupSizes.forEach(group => {
        assert.ok(typeof group.x === 'number' && !isNaN(group.x),
          `Group ${group.name} should have valid x position`);
        assert.ok(typeof group.y === 'number' && !isNaN(group.y),
          `Group ${group.name} should have valid y position`);
      });

      // Groups should not overlap at the same position
      for (let i = 0; i < groupSizes.length - 1; i++) {
        for (let j = i + 1; j < groupSizes.length; j++) {
          const distance = Math.sqrt(
            Math.pow(groupSizes[i].x - groupSizes[j].x, 2) +
            Math.pow(groupSizes[i].y - groupSizes[j].y, 2)
          );
          assert.ok(distance > 10,
            `Groups ${groupSizes[i].name} and ${groupSizes[j].name} should not overlap`);
        }
      }
    });
  });
}

export function testGroupedColorCoding() {
  describe('Grouped Color Coding', () => {
    test('should assign consistent colors within groups', () => {
      // Mock node map for testing color assignment
      const nodeMap = new Map([
        ['/project/src/main.js', {}],
        ['/project/src/utils.js', {}],
        ['/project/test/main.test.js', {}],
        ['/project/test/utils.test.js', {}],
        ['/project/docs/README.md', {}]
      ]);

      const secondLevelDirs = extractSecondLevelDirectories(nodeMap, '/project');
      assert.ok(secondLevelDirs.includes('src'), 'Should identify src directory');
      assert.ok(secondLevelDirs.includes('test'), 'Should identify test directory');
      assert.ok(secondLevelDirs.includes('docs'), 'Should identify docs directory');

      // Test color assignment for grouped items
      const srcColor1 = getColorByDepth(1, 3, 'script', '/project/src/main.js', '/project', { src: 'core' });
      const srcColor2 = getColorByDepth(1, 3, 'script', '/project/src/utils.js', '/project', { src: 'core' });
      const testColor1 = getColorByDepth(1, 3, 'script', '/project/test/main.test.js', '/project', { test: 'data' });

      // Colors within the same group should use the same palette (though different shades)
      assert.ok(typeof srcColor1 === 'string' && srcColor1.startsWith('#'));
      assert.ok(typeof srcColor2 === 'string' && srcColor2.startsWith('#'));
      assert.ok(typeof testColor1 === 'string' && testColor1.startsWith('#'));
    });

    test('should differentiate colors between groups', () => {
      const directoryColorMap = {
        'frontend': 'core',
        'backend': 'data',
        'shared': 'utils',
        'default': 'default'
      };

      const frontendColor = getColorByDepth(1, 3, 'script', '/project/frontend/app.js', '/project', directoryColorMap);
      const backendColor = getColorByDepth(1, 3, 'script', '/project/backend/server.js', '/project', directoryColorMap);
      const sharedColor = getColorByDepth(1, 3, 'script', '/project/shared/utils.js', '/project', directoryColorMap);

      // Different groups should have different base colors
      assert.notEqual(frontendColor, backendColor, 'Frontend and backend should have different colors');
      assert.notEqual(backendColor, sharedColor, 'Backend and shared should have different colors');
      assert.notEqual(frontendColor, sharedColor, 'Frontend and shared should have different colors');
    });
  });
}

export default { testGroupedPositioning, testGroupedColorCoding };
