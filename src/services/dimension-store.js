/**
 * @fileoverview Dimension Store with Proxy API for node positioning and overlap prevention.
 * Manages all node dimensions and automatically triggers positioning logic to prevent overlapping.
 * Categorizes nodes as contextual (text), presentational (lines/boxes/containers), and indicators (markers).
 */

import { SVG_CONFIG } from "../CONF.js";

/**
 * Node categories for overlap prevention rules
 */
export const NODE_CATEGORIES = {
  CONTEXTUAL: 'contextual',      // Text nodes
  PRESENTATIONAL: 'presentational', // Lines, borders, containers
  INDICATORS: 'indicators'       // Markers, shapes, icons
};

/**
 * Buffer distances for overlap prevention (in pixels)
 */
export const OVERLAP_BUFFERS = {
  TEXT_BUFFER: 18,              // 18px buffer around text nodes
  INDICATOR_SPACING: 24,        // Minimum spacing between indicators
  PRESENTATIONAL_MARGIN: 8      // Margin for presentational elements
};

/**
 * Node dimension and positioning store with Proxy-based reactive updates.
 * Automatically prevents overlapping based on node categories and buffer rules.
 */
export class DimensionStore {
  constructor() {
    // Core data storage
    this._nodes = new Map();
    this._positioningCallbacks = new Set();
    this._overlapsDetected = new Set();
    this._layoutBounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };

    // Create reactive proxy
    return new Proxy(this, {
      get(target, prop) {
        if (typeof target[prop] === 'function') {
          return target[prop].bind(target);
        }
        return target[prop];
      },
      set(target, prop, value) {
        const oldValue = target[prop];
        target[prop] = value;

        // Trigger positioning recalculation if dimension data changes
        if (prop === '_nodes' || prop.startsWith('node_')) {
          target._triggerPositioningUpdate(prop, oldValue, value);
        }

        return true;
      }
    });
  }

  /**
   * Sets node dimensions and properties
   * @param {string} nodeId - Unique node identifier
   * @param {Object} dimensions - Node dimension and category data
   */
  setNodeDimensions(nodeId, dimensions) {
    const existingNode = this._nodes.get(nodeId);
    const newNode = {
      id: nodeId,
      x: dimensions.x || 0,
      y: dimensions.y || 0,
      width: dimensions.width || SVG_CONFIG.nodeRadius * 2,
      height: dimensions.height || SVG_CONFIG.nodeRadius * 2,
      category: this._categorizeNode(dimensions),
      textContent: dimensions.textContent || '',
      shape: dimensions.shape || 'circle',
      buffer: this._calculateBuffer(dimensions),
      ...dimensions
    };

    this._nodes.set(nodeId, newNode);

    // Update layout bounds
    this._updateLayoutBounds(newNode);

    // Check for overlaps and trigger repositioning if needed
    this._checkOverlapsAndReposition(nodeId, existingNode, newNode);
  }

  /**
   * Gets node dimensions and properties
   * @param {string} nodeId - Node identifier
   * @returns {Object|null} Node data or null if not found
   */
  getNodeDimensions(nodeId) {
    return this._nodes.get(nodeId) || null;
  }

  /**
   * Gets all nodes in a specific category
   * @param {string} category - Node category
   * @returns {Array} Array of nodes in the category
   */
  getNodesByCategory(category) {
    return Array.from(this._nodes.values()).filter(node => node.category === category);
  }

  /**
   * Registers a callback for positioning updates
   * @param {Function} callback - Function to call when repositioning is needed
   */
  onPositioningUpdate(callback) {
    this._positioningCallbacks.add(callback);
  }

  /**
   * Removes a positioning callback
   * @param {Function} callback - Callback to remove
   */
  offPositioningUpdate(callback) {
    this._positioningCallbacks.delete(callback);
  }

  /**
   * Gets current layout bounds
   * @returns {Object} Layout bounds with minX, maxX, minY, maxY
   */
  getLayoutBounds() {
    return { ...this._layoutBounds };
  }

  /**
   * Gets all detected overlaps
   * @returns {Array} Array of overlap information objects
   */
  getOverlaps() {
    return Array.from(this._overlapsDetected);
  }

  /**
   * Manually triggers overlap detection and resolution
   */
  resolveOverlaps() {
    this._detectAndResolveAllOverlaps();
  }

  /**
   * Clears all nodes and resets the store
   */
  clear() {
    this._nodes.clear();
    this._overlapsDetected.clear();
    this._layoutBounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
  }

  /**
   * Categorizes a node based on its properties
   * @private
   */
  _categorizeNode(dimensions) {
    // Text nodes (labels, names, content)
    if (dimensions.textContent || dimensions.nodeType === 'text' || dimensions.isLabel) {
      return NODE_CATEGORIES.CONTEXTUAL;
    }

    // Shapes, icons, markers
    if (dimensions.shape && dimensions.shape !== 'line' && dimensions.shape !== 'rect') {
      return NODE_CATEGORIES.INDICATORS;
    }

    // Lines, borders, containers (default)
    return NODE_CATEGORIES.PRESENTATIONAL;
  }

  /**
   * Calculates appropriate buffer for a node based on category and content
   * @private
   */
  _calculateBuffer(dimensions) {
    const category = this._categorizeNode(dimensions);

    switch (category) {
        return Math.max(OVERLAP_BUFFERS.TEXT_BUFFER, textLength * TEXT_LENGTH_MULTIPLIER);

      case NODE_CATEGORIES.INDICATORS:
        return OVERLAP_BUFFERS.INDICATOR_SPACING;

      case NODE_CATEGORIES.PRESENTATIONAL:
      default:
        return OVERLAP_BUFFERS.PRESENTATIONAL_MARGIN;
    }
  }

  /**
   * Updates layout bounds when a node is added or moved
   * @private
   */
  _updateLayoutBounds(node) {
    const { x, y, width, height, buffer } = node;

    this._layoutBounds.minX = Math.min(this._layoutBounds.minX, x - width / 2 - buffer);
    this._layoutBounds.maxX = Math.max(this._layoutBounds.maxX, x + width / 2 + buffer);
    this._layoutBounds.minY = Math.min(this._layoutBounds.minY, y - height / 2 - buffer);
    this._layoutBounds.maxY = Math.max(this._layoutBounds.maxY, y + height / 2 + buffer);
  }

  /**
   * Checks for overlaps and triggers repositioning if necessary
   * @private
   */
  _checkOverlapsAndReposition(nodeId, oldNode, newNode) {
    const overlaps = this._detectOverlapsForNode(newNode);

    if (overlaps.length > 0) {
      // Store detected overlaps
      overlaps.forEach(overlap => this._overlapsDetected.add(overlap));

      // Try to resolve overlaps by repositioning
      const resolvedPosition = this._resolveNodeOverlaps(newNode, overlaps);

      if (resolvedPosition) {
        // Update node position
        newNode.x = resolvedPosition.x;
        newNode.y = resolvedPosition.y;
        this._nodes.set(nodeId, newNode);
        this._updateLayoutBounds(newNode);
      }

      // Trigger positioning callbacks
      this._triggerPositioningUpdate(nodeId, oldNode, newNode);
    }
  }

  /**
   * Detects overlaps for a specific node
   * @private
   */
  _detectOverlapsForNode(node) {
    const overlaps = [];

    for (const [otherId, otherNode] of this._nodes) {
      if (otherId === node.id) continue;

      const overlap = this._checkNodeOverlap(node, otherNode);
      if (overlap) {
        overlaps.push({
          nodeId: node.id,
          overlappingId: otherId,
          type: overlap.type,
          distance: overlap.distance,
          severity: overlap.severity
        });
      }
    }

    return overlaps;
  }

  /**
   * Checks if two nodes overlap based on category rules
   * @private
   */
  _checkNodeOverlap(node1, node2) {
    const distance = Math.sqrt(
      Math.pow(node1.x - node2.x, 2) + Math.pow(node1.y - node2.y, 2)
    );

    // Apply category-specific overlap rules
    let minDistance = 0;
    let overlapType = 'none';

    if (node1.category === NODE_CATEGORIES.CONTEXTUAL || node2.category === NODE_CATEGORIES.CONTEXTUAL) {
      // Text nodes cannot overlap other text nodes or their 18px buffer
      if (node1.category === NODE_CATEGORIES.CONTEXTUAL && node2.category === NODE_CATEGORIES.CONTEXTUAL) {
        minDistance = Math.max(node1.buffer, node2.buffer);
        overlapType = 'text-text';
      }
      // Indicators cannot overlap text nodes' 18px buffer
      else if (
        (node1.category === NODE_CATEGORIES.CONTEXTUAL && node2.category === NODE_CATEGORIES.INDICATORS) ||
        (node1.category === NODE_CATEGORIES.INDICATORS && node2.category === NODE_CATEGORIES.CONTEXTUAL)
      ) {
        minDistance = OVERLAP_BUFFERS.TEXT_BUFFER + OVERLAP_BUFFERS.INDICATOR_SPACING;
        overlapType = 'text-indicator';
      }
      // Presentational elements can overlap with text (allowed)
      else if (
        (node1.category === NODE_CATEGORIES.CONTEXTUAL && node2.category === NODE_CATEGORIES.PRESENTATIONAL) ||
        (node1.category === NODE_CATEGORIES.PRESENTATIONAL && node2.category === NODE_CATEGORIES.CONTEXTUAL)
      ) {
        return null; // Overlap allowed
      }
    }

    // Presentational and indicators can overlap each other (allowed)
    if (
      (node1.category === NODE_CATEGORIES.PRESENTATIONAL && node2.category === NODE_CATEGORIES.INDICATORS) ||
      (node1.category === NODE_CATEGORIES.INDICATORS && node2.category === NODE_CATEGORIES.PRESENTATIONAL) ||
      (node1.category === NODE_CATEGORIES.PRESENTATIONAL && node2.category === NODE_CATEGORIES.PRESENTATIONAL)
    ) {
      return null; // Overlap allowed
    }

    if (distance < minDistance) {
      return {
        type: overlapType,
        distance,
        severity: (minDistance - distance) / minDistance,
        requiredDistance: minDistance
      };
    }

    return null;
  }

  /**
   * Resolves overlaps by finding a new position for a node
   * @private
   */
  _resolveNodeOverlaps(node, overlaps) {
    const attempts = 20;
    const maxDistance = 100;

    for (let attempt = 0; attempt < attempts; attempt++) {
      // Try increasingly larger radius searches
      const radius = (attempt + 1) * (maxDistance / attempts);
      const angle = (Math.PI * 2 * attempt) / attempts;

      const candidateX = node.x + Math.cos(angle) * radius;
      const candidateY = node.y + Math.sin(angle) * radius;

      const candidateNode = { ...node, x: candidateX, y: candidateY };
      const candidateOverlaps = this._detectOverlapsForNode(candidateNode);

      if (candidateOverlaps.length === 0) {
        return { x: candidateX, y: candidateY };
      }
    }

    // If no good position found, return original position
    return null;
  }

  /**
   * Detects and resolves all overlaps in the current node set
   * @private
   */
  _detectAndResolveAllOverlaps() {
    const nodes = Array.from(this._nodes.values());
    const resolvedNodes = new Map();

    for (const node of nodes) {
      const overlaps = this._detectOverlapsForNode(node);

      if (overlaps.length > 0) {
        const resolvedPosition = this._resolveNodeOverlaps(node, overlaps);
        if (resolvedPosition) {
          resolvedNodes.set(node.id, {
            ...node,
            x: resolvedPosition.x,
            y: resolvedPosition.y
          });
        }
      }
    }

    // Apply resolved positions
    for (const [nodeId, resolvedNode] of resolvedNodes) {
      this._nodes.set(nodeId, resolvedNode);
      this._updateLayoutBounds(resolvedNode);
    }
  }

  /**
   * Triggers all registered positioning callbacks
   * @private
   */
  _triggerPositioningUpdate(prop, oldValue, newValue) {
    for (const callback of this._positioningCallbacks) {
      try {
        callback({ prop, oldValue, newValue, store: this });
      } catch (error) {
        console.warn('Positioning callback error:', error);
      }
    }
  }

  /**
   * Gets statistics about the current node distribution
   */
  getStatistics() {
    const nodes = Array.from(this._nodes.values());
    const categoryStats = {};

    // Count nodes by category
    for (const category of Object.values(NODE_CATEGORIES)) {
      categoryStats[category] = nodes.filter(n => n.category === category).length;
    }

    return {
      totalNodes: nodes.length,
      categories: categoryStats,
      overlaps: this._overlapsDetected.size,
      bounds: this._layoutBounds,
      density: this._calculateDensity()
    };
  }

  /**
   * Calculates node density within the layout bounds
   * @private
   */
  _calculateDensity() {
    const bounds = this._layoutBounds;
    const area = (bounds.maxX - bounds.minX) * (bounds.maxY - bounds.minY);
    return area > 0 ? this._nodes.size / area : 0;
  }
}

/**
 * Global dimension store instance
 */
export const dimensionStore = new DimensionStore();

/**
 * Helper function to create a new dimension store instance
 */
export function createDimensionStore() {
  return new DimensionStore();
}
