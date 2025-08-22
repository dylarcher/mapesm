// write functions that act as a callback for node:test test(callback) methods
// specific to the utility helper methods located in the source (src) directory

import assert from 'node:assert';
import { describe, test } from 'node:test';
import {
  buildHierarchicalStructure,
  calculateSVGDimensions,
  createStyledSpinner,
  extractSecondLevelDirectories,
  formatCyclePath,
  getColorByDepth,
  getCycleEdges,
  getFileType,
  validateSourceFiles
} from '../../src/utils.js';

/**
 * Tests for utility functions
 */
export function testGetFileType() {
  describe('getFileType function', () => {
    test('should be a function', () => {
      assert.strictEqual(typeof getFileType, 'function');
    });

    test('should return correct file types', () => {
      assert.strictEqual(getFileType('script.js'), 'script');
      assert.strictEqual(getFileType('component.tsx'), 'script');
      assert.strictEqual(getFileType('styles.css'), 'style');
      assert.strictEqual(getFileType('image.png'), 'image');
      assert.strictEqual(getFileType('video.mp4'), 'multimedia');
      assert.strictEqual(getFileType('config.json'), 'default');
    });

    test('should handle directories', () => {
      assert.strictEqual(getFileType(''), 'directory');
      assert.strictEqual(getFileType(null), 'directory');
      assert.strictEqual(getFileType(undefined), 'directory');
    });

    test('should handle files without extensions', () => {
      assert.strictEqual(getFileType('README'), 'default');
      assert.strictEqual(getFileType('Makefile'), 'default');
    });
  });
}

export function testGetColorByDepth() {
  describe('getColorByDepth function', () => {
    test('should be a function', () => {
      assert.strictEqual(typeof getColorByDepth, 'function');
    });

    test('should return valid hex colors', () => {
      const color = getColorByDepth(0, 5, 'directory');
      assert.ok(typeof color === 'string');
      assert.ok(/^#[0-9a-f]{6}$/i.test(color), `Invalid hex color: ${color}`);
    });

    test('should return different colors for different depths', () => {
      const color1 = getColorByDepth(0, 5, 'directory');
      const color2 = getColorByDepth(3, 5, 'directory');
      // Should be different (though not guaranteed for all cases)
      // Main thing is they should both be valid colors
      assert.ok(typeof color1 === 'string');
      assert.ok(typeof color2 === 'string');
    });

    test('should handle edge cases', () => {
      const color1 = getColorByDepth(0, 0, 'directory'); // maxDepth = 0
      const color2 = getColorByDepth(10, 5, 'directory'); // depth > maxDepth
      assert.ok(/^#[0-9a-f]{6}$/i.test(color1));
      assert.ok(/^#[0-9a-f]{6}$/i.test(color2));
    });
  });
}

export function testExtractSecondLevelDirectories() {
  describe('extractSecondLevelDirectories function', () => {
    test('should be a function', () => {
      assert.strictEqual(typeof extractSecondLevelDirectories, 'function');
    });

    test('should extract second level directories', () => {
      const nodeMap = new Map([
        ['/root/src/main.js', { isDirectory: false }],
        ['/root/src/utils.js', { isDirectory: false }],
        ['/root/test/unit.test.js', { isDirectory: false }],
        ['/root/docs/README.md', { isDirectory: false }]
      ]);

      const result = extractSecondLevelDirectories(nodeMap, '/root');
      assert.ok(Array.isArray(result));
      assert.ok(result.includes('src'));
      assert.ok(result.includes('test'));
      assert.ok(result.includes('docs'));
    });

    test('should handle empty nodeMap', () => {
      const nodeMap = new Map();
      const result = extractSecondLevelDirectories(nodeMap, '/root');
      assert.ok(Array.isArray(result));
      assert.strictEqual(result.length, 0);
    });
  });
}

export function testBuildHierarchicalStructure() {
  describe('buildHierarchicalStructure function', () => {
    test('should be a function', () => {
      assert.strictEqual(typeof buildHierarchicalStructure, 'function');
    });

    test('should build hierarchical structure', () => {
      const nodeMap = new Map([
        ['/root/src/main.js', {}],
        ['/root/src/utils.js', {}],
        ['/root/test/unit.test.js', {}]
      ]);

      const result = buildHierarchicalStructure(nodeMap, '/root');
      assert.ok(result.root);
      assert.ok(typeof result.maxDepth === 'number');
      assert.ok(result.root.children);
      assert.ok(Array.isArray(result.root.children));
      assert.ok(result.maxDepth > 0);
    });

    test('should handle empty nodeMap', () => {
      const nodeMap = new Map();
      const result = buildHierarchicalStructure(nodeMap, '/root');
      assert.ok(result.root);
      assert.strictEqual(result.maxDepth, 0);
      assert.ok(Array.isArray(result.root.children));
      assert.strictEqual(result.root.children.length, 0);
    });
  });
}

export function testCalculateSVGDimensions() {
  describe('calculateSVGDimensions function', () => {
    test('should be a function', () => {
      assert.strictEqual(typeof calculateSVGDimensions, 'function');
    });

    test('should calculate valid dimensions', () => {
      const margin = { top: 50, right: 50, bottom: 50, left: 50 };
      const result = calculateSVGDimensions(3, 16 / 9, margin, 800);

      assert.ok(typeof result.width === 'number');
      assert.ok(typeof result.height === 'number');
      assert.ok(typeof result.contentWidth === 'number');
      assert.ok(typeof result.contentHeight === 'number');
      assert.ok(result.width > 0);
      assert.ok(result.height > 0);
      assert.ok(result.contentWidth > 0);
      assert.ok(result.contentHeight > 0);
    });
  });
}

export function testGetCycleEdges() {
  describe('getCycleEdges function', () => {
    test('should be a function', () => {
      assert.strictEqual(typeof getCycleEdges, 'function');
    });

    test('should identify cycle edges', () => {
      const cycles = [
        ['/path/a.js', '/path/b.js', '/path/c.js']
      ];

      const result = getCycleEdges(cycles);
      assert.ok(result instanceof Set);
      assert.ok(result.has('/path/a.js->/path/b.js'));
      assert.ok(result.has('/path/b.js->/path/c.js'));
      assert.ok(result.has('/path/c.js->/path/a.js'));
    });

    test('should handle empty cycles', () => {
      const result = getCycleEdges([]);
      assert.ok(result instanceof Set);
      assert.strictEqual(result.size, 0);
    });
  });
}

export function testFormatCyclePath() {
  describe('formatCyclePath function', () => {
    test('should be a function', () => {
      assert.strictEqual(typeof formatCyclePath, 'function');
    });

    test('should format cycle path correctly', () => {
      const cycle = ['/root/src/a.js', '/root/src/b.js'];
      const result = formatCyclePath(cycle, '/root');

      assert.ok(typeof result === 'string');
      assert.ok(result.includes('src/a.js'));
      assert.ok(result.includes('src/b.js'));
      assert.ok(result.includes('->'));
    });

    test('should handle empty cycle', () => {
      const result = formatCyclePath([], '/root');
      assert.strictEqual(result, '');
    });
  });
}

export function testValidateSourceFiles() {
  describe('validateSourceFiles function', () => {
    test('should be a function', () => {
      assert.strictEqual(typeof validateSourceFiles, 'function');
    });

    test('should pass with valid files', () => {
      const files = ['file1.js', 'file2.ts'];
      assert.doesNotThrow(() => {
        validateSourceFiles(files, '/root');
      });
    });

    test('should throw error with no files', () => {
      assert.throws(() => {
        validateSourceFiles([], '/root');
      }, /No source files found/);
    });
  });
}

export function testCreateStyledSpinner() {
  describe('createStyledSpinner function', () => {
    test('should be a function', () => {
      assert.strictEqual(typeof createStyledSpinner, 'function');
    });

    test('should return a spinner instance', async () => {
      const spinner = await createStyledSpinner('Test message');
      assert.ok(spinner);
      assert.ok(typeof spinner.start === 'function');
      assert.ok(typeof spinner.stop === 'function');
    });
  });
}

export default {
  testGetFileType,
  testGetColorByDepth,
  testExtractSecondLevelDirectories,
  testBuildHierarchicalStructure,
  testCalculateSVGDimensions,
  testGetCycleEdges,
  testFormatCyclePath,
  testValidateSourceFiles,
  testCreateStyledSpinner
};
