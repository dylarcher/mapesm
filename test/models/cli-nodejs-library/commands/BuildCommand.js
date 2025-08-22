// Build Command - Handles project building and bundling
import { BaseCommand } from '../lib/BaseCommand.js';
import { BuildService } from '../utils/BuildService.js';
import { FileWatcher } from '../utils/FileWatcher.js';

export class BuildCommand extends BaseCommand {
  constructor(config, logger) {
    super('build', 'Build the project for production or development');
    this.config = config;
    this.logger = logger;
    this.buildService = new BuildService(config, logger);

    this.setupCommand();
  }

  setupCommand() {
    this
      .option('-e, --env <environment>', 'Build environment', 'production')
      .option('-w, --watch', 'Watch for file changes and rebuild', false)
      .option('-o, --output <directory>', 'Output directory', 'dist')
      .option('--clean', 'Clean output directory before build', false)
      .option('--analyze', 'Analyze bundle size', false)
      .option('--source-map', 'Generate source maps', false)
      .option('-m, --minify', 'Minify output', true)
      .example('build', 'Build for production')
      .example('build --env development --watch', 'Build in development mode with watch')
      .example('build --clean --analyze', 'Clean build with bundle analysis');
  }

  async run(args, options, globalOptions) {
    const buildConfig = {
      environment: options.env,
      outputDir: options.output,
      clean: options.clean,
      minify: options.minify,
      sourceMap: options.sourceMap,
      analyze: options.analyze
    };

    this.logger.info(`Building project (${buildConfig.environment})...`);

    try {
      // Clean output directory if requested
      if (buildConfig.clean) {
        this.logger.info('Cleaning output directory...');
        await this.buildService.clean(buildConfig.outputDir);
      }

      // Perform build
      const buildResult = await this.buildService.build(buildConfig);

      this.logger.success('Build completed successfully!');
      this.showBuildStats(buildResult);

      // Bundle analysis
      if (buildConfig.analyze) {
        this.logger.info('Generating bundle analysis...');
        await this.buildService.analyzeBundles(buildResult);
      }

      // Watch mode
      if (options.watch) {
        this.logger.info('Starting watch mode...');
        await this.startWatchMode(buildConfig);
      }

    } catch (error) {
      this.logger.error(`Build failed: ${error.message}`);
      if (globalOptions.verbose) {
        console.error(error.stack);
      }
      throw error;
    }
  }

  async startWatchMode(buildConfig) {
    const watcher = new FileWatcher(['src/**/*', 'public/**/*'], {
      ignore: ['node_modules/**', 'dist/**']
    });

    watcher.on('change', async (filePath) => {
      this.logger.info(`File changed: ${filePath}`);
      this.logger.info('Rebuilding...');

      try {
        const startTime = Date.now();
        await this.buildService.build(buildConfig);
        const duration = Date.now() - startTime;

        this.logger.success(`Rebuilt in ${duration}ms`);
      } catch (error) {
        this.logger.error(`Rebuild failed: ${error.message}`);
      }
    });

    watcher.on('error', (error) => {
      this.logger.error(`Watch error: ${error.message}`);
    });

    await watcher.start();

    this.logger.info('Watching for changes... (Press Ctrl+C to stop)');

    // Handle process termination
    process.on('SIGINT', async () => {
      this.logger.info('Stopping watch mode...');
      await watcher.stop();
      process.exit(0);
    });

    // Keep process alive
    return new Promise(() => { });
  }

  showBuildStats(buildResult) {
    console.log('\nBuild Statistics:');
    console.log(`  Environment: ${buildResult.environment}`);
    console.log(`  Output Directory: ${buildResult.outputDir}`);
    console.log(`  Files Generated: ${buildResult.files.length}`);
    console.log(`  Build Time: ${buildResult.duration}ms`);

    if (buildResult.warnings && buildResult.warnings.length > 0) {
      console.log('\nWarnings:');
      buildResult.warnings.forEach(warning => {
        console.log(`  - ${warning}`);
      });
    }

    if (buildResult.assets && buildResult.assets.length > 0) {
      console.log('\nGenerated Assets:');
      buildResult.assets.forEach(asset => {
        const size = (asset.size / 1024).toFixed(2);
        console.log(`  ${asset.name.padEnd(30)} ${size} KB`);
      });
    }
  }
}
