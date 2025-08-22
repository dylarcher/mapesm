// Test functions for complex project architecture model validation
// Tests various complex project structures for scalability and processing capability

import assert from 'node:assert';
import { describe, test } from 'node:test';
import path from 'path';
import { detectCircularDependencies, findSourceFiles, parseFilesAndBuildGraph } from '../../src/services/consumer.js';

/**
 * Tests for complex project architectures
 */
export function testComplexProjectStructures() {
  describe('Complex Project Architecture Models', () => {
    const complexModels = [
      'complex-structure',
      'large-size-project',
      'medium-size-project',
      'microservices-project',
      'deeply-nested-project'
    ];

    complexModels.forEach(modelName => {
      test(`should handle ${modelName} architecture`, async () => {
        const modelPath = `test/models/${modelName}`;

        try {
          const options = { depth: 10, hidden: false };
          const files = await findSourceFiles(modelPath, options);

          if (files.length === 0) {
            console.log(`${modelName} model not available, skipping`);
            return;
          }

          assert.ok(Array.isArray(files), `${modelName} should return file array`);

          // Complex projects should have multiple files
          if (modelName.includes('large') || modelName.includes('complex')) {
            assert.ok(files.length > 10, `${modelName} should have many files`);
          } else if (modelName.includes('medium')) {
            assert.ok(files.length >= 5, `${modelName} should have moderate number of files`);
          }

          // Test graph building performance
          const startTime = Date.now();
          const { graph } = await parseFilesAndBuildGraph(files, modelPath);
          const cycles = detectCircularDependencies(graph);
          const endTime = Date.now();

          const processingTime = endTime - startTime;

          assert.ok(graph.nodes instanceof Map, `${modelName} should build valid graph`);
          assert.ok(graph.nodes.size === files.length, `${modelName} should process all files`);
          assert.ok(Array.isArray(cycles), `${modelName} should return cycles array`);

          // Performance expectations based on complexity
          const maxProcessingTime = modelName.includes('large') ? 10000 :
            modelName.includes('complex') ? 8000 :
              modelName.includes('deeply-nested') ? 6000 : 5000;

          assert.ok(processingTime < maxProcessingTime,
            `${modelName} should process within ${maxProcessingTime}ms (took ${processingTime}ms)`);

          console.log(`${modelName}: ${files.length} files, ${graph.nodes.size} nodes, ${cycles.length} cycles, ${processingTime}ms`);

        } catch (error) {
          if (error.code === 'ENOENT') {
            console.log(`${modelName} test model not available`);
          } else {
            throw error;
          }
        }
      });
    });
  });
}

export function testArchitecturalPatterns() {
  describe('Architectural Pattern Models', () => {
    const architectureModels = [
      { name: 'mvc-style-structure', pattern: 'MVC' },
      { name: 'clean-architecture', pattern: 'Clean Architecture' },
      { name: 'layered-architecture', pattern: 'Layered' },
      { name: 'hexagonal-architecture', pattern: 'Hexagonal' },
      { name: 'plugin-architecture', pattern: 'Plugin-based' },
      { name: 'event-driven-project', pattern: 'Event-driven' }
    ];

    architectureModels.forEach(({ name, pattern }) => {
      test(`should analyze ${pattern} architecture pattern`, async () => {
        const modelPath = `test/models/${name}`;

        try {
          const options = { depth: 8, hidden: false };
          const files = await findSourceFiles(modelPath, options);

          if (files.length === 0) {
            console.log(`${pattern} architecture model not available`);
            return;
          }

          const { graph } = await parseFilesAndBuildGraph(files, modelPath);
          const cycles = detectCircularDependencies(graph);

          // Architectural patterns should generally have organized structures
          assert.ok(graph.nodes.size > 0, `${pattern} should have analyzable structure`);

          // Test hierarchy extraction
          const { buildHierarchicalStructure, extractSecondLevelDirectories } = await import('../../src/utils.js');
          const secondLevelDirs = extractSecondLevelDirectories(graph.nodes, modelPath);
          const { root, maxDepth } = buildHierarchicalStructure(graph.nodes, modelPath);

          assert.ok(Array.isArray(secondLevelDirs), `${pattern} should have identifiable modules`);
          assert.ok(typeof maxDepth === 'number' && maxDepth > 0, `${pattern} should have depth structure`);
          assert.ok(root && root.children, `${pattern} should have hierarchical root`);

          // Architecture-specific validations
          if (name.includes('mvc')) {
            // MVC should have typical MVC directories
            const hasMvcStructure = secondLevelDirs.some(dir =>
              ['controllers', 'models', 'views', 'services'].includes(dir.toLowerCase())
            );
            if (hasMvcStructure) {
              console.log(`✓ ${pattern} shows expected structural patterns`);
            }
          } else if (name.includes('layered')) {
            // Layered architecture should have multiple levels
            assert.ok(maxDepth >= 2, `${pattern} should have layered depth`);
          } else if (name.includes('microservices')) {
            // Microservices should have service-oriented structure
            const hasServiceStructure = secondLevelDirs.some(dir =>
              dir.includes('service') || dir.includes('api') || dir.includes('gateway')
            );
            if (hasServiceStructure) {
              console.log(`✓ ${pattern} shows service-oriented structure`);
            }
          }

          console.log(`${pattern}: ${files.length} files, depth ${maxDepth}, ${secondLevelDirs.length} modules, ${cycles.length} cycles`);

        } catch (error) {
          if (error.code === 'ENOENT') {
            console.log(`${pattern} architecture model not available`);
          } else {
            throw error;
          }
        }
      });
    });
  });
}

export function testSpecializedProjectTypes() {
  describe('Specialized Project Type Models', () => {
    const specializedModels = [
      { name: 'react-framework', type: 'React Frontend' },
      { name: 'angular-framework', type: 'Angular Frontend' },
      { name: 'component-library', type: 'Component Library' },
      { name: 'graphql-api-project', type: 'GraphQL API' },
      { name: 'rest-api-architecture', type: 'REST API' },
      { name: 'serverless-functions', type: 'Serverless' },
      { name: 'cli-nodejs-library', type: 'CLI Library' }
    ];

    specializedModels.forEach(({ name, type }) => {
      test(`should process ${type} project structure`, async () => {
        const modelPath = `test/models/${name}`;

        try {
          const options = { depth: 6, hidden: false };
          const files = await findSourceFiles(modelPath, options);

          if (files.length === 0) {
            console.log(`${type} project model not available`);
            return;
          }

          const { graph } = await parseFilesAndBuildGraph(files, modelPath);

          // Check for framework-specific file types
          const fileTypes = files.map(file => path.extname(file).toLowerCase());
          const uniqueFileTypes = [...new Set(fileTypes)];

          assert.ok(uniqueFileTypes.length > 0, `${type} should have identifiable file types`);

          // Framework-specific validations
          if (name.includes('react')) {
            const hasReactFiles = files.some(file =>
              file.endsWith('.jsx') || file.endsWith('.tsx') ||
              file.includes('component') || file.includes('react')
            );
            if (hasReactFiles) {
              console.log(`✓ ${type} shows React-specific patterns`);
            }
          } else if (name.includes('angular')) {
            const hasAngularFiles = files.some(file =>
              file.endsWith('.ts') || file.includes('component') ||
              file.includes('service') || file.includes('module')
            );
            if (hasAngularFiles) {
              console.log(`✓ ${type} shows Angular-specific patterns`);
            }
          } else if (name.includes('cli')) {
            const hasCliStructure = files.some(file =>
              file.includes('cli') || file.includes('command') ||
              file.includes('bin') || file.includes('Command')
            );
            if (hasCliStructure) {
              console.log(`✓ ${type} shows CLI-specific structure`);
            }
          }

          console.log(`${type}: ${files.length} files, ${uniqueFileTypes.join(', ')} types`);

        } catch (error) {
          if (error.code === 'ENOENT') {
            console.log(`${type} project model not available`);
          } else {
            throw error;
          }
        }
      });
    });
  });
}

export default { testComplexProjectStructures, testArchitecturalPatterns, testSpecializedProjectTypes };
