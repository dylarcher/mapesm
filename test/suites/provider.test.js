// write functions that act as a callback for node:test test(callback) methods
// specific to the provider service located in the source (src) services directory

import * as d3 from 'd3';
import assert from 'node:assert';
import { describe, test } from 'node:test';
import {
  createBaseSVG,
  positionNodes,
  renderLegend,
  renderNodeShape,
  renderNodes,
  renderShapeForLegend,
  renderStructuralLinks,
  serializeSVG
} from '../../src/services/provider.js';

/**
 * Tests for the provider service functions
 */
export function testCreateBaseSVG() {
  describe('createBaseSVG function', () => {
    test('should be a function', () => {
      assert.strictEqual(typeof createBaseSVG, 'function');
    });

    test('should create SVG with correct dimensions', () => {
      const { svg, dom } = createBaseSVG(800, 600);

      assert.ok(svg, 'Should return SVG selection');
      assert.ok(dom, 'Should return DOM instance');
      assert.strictEqual(svg.attr('width'), '800');
      assert.strictEqual(svg.attr('height'), '600');
      assert.strictEqual(svg.attr('viewBox'), '0 0 800 600');
    });

    test('should include style definitions', () => {
      const { svg } = createBaseSVG(400, 300);

      // Should have a defs element with styles
      const defs = svg.select('defs');
      assert.ok(!defs.empty(), 'Should have defs element');

      const style = defs.select('style');
      assert.ok(!style.empty(), 'Should have style element');

      const styleText = style.text();
      assert.ok(styleText.length > 0, 'Should have CSS styles');
      assert.ok(styleText.includes('.node'), 'Should include node styles');
    });
  });
}

export function testPositionNodes() {
  describe('positionNodes function', () => {
    test('should be a function', () => {
      assert.strictEqual(typeof positionNodes, 'function');
    });

    test('should position nodes and return bounds', () => {
      // Create a simple hierarchy
      const root = {
        name: 'root',
        children: [
          { name: 'child1', children: [] },
          { name: 'child2', children: [] }
        ]
      };
      const hierarchy = d3.hierarchy(root);

      const bounds = positionNodes(hierarchy, 2, 800);

      assert.ok(typeof bounds === 'object');
      assert.ok(typeof bounds.minX === 'number');
      assert.ok(typeof bounds.maxX === 'number');
      assert.ok(typeof bounds.minY === 'number');
      assert.ok(typeof bounds.maxY === 'number');

      // Check that nodes have been positioned
      hierarchy.each((d) => {
        assert.ok(typeof d.x === 'number', 'Node should have x position');
        assert.ok(typeof d.y === 'number', 'Node should have y position');
      });
    });

    test('should handle single node', () => {
      const root = { name: 'single', children: [] };
      const hierarchy = d3.hierarchy(root);

      const bounds = positionNodes(hierarchy, 1, 800);

      assert.ok(typeof bounds === 'object');
      assert.strictEqual(hierarchy.x, 0, 'Single node should be centered at x=0');
      assert.strictEqual(hierarchy.y, 0, 'Single node should be at y=0');
    });
  });
}

export function testRenderNodeShape() {
  describe('renderNodeShape function', () => {
    test('should be a function', () => {
      assert.strictEqual(typeof renderNodeShape, 'function');
    });

    test('should render different shapes for different file types', () => {
      const { svg } = createBaseSVG(100, 100);
      const g = svg.append('g');

      const fileTypes = [
        { fileType: 'directory', expectedShape: 'circle' },
        { fileType: 'script', expectedShape: 'path' },
        { fileType: 'style', expectedShape: 'rect' },
        { fileType: 'image', expectedShape: 'path' },
        { fileType: 'multimedia', expectedShape: 'path' },
        { fileType: 'default', expectedShape: 'path' }
      ];

      fileTypes.forEach(({ fileType, expectedShape }, i) => {
        const nodeGroup = g.append('g').attr('class', `test-${i}`);
        renderNodeShape(nodeGroup, { fileType }, '#ff0000');

        const shape = nodeGroup.select(expectedShape);
        assert.ok(!shape.empty(), `Should render ${expectedShape} for ${fileType}`);
        assert.strictEqual(shape.attr('fill'), '#ff0000', 'Should apply correct color');
      });
    });
  });
}

export function testSerializeSVG() {
  describe('serializeSVG function', () => {
    test('should be a function', () => {
      assert.strictEqual(typeof serializeSVG, 'function');
    });

    test('should serialize SVG to string', () => {
      const { svg } = createBaseSVG(100, 100);
      svg.append('circle').attr('r', 10).attr('fill', 'red');

      const serialized = serializeSVG(svg);

      assert.ok(typeof serialized === 'string');
      assert.ok(serialized.includes('<svg'), 'Should contain SVG element');
      assert.ok(serialized.includes('width="100"'), 'Should contain width attribute');
      assert.ok(serialized.includes('height="100"'), 'Should contain height attribute');
      assert.ok(serialized.includes('<circle'), 'Should contain circle element');
      assert.ok(serialized.includes('fill="red"'), 'Should contain fill attribute');
    });

    test('should handle empty SVG', () => {
      const { svg } = createBaseSVG(50, 50);

      const serialized = serializeSVG(svg);

      assert.ok(typeof serialized === 'string');
      assert.ok(serialized.includes('<svg'), 'Should contain SVG element');
      assert.ok(serialized.length > 0, 'Should not be empty');
    });
  });
}

export function testRenderLegend() {
  describe('renderLegend function', () => {
    test('should be a function', () => {
      assert.strictEqual(typeof renderLegend, 'function');
    });

    test('should render legend with directory colors and shapes', () => {
      const { svg } = createBaseSVG(800, 600);
      const secondLevelDirs = ['src', 'test', 'lib'];
      const directoryColorMap = { src: 'core', test: 'data', lib: 'utils', default: 'default' };

      renderLegend(svg, 800, 600, secondLevelDirs, directoryColorMap);

      // Should have legend group
      const legend = svg.select('.legend');
      assert.ok(!legend.empty(), 'Should have legend group');

      // Should have background
      const background = legend.select('.legend-background');
      assert.ok(!background.empty(), 'Should have legend background');

      // Should have title elements
      const titles = legend.selectAll('.legend-title');
      assert.ok(titles.size() >= 2, 'Should have at least 2 titles (directories and shapes)');

      // Should have legend items
      const items = legend.selectAll('.legend-item');
      assert.ok(items.size() > 0, 'Should have legend items');
    });
  });
}

export function testRenderShapeForLegend() {
  describe('renderShapeForLegend function', () => {
    test('should be a function', () => {
      assert.strictEqual(typeof renderShapeForLegend, 'function');
    });

    test('should render shapes for legend', () => {
      const { svg } = createBaseSVG(100, 100);
      const g = svg.append('g');

      const shapeTypes = ['directory', 'script', 'style', 'image', 'multimedia', 'default'];

      shapeTypes.forEach((shapeType, i) => {
        const shapeGroup = g.append('g').attr('class', `legend-${i}`);
        renderShapeForLegend(shapeGroup, shapeType, '#blue');

        // Should have added some shape element
        const hasShape = shapeGroup.selectAll('*').size() > 0;
        assert.ok(hasShape, `Should render shape for ${shapeType}`);
      });
    });
  });
}

export function testProviderIntegration() {
  describe('Provider service integration', () => {
    test('should create complete SVG visualization', () => {
      const width = 400;
      const height = 300;

      // Create base SVG
      const { svg } = createBaseSVG(width, height);

      // Create simple hierarchy
      const root = {
        name: 'project',
        children: [
          { name: 'src', children: [{ name: 'main.js', fileType: 'script' }] },
          { name: 'test', children: [{ name: 'test.js', fileType: 'script' }] }
        ]
      };
      const hierarchy = d3.hierarchy(root);

      // Position nodes
      const bounds = positionNodes(hierarchy, 2, 300);

      // Create main group with transform
      const g = svg.append('g')
        .attr('transform', `translate(${-bounds.minX}, ${-bounds.minY})`);

      // Render structural links
      renderStructuralLinks(g, hierarchy);

      // Render nodes (with mock color mapping)
      renderNodes(g, hierarchy, 2, '/root', { src: 'core', test: 'data' });

      // Add legend
      renderLegend(svg, width, height, ['src', 'test'], { src: 'core', test: 'data' });

      // Serialize
      const serialized = serializeSVG(svg);

      assert.ok(typeof serialized === 'string');
      assert.ok(serialized.length > 0);
      assert.ok(serialized.includes('<svg'), 'Should contain SVG');
      assert.ok(serialized.includes('main.js'), 'Should contain node labels');

      console.log(`Integration test: Generated SVG with ${serialized.length} characters`);
    });
  });
}

export default {
  testCreateBaseSVG,
  testPositionNodes,
  testRenderNodeShape,
  testSerializeSVG,
  testRenderLegend,
  testRenderShapeForLegend,
  testProviderIntegration
};
