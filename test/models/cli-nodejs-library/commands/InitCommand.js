// Initialize Command - Creates new project scaffolding
import { BaseCommand } from '../lib/BaseCommand.js';
import { ProjectGenerator } from '../utils/ProjectGenerator.js';
import { TemplateManager } from '../utils/TemplateManager.js';

export class InitCommand extends BaseCommand {
  constructor(config, logger) {
    super('init', 'Initialize a new project from template');
    this.config = config;
    this.logger = logger;
    this.projectGenerator = new ProjectGenerator(logger);
    this.templateManager = new TemplateManager();

    this.setupCommand();
  }

  setupCommand() {
    this
      .argument('project-name', 'Name of the new project')
      .option('-t, --template <name>', 'Project template to use', 'basic')
      .option('-d, --directory <path>', 'Target directory', '.')
      .option('--git', 'Initialize git repository', false)
      .option('--install', 'Install dependencies after creation', false)
      .option('-f, --force', 'Overwrite existing files', false)
      .example('init my-app', 'Create a new project named "my-app"')
      .example('init my-app -t react', 'Create a React project')
      .example('init my-app -t node --git --install', 'Create Node.js project with git and dependencies');
  }

  async run(args, options, globalOptions) {
    const [projectName] = args;

    this.logger.info(`Initializing project: ${projectName}`);

    // Validate template
    const availableTemplates = await this.templateManager.getAvailableTemplates();
    if (!availableTemplates.includes(options.template)) {
      throw new Error(`Template '${options.template}' not found. Available: ${availableTemplates.join(', ')}`);
    }

    // Check if directory exists
    const targetPath = await this.projectGenerator.resolveTargetPath(options.directory, projectName);

    if (await this.projectGenerator.directoryExists(targetPath) && !options.force) {
      throw new Error(`Directory '${targetPath}' already exists. Use --force to overwrite.`);
    }

    try {
      // Generate project structure
      this.logger.info(`Using template: ${options.template}`);
      await this.projectGenerator.generateFromTemplate(
        options.template,
        targetPath,
        {
          projectName,
          force: options.force
        }
      );

      // Initialize git repository
      if (options.git) {
        this.logger.info('Initializing git repository...');
        await this.projectGenerator.initializeGit(targetPath);
      }

      // Install dependencies
      if (options.install) {
        this.logger.info('Installing dependencies...');
        await this.projectGenerator.installDependencies(targetPath);
      }

      this.logger.success(`Project '${projectName}' created successfully!`);

      // Show next steps
      this.showNextSteps(projectName, targetPath, options);

    } catch (error) {
      this.logger.error(`Failed to create project: ${error.message}`);

      // Cleanup on failure
      if (await this.projectGenerator.directoryExists(targetPath)) {
        this.logger.info('Cleaning up partial installation...');
        await this.projectGenerator.cleanup(targetPath);
      }

      throw error;
    }
  }

  showNextSteps(projectName, targetPath, options) {
    console.log('\nNext steps:');
    console.log(`  cd ${projectName}`);

    if (!options.install) {
      console.log('  npm install');
    }

    console.log('  npm start');

    if (!options.git) {
      console.log('\nOptional:');
      console.log('  git init');
      console.log('  git add .');
      console.log('  git commit -m "Initial commit"');
    }
  }
}
