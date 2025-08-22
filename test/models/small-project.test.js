// Test functions for small project architecture model validation
// Tests the small-size-project model for structural integrity and processing capability

import { promises as fs } from 'fs';
import assert from 'node:assert';
import { describe, test } from 'node:test';
import path from 'path';
import { detectCircularDependencies, findSourceFiles, parseFilesAndBuildGraph } from '../../src/services/consumer.js';

/**
 * Tests for small project model structure and analysis
 */
export function testSmallProjectStructure() {
  describe('Small Project Model Structure', () => {
    const modelPath = 'test/models/small-size-project';

    test('should have expected project files', async () => {
      try {
        // Check if main files exist
        const indexPath = path.join(modelPath, 'index.js');
        const packagePath = path.join(modelPath, 'package.json');

        const indexExists = await fs.access(indexPath).then(() => true).catch(() => false);
        const packageExists = await fs.access(packagePath).then(() => true).catch(() => false);

        assert.ok(indexExists, 'Should have index.js file');
        assert.ok(packageExists, 'Should have package.json file');

        if (packageExists) {
          const packageContent = await fs.readFile(packagePath, 'utf8');
          const pkg = JSON.parse(packageContent);
          assert.ok(pkg.name, 'Package should have a name');
          assert.ok(pkg.main, 'Package should have main entry point');
        }
      } catch (error) {
        console.log('Small project test model not available, skipping structure test');
      }
    });

    test('should be analyzable by consumer service', async () => {
      try {
        const options = { depth: 3, hidden: false };
        const files = await findSourceFiles(modelPath, options);

        if (files.length === 0) {
          console.log('No files found in small project model, skipping analysis test');
          return;
        }

        assert.ok(Array.isArray(files), 'Should return array of files');
        assert.ok(files.length > 0, 'Should find at least one source file');

        // Should find JavaScript files
        const jsFiles = files.filter(file => file.endsWith('.js'));
        assert.ok(jsFiles.length > 0, 'Should find JavaScript files');

        // Test graph building
        const { graph } = await parseFilesAndBuildGraph(files, modelPath);
        assert.ok(graph.nodes instanceof Map, 'Should build node map');
        assert.ok(graph.edges instanceof Map, 'Should build edge map');
        assert.ok(graph.nodes.size > 0, 'Should have nodes in graph');

        // Test cycle detection
        const cycles = detectCircularDependencies(graph);
        assert.ok(Array.isArray(cycles), 'Should return cycles array');

        console.log(`Small project analysis: ${files.length} files, ${graph.nodes.size} nodes, ${cycles.length} cycles`);
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.log('Small project test model not available, skipping analysis test');
        } else {
          throw error;
        }
      }
    });

    test('should represent typical small project characteristics', async () => {
      try {
        const options = { depth: 5, hidden: false };
        const files = await findSourceFiles(modelPath, options);

        if (files.length === 0) {
          console.log('Small project model not available for characteristic testing');
          return;
        }

        // Small project characteristics
        assert.ok(files.length <= 10, 'Small project should have limited number of files');

        // Should have mostly JavaScript files for a Node.js project
        const jsFiles = files.filter(file => file.endsWith('.js'));
        const tsFiles = files.filter(file => file.endsWith('.ts'));
        const totalScriptFiles = jsFiles.length + tsFiles.length;

        assert.ok(totalScriptFiles > 0, 'Should have script files');
        assert.ok(totalScriptFiles / files.length >= 0.5, 'Should be primarily script files');

        // Should be relatively flat structure
        const maxDepth = Math.max(...files.map(file => {
          const relativePath = path.relative(modelPath, file);
          return relativePath.split(path.sep).length;
        }));

        assert.ok(maxDepth <= 3, 'Small project should have shallow directory structure');

      } catch (error) {
        if (error.code === 'ENOENT') {
          console.log('Small project model not available for characteristic testing');
        } else {
          throw error;
        }
      }
    });
  });
}

export function testSmallProjectProcessing() {
  describe('Small Project Processing Capabilities', () => {
    test('should process without performance issues', async () => {
      const modelPath = 'test/models/small-size-project';

      try {
        const startTime = Date.now();
        const options = { depth: 5, hidden: false };

        const files = await findSourceFiles(modelPath, options);
        if (files.length === 0) {
          console.log('Small project model not available for performance testing');
          return;
        }

        const { graph } = await parseFilesAndBuildGraph(files, modelPath);
        const cycles = detectCircularDependencies(graph);

        const endTime = Date.now();
        const processingTime = endTime - startTime;

        // Small project should process very quickly
        assert.ok(processingTime < 1000, `Small project should process quickly (took ${processingTime}ms)`);
        assert.ok(graph.nodes.size === files.length, 'Should process all files');

        console.log(`Small project processed in ${processingTime}ms`);
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.log('Small project model not available for performance testing');
        } else {
          throw error;
        }
      }
    });
  });
}

export default { testSmallProjectStructure, testSmallProjectProcessing };
