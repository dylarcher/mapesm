// write functions that act as a callback for node:test test(callback) methods
// specific to the preset configurations located in the source (src) directory

import assert from 'node:assert';
import { describe, test } from 'node:test';
import {
  COLOR_PALETTE,
  DEFAULT_CLI_OPTIONS,
  DEFAULT_IGNORE,
  FILE_TYPE_MAPPINGS,
  MESSAGES,
  RELEVANT_EXTENSIONS,
  SHAPE_LEGEND,
  SVG_CONFIG,
  SVG_SHAPES,
  generateDirectoryColorMap
} from '../../src/CONF.js';

/**
 * Tests for configuration constants and functions
 */
export function testConstants() {
  describe('Configuration Constants', () => {
    test('RELEVANT_EXTENSIONS should contain JavaScript/TypeScript extensions', () => {
      assert.ok(RELEVANT_EXTENSIONS instanceof Set);
      assert.ok(RELEVANT_EXTENSIONS.has('.js'));
      assert.ok(RELEVANT_EXTENSIONS.has('.ts'));
      assert.ok(RELEVANT_EXTENSIONS.has('.jsx'));
      assert.ok(RELEVANT_EXTENSIONS.has('.tsx'));
      assert.ok(RELEVANT_EXTENSIONS.size > 0);
    });

    test('DEFAULT_IGNORE should contain common ignore patterns', () => {
      assert.ok(DEFAULT_IGNORE instanceof Set);
      assert.ok(DEFAULT_IGNORE.has('node_modules'));
      assert.ok(DEFAULT_IGNORE.has('.git'));
      assert.ok(DEFAULT_IGNORE.has('dist'));
      assert.ok(DEFAULT_IGNORE.has('build'));
    });

    test('COLOR_PALETTE should have valid color arrays', () => {
      assert.ok(typeof COLOR_PALETTE === 'object');
      assert.ok(COLOR_PALETTE.default);
      assert.ok(Array.isArray(COLOR_PALETTE.default));
      assert.ok(COLOR_PALETTE.default.length > 0);

      // Check that colors are valid hex codes
      COLOR_PALETTE.default.forEach(color => {
        assert.ok(typeof color === 'string');
        assert.ok(/^#[0-9a-f]{6}$/i.test(color), `Invalid hex color: ${color}`);
      });
    });

    test('FILE_TYPE_MAPPINGS should map extensions correctly', () => {
      assert.ok(typeof FILE_TYPE_MAPPINGS === 'object');
      assert.ok(Array.isArray(FILE_TYPE_MAPPINGS.script));
      assert.ok(FILE_TYPE_MAPPINGS.script.includes('.js'));
      assert.ok(FILE_TYPE_MAPPINGS.script.includes('.ts'));
    });
  });
}

export function testSVGConfig() {
  describe('SVG Configuration', () => {
    test('SVG_CONFIG should have required properties', () => {
      assert.ok(typeof SVG_CONFIG === 'object');
      assert.ok(typeof SVG_CONFIG.aspectRatio === 'number');
      assert.ok(typeof SVG_CONFIG.margin === 'object');
      assert.ok(typeof SVG_CONFIG.defaultWidth === 'number');
      assert.ok(typeof SVG_CONFIG.nodeRadius === 'number');
      assert.ok(SVG_CONFIG.aspectRatio > 0);
      assert.ok(SVG_CONFIG.defaultWidth > 0);
    });

    test('SVG_SHAPES should contain shape definitions', () => {
      assert.ok(typeof SVG_SHAPES === 'object');
      assert.ok(typeof SVG_SHAPES.diamond === 'string');
      assert.ok(typeof SVG_SHAPES.star === 'string');
      assert.ok(SVG_SHAPES.diamond.length > 0);
    });

    test('SHAPE_LEGEND should map file types to descriptions', () => {
      assert.ok(typeof SHAPE_LEGEND === 'object');
      assert.ok(SHAPE_LEGEND.directory);
      assert.ok(SHAPE_LEGEND.script);
      assert.ok(typeof SHAPE_LEGEND.directory.name === 'string');
      assert.ok(typeof SHAPE_LEGEND.directory.description === 'string');
    });
  });
}

export function testGenerateDirectoryColorMap() {
  describe('generateDirectoryColorMap function', () => {
    test('should be a function', () => {
      assert.strictEqual(typeof generateDirectoryColorMap, 'function');
    });

    test('should map directory names to color palettes', () => {
      const directories = ['src', 'test', 'lib'];
      const colorMap = generateDirectoryColorMap(directories);

      assert.ok(typeof colorMap === 'object');
      assert.ok(colorMap.src);
      assert.ok(colorMap.test);
      assert.ok(colorMap.lib);
      assert.strictEqual(colorMap.default, 'default');
    });

    test('should handle empty directory list', () => {
      const colorMap = generateDirectoryColorMap([]);
      assert.ok(typeof colorMap === 'object');
      assert.strictEqual(colorMap.default, 'default');
    });

    test('should cycle through color palettes for many directories', () => {
      const manyDirectories = Array.from({ length: 20 }, (_, i) => `dir${i}`);
      const colorMap = generateDirectoryColorMap(manyDirectories);

      assert.ok(typeof colorMap === 'object');
      assert.ok(colorMap.dir0);
      assert.ok(colorMap.dir19);
      assert.strictEqual(colorMap.default, 'default');
    });
  });
}

export function testMessages() {
  test('MESSAGES should contain all required message templates', () => {
    assert.ok(typeof MESSAGES === 'object');
    assert.ok(typeof MESSAGES.INITIALIZING === 'string');
    assert.ok(typeof MESSAGES.SUCCESS === 'string');
    assert.ok(typeof MESSAGES.ERROR === 'string');
    assert.ok(MESSAGES.INITIALIZING.length > 0);
    assert.ok(MESSAGES.SUCCESS.length > 0);
  });
}

export function testDefaultOptions() {
  test('DEFAULT_CLI_OPTIONS should have valid defaults', () => {
    assert.ok(typeof DEFAULT_CLI_OPTIONS === 'object');
    assert.ok(typeof DEFAULT_CLI_OPTIONS.output === 'string');
    assert.ok(typeof DEFAULT_CLI_OPTIONS.depth === 'number');
    assert.ok(typeof DEFAULT_CLI_OPTIONS.hidden === 'boolean');
    assert.ok(DEFAULT_CLI_OPTIONS.output.includes('.svg'));
    assert.ok(DEFAULT_CLI_OPTIONS.depth >= 0);
  });
}

export default {
  testConstants,
  testSVGConfig,
  testGenerateDirectoryColorMap,
  testMessages,
  testDefaultOptions
};
