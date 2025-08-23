/**
 * @fileoverview Tests for the dimension store system with Proxy API and overlap prevention.
 * Validates node categorization, overlap detection, and positioning logic.
 */

import assert from 'node:assert';
import { test } from 'node:test';
import { NODE_CATEGORIES, OVERLAP_BUFFERS, createDimensionStore } from '../../src/services/dimension-store.js';

/**
 * Test dimension store basic functionality
 */
export function testDimensionStoreBasics() {
  test('DimensionStore - Basic node operations', () => {
    const store = createDimensionStore();

    // Test setting node dimensions
    store.setNodeDimensions('node1', {
      x: 100, y: 100, width: 20, height: 20,
      textContent: 'Test Node', shape: 'circle'
    });

    const node = store.getNodeDimensions('node1');
    assert.ok(node, 'Node should exist');
    assert.strictEqual(node.x, 100, 'X coordinate should be set');
    assert.strictEqual(node.y, 100, 'Y coordinate should be set');
    assert.strictEqual(node.category, NODE_CATEGORIES.CONTEXTUAL, 'Should be categorized as contextual due to text content');
  });

  test('DimensionStore - Node categorization', () => {
    const store = createDimensionStore();

    // Test contextual node (text)
    store.setNodeDimensions('text-node', {
      x: 0, y: 0, textContent: 'Label', isLabel: true
    });
    const textNode = store.getNodeDimensions('text-node');
    assert.strictEqual(textNode.category, NODE_CATEGORIES.CONTEXTUAL);

    // Test indicator node (shape/icon)
    store.setNodeDimensions('shape-node', {
      x: 0, y: 0, shape: 'diamond'
    });
    const shapeNode = store.getNodeDimensions('shape-node');
    assert.strictEqual(shapeNode.category, NODE_CATEGORIES.INDICATORS);

    // Test presentational node (line/container)
    store.setNodeDimensions('line-node', {
      x: 0, y: 0, shape: 'line'
    });
    const lineNode = store.getNodeDimensions('line-node');
    assert.strictEqual(lineNode.category, NODE_CATEGORIES.PRESENTATIONAL);
  });

  test('DimensionStore - Category filtering', () => {
    const store = createDimensionStore();

    store.setNodeDimensions('text1', { x: 0, y: 0, textContent: 'Text 1' });
    store.setNodeDimensions('text2', { x: 50, y: 0, textContent: 'Text 2' });
    store.setNodeDimensions('shape1', { x: 100, y: 0, shape: 'circle' });

    const textNodes = store.getNodesByCategory(NODE_CATEGORIES.CONTEXTUAL);
    const shapeNodes = store.getNodesByCategory(NODE_CATEGORIES.INDICATORS);

    assert.strictEqual(textNodes.length, 2, 'Should find 2 text nodes');
    assert.strictEqual(shapeNodes.length, 1, 'Should find 1 shape node');
  });
}

/**
 * Test overlap detection and prevention
 */
export function testOverlapDetection() {
  test('DimensionStore - Text-Text overlap detection', () => {
    const store = createDimensionStore();

    // Add two text nodes that overlap
    store.setNodeDimensions('text1', {
      x: 100, y: 100, width: 40, height: 20, textContent: 'Node 1'
    });
    store.setNodeDimensions('text2', {
      x: 105, y: 105, width: 40, height: 20, textContent: 'Node 2'
    });

    const overlaps = store.getOverlaps();
    assert.ok(overlaps.length > 0, 'Should detect overlaps between text nodes');

    const textTextOverlap = Array.from(overlaps).find(o => o.type === 'text-text');
    assert.ok(textTextOverlap, 'Should detect text-text overlap');
  });

  test('DimensionStore - Text-Indicator buffer enforcement', () => {
    const store = createDimensionStore();

    // Add text node and indicator that violate buffer rule
    store.setNodeDimensions('text', {
      x: 100, y: 100, textContent: 'Text Node'
    });
    store.setNodeDimensions('indicator', {
      x: 110, y: 100, shape: 'diamond'  // Too close to text
    });

    const overlaps = store.getOverlaps();
    const textIndicatorOverlap = Array.from(overlaps).find(o => o.type === 'text-indicator');
    assert.ok(textIndicatorOverlap, 'Should detect text-indicator buffer violation');
  });

  test('DimensionStore - Allowed overlaps', () => {
    const store = createDimensionStore();

    // Add presentational and text nodes (should be allowed to overlap)
    store.setNodeDimensions('text', {
      x: 100, y: 100, textContent: 'Text Node'
    });
    store.setNodeDimensions('line', {
      x: 100, y: 100, shape: 'line'  // Presentational - should be allowed to overlap with text
    });

    // Since overlap resolution happens automatically, check if positions were adjusted
    const text = store.getNodeDimensions('text');
    const line = store.getNodeDimensions('line');

    // For allowed overlaps, positions shouldn't be changed drastically
    assert.ok(Math.abs(text.x - 100) < 50, 'Text position should not be moved drastically for allowed overlaps');
  });
}

/**
 * Test positioning callbacks and reactive updates
 */
export function testPositioningCallbacks() {
  test('DimensionStore - Positioning callbacks', (t, done) => {
    const store = createDimensionStore();
    let callbackTriggered = false;

    // Register callback
    const callback = (updateInfo) => {
      callbackTriggered = true;
      assert.ok(updateInfo.store, 'Callback should receive store reference');
      done();
    };

    store.onPositioningUpdate(callback);

    // Add overlapping nodes to trigger callback
    store.setNodeDimensions('node1', { x: 100, y: 100, textContent: 'Node 1' });
    store.setNodeDimensions('node2', { x: 105, y: 105, textContent: 'Node 2' });

    // Give callback time to execute
    setTimeout(() => {
      if (!callbackTriggered) {
        done(new Error('Positioning callback was not triggered'));
      }
    }, 100);
  });

  test('DimensionStore - Callback removal', () => {
    const store = createDimensionStore();
    let callbackCount = 0;

    const callback = () => { callbackCount++; };

    store.onPositioningUpdate(callback);
    store.setNodeDimensions('node1', { x: 100, y: 100, textContent: 'Node 1' });

    const initialCount = callbackCount;

    store.offPositioningUpdate(callback);
    store.setNodeDimensions('node2', { x: 100, y: 100, textContent: 'Node 2' });

    assert.strictEqual(callbackCount, initialCount, 'Callback should not be triggered after removal');
  });
}

/**
 * Test layout bounds and statistics
 */
export function testLayoutBounds() {
  test('DimensionStore - Layout bounds calculation', () => {
    const store = createDimensionStore();

    store.setNodeDimensions('node1', { x: 50, y: 50, width: 20, height: 20, textContent: 'Node 1' });
    store.setNodeDimensions('node2', { x: 150, y: 150, width: 30, height: 30, shape: 'circle' });

    const bounds = store.getLayoutBounds();

    assert.ok(bounds.minX <= 50, 'MinX should account for leftmost node and buffer');
    assert.ok(bounds.maxX >= 150, 'MaxX should account for rightmost node and buffer');
    assert.ok(bounds.minY <= 50, 'MinY should account for topmost node and buffer');
    assert.ok(bounds.maxY >= 150, 'MaxY should account for bottommost node and buffer');
  });

  test('DimensionStore - Statistics generation', () => {
    const store = createDimensionStore();

    store.setNodeDimensions('text1', { x: 0, y: 0, textContent: 'Text 1' });
    store.setNodeDimensions('text2', { x: 0, y: 0, textContent: 'Text 2' });
    store.setNodeDimensions('shape1', { x: 0, y: 0, shape: 'diamond' });
    store.setNodeDimensions('line1', { x: 0, y: 0, shape: 'line' });

    const stats = store.getStatistics();

    assert.strictEqual(stats.totalNodes, 4, 'Should count all nodes');
    assert.strictEqual(stats.categories[NODE_CATEGORIES.CONTEXTUAL], 2, 'Should count contextual nodes');
    assert.strictEqual(stats.categories[NODE_CATEGORIES.INDICATORS], 1, 'Should count indicator nodes');
    assert.strictEqual(stats.categories[NODE_CATEGORIES.PRESENTATIONAL], 1, 'Should count presentational nodes');
    assert.ok(typeof stats.density === 'number', 'Should calculate density');
  });
}

/**
 * Test store clearing and reset
 */
export function testStoreClear() {
  test('DimensionStore - Store clearing', () => {
    const store = createDimensionStore();

    store.setNodeDimensions('node1', { x: 100, y: 100, textContent: 'Node 1' });
    store.setNodeDimensions('node2', { x: 200, y: 200, shape: 'circle' });

    assert.strictEqual(store.getStatistics().totalNodes, 2, 'Should have 2 nodes before clearing');

    store.clear();

    assert.strictEqual(store.getStatistics().totalNodes, 0, 'Should have 0 nodes after clearing');
    assert.strictEqual(store.getOverlaps().length, 0, 'Should have no overlaps after clearing');

    const bounds = store.getLayoutBounds();
    assert.strictEqual(bounds.minX, Infinity, 'Bounds should be reset');
  });
}

/**
 * Test overlap resolution algorithms
 */
export function testOverlapResolution() {
  test('DimensionStore - Automatic overlap resolution', () => {
    const store = createDimensionStore();

    // Add nodes that will overlap initially
    store.setNodeDimensions('text1', {
      x: 100, y: 100, width: 60, height: 20, textContent: 'Long Text Node 1'
    });

    const initialPosition = { x: 100, y: 100 };
    store.setNodeDimensions('text2', {
      x: 100, y: 100, width: 60, height: 20, textContent: 'Long Text Node 2'
    });

    // The second node should be repositioned to avoid overlap
    const text2 = store.getNodeDimensions('text2');
    const distance = Math.sqrt(Math.pow(text2.x - initialPosition.x, 2) + Math.pow(text2.y - initialPosition.y, 2));

    assert.ok(distance > OVERLAP_BUFFERS.TEXT_BUFFER, 'Second node should be moved to avoid overlap');
  });

  test('DimensionStore - Manual overlap resolution', () => {
    const store = createDimensionStore();

    // Disable automatic resolution by adding nodes in a way that creates overlaps
    store.setNodeDimensions('node1', { x: 100, y: 100, textContent: 'Node 1' });

    // Force an overlap by directly setting position
    const node2Data = { x: 102, y: 102, textContent: 'Node 2' };
    store._nodes.set('node2', {
      id: 'node2',
      category: NODE_CATEGORIES.CONTEXTUAL,
      buffer: OVERLAP_BUFFERS.TEXT_BUFFER,
      ...node2Data
    });

    // Manually resolve overlaps
    store.resolveOverlaps();

    const node2 = store.getNodeDimensions('node2');
    const distance = Math.sqrt(Math.pow(node2.x - 100, 2) + Math.pow(node2.y - 100, 2));

    assert.ok(distance >= OVERLAP_BUFFERS.TEXT_BUFFER, 'Manual resolution should separate overlapping nodes');
  });
}
