// Deploy Command - Handles deployment to various targets
import { BaseCommand } from '../lib/BaseCommand.js';
import { DeploymentService } from '../utils/DeploymentService.js';

export class DeployCommand extends BaseCommand {
  constructor(config, logger) {
    super('deploy', 'Deploy the application to specified environment');
    this.config = config;
    this.logger = logger;
    this.deploymentService = new DeploymentService(config, logger);

    this.setupCommand();
  }

  setupCommand() {
    this
      .option('-e, --env <environment>', 'Deployment environment', 'staging')
      .option('-t, --target <target>', 'Deployment target (aws, gcp, azure, netlify)', 'netlify')
      .option('--build', 'Build before deployment', true)
      .option('--dry-run', 'Show what would be deployed without deploying', false)
      .option('-f, --force', 'Force deployment even if validation fails', false)
      .option('--rollback <version>', 'Rollback to specified version')
      .example('deploy', 'Deploy to staging on default target')
      .example('deploy --env production --target aws', 'Deploy to production on AWS')
      .example('deploy --dry-run', 'Preview deployment without executing');
  }

  async run(args, options, globalOptions) {
    // Handle rollback
    if (options.rollback) {
      return await this.handleRollback(options);
    }

    const deployConfig = {
      environment: options.env,
      target: options.target,
      build: options.build,
      dryRun: options.dryRun,
      force: options.force
    };

    this.logger.info(`Preparing deployment to ${deployConfig.environment} (${deployConfig.target})...`);

    try {
      // Pre-deployment validation
      await this.validateDeployment(deployConfig);

      // Build if requested
      if (deployConfig.build) {
        this.logger.info('Building project before deployment...');
        await this.deploymentService.buildForDeployment(deployConfig);
      }

      // Dry run
      if (deployConfig.dryRun) {
        const deploymentPlan = await this.deploymentService.createDeploymentPlan(deployConfig);
        this.showDeploymentPlan(deploymentPlan);
        return;
      }

      // Execute deployment
      this.logger.info('Starting deployment...');
      const deploymentResult = await this.deploymentService.deploy(deployConfig);

      this.logger.success('Deployment completed successfully!');
      this.showDeploymentResult(deploymentResult);

    } catch (error) {
      this.logger.error(`Deployment failed: ${error.message}`);

      // Attempt automatic rollback on failure
      if (!deployConfig.dryRun && this.config.get('deployment.autoRollback', true)) {
        this.logger.warn('Attempting automatic rollback...');
        try {
          await this.deploymentService.rollbackToPrevious(deployConfig);
          this.logger.info('Rollback completed successfully');
        } catch (rollbackError) {
          this.logger.error(`Rollback failed: ${rollbackError.message}`);
        }
      }

      throw error;
    }
  }

  async validateDeployment(config) {
    const validTargets = ['aws', 'gcp', 'azure', 'netlify', 'vercel'];
    if (!validTargets.includes(config.target)) {
      throw new Error(`Invalid target: ${config.target}. Available: ${validTargets.join(', ')}`);
    }

    // Check required configuration
    const requiredConfig = await this.deploymentService.getRequiredConfig(config.target);
    const missingConfig = requiredConfig.filter(key => !this.config.has(key));

    if (missingConfig.length > 0 && !config.force) {
      throw new Error(`Missing required configuration: ${missingConfig.join(', ')}`);
    }

    // Validate deployment artifacts
    const hasArtifacts = await this.deploymentService.validateArtifacts();
    if (!hasArtifacts && !config.build) {
      throw new Error('No deployment artifacts found. Use --build to build before deployment.');
    }
  }

  async handleRollback(options) {
    this.logger.info(`Rolling back to version ${options.rollback}...`);

    try {
      const rollbackResult = await this.deploymentService.rollbackToVersion(
        options.rollback,
        {
          environment: options.env,
          target: options.target,
          force: options.force
        }
      );

      this.logger.success('Rollback completed successfully!');
      this.showRollbackResult(rollbackResult);

    } catch (error) {
      this.logger.error(`Rollback failed: ${error.message}`);
      throw error;
    }
  }

  showDeploymentPlan(plan) {
    console.log('\nDeployment Plan:');
    console.log(`  Environment: ${plan.environment}`);
    console.log(`  Target: ${plan.target}`);
    console.log(`  Version: ${plan.version}`);
    console.log('\nFiles to be deployed:');

    plan.files.forEach(file => {
      console.log(`  + ${file.path} (${file.size} bytes)`);
    });

    console.log('\nEnvironment Variables:');
    Object.entries(plan.environmentVariables).forEach(([key, value]) => {
      const maskedValue = key.toLowerCase().includes('secret') || key.toLowerCase().includes('key')
        ? '*'.repeat(value.length)
        : value;
      console.log(`  ${key}=${maskedValue}`);
    });
  }

  showDeploymentResult(result) {
    console.log('\nDeployment Result:');
    console.log(`  Environment: ${result.environment}`);
    console.log(`  Version: ${result.version}`);
    console.log(`  URL: ${result.url}`);
    console.log(`  Duration: ${result.duration}ms`);

    if (result.warnings && result.warnings.length > 0) {
      console.log('\nWarnings:');
      result.warnings.forEach(warning => {
        console.log(`  - ${warning}`);
      });
    }
  }

  showRollbackResult(result) {
    console.log('\nRollback Result:');
    console.log(`  Previous Version: ${result.fromVersion}`);
    console.log(`  Current Version: ${result.toVersion}`);
    console.log(`  URL: ${result.url}`);
    console.log(`  Duration: ${result.duration}ms`);
  }
}
