// write describe/test calls that run the imported test functions from throughout the test directory
// consolodates and organizes unit test suites for easier execution and reporting

import { describe } from 'node:test';

// Import all test suites
import { testCliCommand, testCliEntry, testCliIntegration } from './suites/cli.test.js';
import { testConstants, testDefaultOptions, testGenerateDirectoryColorMap, testMessages, testSVGConfig } from './suites/conf.test.js';
import {
  testConsumerIntegration,
  testDetectCircularDependencies,
  testFindSourceFiles,
  testParseFilesAndBuildGraph
} from './suites/consumer.test.js';
import {
  testDimensionStoreBasics,
  testLayoutBounds,
  testOverlapDetection,
  testOverlapResolution,
  testPositioningCallbacks,
  testStoreClear
} from './suites/dimension-store.test.js';
import { testAnalyzeAndVisualize, testMainModuleExports } from './suites/main.test.js';
import {
  testCreateBaseSVG,
  testPositionNodes,
  testProviderIntegration,
  testRenderLegend,
  testRenderNodeShape,
  testRenderShapeForLegend,
  testSerializeSVG
} from './suites/provider.test.js';
import {
  testBuildHierarchicalStructure,
  testCalculateSVGDimensions,
  testCreateStyledSpinner,
  testExtractSecondLevelDirectories,
  testFormatCyclePath,
  testGetColorByDepth,
  testGetCycleEdges,
  testGetFileType,
  testValidateSourceFiles
} from './suites/utils.test.js';
import { testGenerateSVG, testVisualizerIntegration } from './suites/visualizer.test.js';

// Import style tests
import { testAutomaticPositioning, testAutomaticSpacing } from './styles/auto.js';
import { testCircularLevelDistribution, testCircularPositioning } from './styles/circular.js';
import { testDiagonalMeasurements, testDiagonalPositioning } from './styles/diagonal.js';
import { testGroupedColorCoding, testGroupedPositioning } from './styles/grouped.js';
import { testHorizontalAlignment, testHorizontalScaling } from './styles/horizontal.js';
import { testLinearMeasurements, testLinearPositioning } from './styles/linear.js';
import { testVerticalAlignment, testVerticalScaling } from './styles/vertical.js';

// Import model tests
import {
  testArchitecturalPatterns,
  testComplexProjectStructures,
  testSpecializedProjectTypes
} from './models/architecture.test.js';
import { testCircularDependencyModel, testCircularVisualization } from './models/circular-deps.test.js';
import { testSmallProjectProcessing, testSmallProjectStructure } from './models/small-project.test.js';

/**
 * Main Test Suite - Core Functionality
 */
describe('Core Functionality Tests', () => {
  // Main module tests
  describe('Main Module', () => {
    testMainModuleExports();
    testAnalyzeAndVisualize();
  });

  // Configuration tests
  describe('Configuration Module', () => {
    testConstants();
    testSVGConfig();
    testMessages();
    testDefaultOptions();
    testGenerateDirectoryColorMap();
  });

  // Utility tests
  describe('Utility Functions', () => {
    testGetFileType();
    testGetColorByDepth();
    testExtractSecondLevelDirectories();
    testBuildHierarchicalStructure();
    testCalculateSVGDimensions();
    testGetCycleEdges();
    testFormatCyclePath();
    testValidateSourceFiles();
    testCreateStyledSpinner();
  });
});

/**
 * Service Layer Tests
 */
describe('Service Layer Tests', () => {
  // Consumer service tests
  describe('Consumer Service', () => {
    testFindSourceFiles();
    testParseFilesAndBuildGraph();
    testDetectCircularDependencies();
    testConsumerIntegration();
  });

  // Provider service tests
  describe('Provider Service', () => {
    testCreateBaseSVG();
    testPositionNodes();
    testRenderNodeShape();
    testSerializeSVG();
    testRenderLegend();
    testRenderShapeForLegend();
    testProviderIntegration();
  });

  // Visualizer service tests
  describe('Visualizer Service', () => {
    testGenerateSVG();
    testVisualizerIntegration();
  });

  // Dimension Store tests
  describe('Dimension Store Service', () => {
    testDimensionStoreBasics();
    testOverlapDetection();
    testPositioningCallbacks();
    testLayoutBounds();
    testStoreClear();
    testOverlapResolution();
  });
});

/**
 * CLI Interface Tests
 */
describe('CLI Interface Tests', () => {
  testCliEntry();
  testCliCommand();
  testCliIntegration();
});

/**
 * Visualization Style Tests
 */
describe('Visualization Style Tests', () => {
  describe('Automatic Positioning', () => {
    testAutomaticPositioning();
    testAutomaticSpacing();
  });

  describe('Circular/Half-Circle Layout', () => {
    testCircularPositioning();
    testCircularLevelDistribution();
  });

  describe('Linear Layout', () => {
    testLinearPositioning();
    testLinearMeasurements();
  });

  describe('Diagonal Layout', () => {
    testDiagonalPositioning();
    testDiagonalMeasurements();
  });

  describe('Grouped Layout', () => {
    testGroupedPositioning();
    testGroupedColorCoding();
  });

  describe('Horizontal Layout', () => {
    testHorizontalAlignment();
    testHorizontalScaling();
  });

  describe('Vertical Layout', () => {
    testVerticalAlignment();
    testVerticalScaling();
  });
});

/**
 * Model Architecture Tests
 */
describe('Model Architecture Tests', () => {
  describe('Small Project Models', () => {
    testSmallProjectStructure();
    testSmallProjectProcessing();
  });

  describe('Circular Dependency Models', () => {
    testCircularDependencyModel();
    testCircularVisualization();
  });

  describe('Complex Architecture Models', () => {
    testComplexProjectStructures();
    testArchitecturalPatterns();
    testSpecializedProjectTypes();
  });
});

console.log('🧪 Running comprehensive test suite...');
console.log('📁 Testing src/ directory modules');
console.log('🎨 Testing visualization styles');
console.log('🏗️  Testing project models');
console.log('⚡ Tests will validate functionality and identify issues');
