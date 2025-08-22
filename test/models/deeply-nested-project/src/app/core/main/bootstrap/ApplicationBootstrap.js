// Main application bootstrap
const Logger = require('../utils/logging/adapters/console/ConsoleLogger');
const ConfigManager = require('../config/managers/application/AppConfigManager');
const ServiceRegistry = require('../../services/registry/core/ServiceRegistry');

class ApplicationBootstrap {
  constructor() {
    this.logger = new Logger();
    this.configManager = new ConfigManager();
    this.serviceRegistry = new ServiceRegistry();
  }

  async initialize() {
    this.logger.info('Initializing deeply nested application...');

    try {
      // Load configuration
      await this.configManager.loadConfiguration();
      this.logger.info('Configuration loaded successfully');

      // Register services
      await this.registerServices();
      this.logger.info('Services registered successfully');

      // Start application
      await this.startApplication();
      this.logger.info('Application started successfully');

    } catch (error) {
      this.logger.error('Failed to initialize application:', error);
      throw error;
    }
  }

  async registerServices() {
    const UserService = require('../../modules/user/domain/services/core/UserDomainService');
    const NotificationService = require('../../modules/notification/application/services/core/NotificationApplicationService');

    this.serviceRegistry.register('userService', new UserService());
    this.serviceRegistry.register('notificationService', new NotificationService());
  }

  async startApplication() {
    const port = this.configManager.get('server.port', 3000);
    this.logger.info(`Application running in deeply nested architecture on port ${port}`);
  }
}

module.exports = ApplicationBootstrap;
