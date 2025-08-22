// Clean Architecture Application Entry Point
import { DatabaseConnection } from './frameworks-drivers/DatabaseConnection.js';
import { DIContainer } from './frameworks-drivers/DIContainer.js';
import { Logger } from './frameworks-drivers/Logger.js';
import { WebServer } from './frameworks-drivers/WebServer.js';

// Interface Adapters
import { UserController } from './interface-adapters/UserController.js';
import { UserPresenter } from './interface-adapters/UserPresenter.js';
import { UserRepository } from './interface-adapters/UserRepository.js';

// Use Cases
import { CreateUserUseCase } from './use-cases/CreateUserUseCase.js';
import { DeleteUserUseCase } from './use-cases/DeleteUserUseCase.js';
import { GetUserUseCase } from './use-cases/GetUserUseCase.js';
import { UpdateUserUseCase } from './use-cases/UpdateUserUseCase.js';

export class CleanArchitectureApp {
  constructor(config = {}) {
    this.config = config;
    this.container = new DIContainer();
    this.logger = new Logger();

    this.setupDependencies();
  }

  setupDependencies() {
    // Register framework & drivers layer
    this.container.register('logger', () => this.logger);
    this.container.register('database', () => new DatabaseConnection(this.config.database));
    this.container.register('webServer', () => new WebServer(this.config.server));

    // Register interface adapters layer
    this.container.register('userRepository', () =>
      new UserRepository(this.container.resolve('database'))
    );
    this.container.register('userPresenter', () => new UserPresenter());

    // Register use cases layer (application business rules)
    this.container.register('createUserUseCase', () =>
      new CreateUserUseCase(
        this.container.resolve('userRepository'),
        this.container.resolve('logger')
      )
    );
    this.container.register('getUserUseCase', () =>
      new GetUserUseCase(
        this.container.resolve('userRepository'),
        this.container.resolve('logger')
      )
    );
    this.container.register('updateUserUseCase', () =>
      new UpdateUserUseCase(
        this.container.resolve('userRepository'),
        this.container.resolve('logger')
      )
    );
    this.container.register('deleteUserUseCase', () =>
      new DeleteUserUseCase(
        this.container.resolve('userRepository'),
        this.container.resolve('logger')
      )
    );

    // Register controllers (interface adapters)
    this.container.register('userController', () =>
      new UserController(
        this.container.resolve('createUserUseCase'),
        this.container.resolve('getUserUseCase'),
        this.container.resolve('updateUserUseCase'),
        this.container.resolve('deleteUserUseCase'),
        this.container.resolve('userPresenter')
      )
    );
  }

  async start() {
    try {
      this.logger.info('Starting Clean Architecture Application...');

      // Initialize database connection
      const database = this.container.resolve('database');
      await database.connect();
      this.logger.info('Database connected');

      // Setup web server with routes
      const webServer = this.container.resolve('webServer');
      const userController = this.container.resolve('userController');

      // Register routes
      webServer.registerRoutes('/api/users', userController);

      // Start web server
      await webServer.start();
      this.logger.info(`Application started on port ${this.config.server?.port || 3000}`);

    } catch (error) {
      this.logger.error('Failed to start application:', error);
      throw error;
    }
  }

  async stop() {
    try {
      this.logger.info('Stopping Clean Architecture Application...');

      const webServer = this.container.resolve('webServer');
      const database = this.container.resolve('database');

      await webServer.stop();
      await database.disconnect();

      this.logger.info('Application stopped successfully');

    } catch (error) {
      this.logger.error('Error during application shutdown:', error);
      throw error;
    }
  }

  getContainer() {
    return this.container;
  }
}
