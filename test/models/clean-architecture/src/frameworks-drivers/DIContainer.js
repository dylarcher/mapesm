// Dependency Injection Container - Frameworks & Drivers Layer
import { User } from '../entities/User.js';
import { UserController } from '../interface-adapters/UserController.js';
import { UserPresenter } from '../interface-adapters/UserPresenter.js';
import { UserRepository } from '../interface-adapters/UserRepository.js';
import { CreateUserUseCase } from '../use-cases/CreateUserUseCase.js';
import { GetUserUseCase } from '../use-cases/GetUserUseCase.js';
import { Database } from './Database.js';
import { WebServer } from './WebServer.js';

export class DIContainer {
  constructor(config = {}) {
    this.config = {
      // Database configuration
      database: {
        type: 'in-memory', // 'postgresql', 'mysql', 'mongodb', etc.
        host: 'localhost',
        port: 5432,
        database: 'clean_arch_db',
        username: 'user',
        password: 'password',
        ...config.database
      },

      // Web server configuration
      server: {
        port: 3000,
        host: '0.0.0.0',
        environment: 'development',
        corsOrigins: ['http://localhost:3000', 'http://localhost:3001'],
        rateLimitWindow: 15 * 60 * 1000, // 15 minutes
        rateLimitMax: 100,
        version: '1.0.0',
        ...config.server
      },

      // Application configuration
      app: {
        logLevel: 'info',
        enableMetrics: false,
        enableTracing: false,
        ...config.app
      }
    };

    this.instances = new Map();
    this.singletons = new Set();
    this.factories = new Map();
    this.initializationOrder = [];

    this.registerDependencies();
  }

  registerDependencies() {
    // Register frameworks & drivers (outermost layer)
    this.register('database', () => new Database(this.config.database), { singleton: true });
    this.register('webServer', () => new WebServer(this.resolve('userController'), this.config.server), { singleton: true });

    // Register interface adapters (second layer from outside)
    this.register('userRepository', () => new UserRepository(this.resolve('database')), { singleton: true });
    this.register('userPresenter', () => new UserPresenter(), { singleton: true });
    this.register('userController', () => new UserController(
      this.resolve('createUserUseCase'),
      this.resolve('getUserUseCase'),
      this.resolve('updateUserUseCase'),
      this.resolve('deleteUserUseCase'),
      this.resolve('userPresenter')
    ), { singleton: true });

    // Register use cases (application layer)
    this.register('createUserUseCase', () => new CreateUserUseCase(this.resolve('userRepository')), { singleton: true });
    this.register('getUserUseCase', () => new GetUserUseCase(this.resolve('userRepository')), { singleton: true });
    this.register('updateUserUseCase', () => new UpdateUserUseCase(this.resolve('userRepository')), { singleton: true });
    this.register('deleteUserUseCase', () => new DeleteUserUseCase(this.resolve('userRepository')), { singleton: true });

    // Register entities (innermost layer - domain)
    this.register('userEntity', (email, name) => new User(email, name), { singleton: false });

    // Set initialization order (dependencies first)
    this.initializationOrder = [
      'database',
      'userRepository',
      'createUserUseCase',
      'getUserUseCase',
      'updateUserUseCase',
      'deleteUserUseCase',
      'userPresenter',
      'userController',
      'webServer'
    ];
  }

  register(name, factory, options = {}) {
    if (this.factories.has(name)) {
      throw new Error(`Dependency '${name}' is already registered`);
    }

    this.factories.set(name, {
      factory,
      options: {
        singleton: true,
        lazy: true,
        ...options
      }
    });

    if (options.singleton) {
      this.singletons.add(name);
    }

    console.log(`Registered dependency: ${name} (singleton: ${options.singleton})`);
  }

  resolve(name, ...args) {
    // Check if already instantiated (for singletons)
    if (this.instances.has(name)) {
      return this.instances.get(name);
    }

    // Get factory
    const factoryInfo = this.factories.get(name);
    if (!factoryInfo) {
      throw new Error(`Dependency '${name}' is not registered`);
    }

    const { factory, options } = factoryInfo;

    try {
      console.log(`Resolving dependency: ${name}`);
      const instance = factory(...args);

      // Store singleton instances
      if (options.singleton) {
        this.instances.set(name, instance);
      }

      return instance;

    } catch (error) {
      throw new Error(`Failed to resolve dependency '${name}': ${error.message}`);
    }
  }

  // Initialize all dependencies in the correct order
  async initialize() {
    console.log('Starting dependency initialization...');

    const initialized = new Set();

    for (const name of this.initializationOrder) {
      if (!initialized.has(name)) {
        await this.initializeDependency(name, initialized);
      }
    }

    console.log('All dependencies initialized successfully');
  }

  async initializeDependency(name, initialized) {
    if (initialized.has(name)) {
      return;
    }

    console.log(`Initializing: ${name}`);

    try {
      const instance = this.resolve(name);

      // Call initialize method if it exists
      if (instance && typeof instance.initialize === 'function') {
        await instance.initialize();
      }

      // Special initialization for database connection
      if (name === 'database' && typeof instance.connect === 'function') {
        await instance.connect();
      }

      initialized.add(name);
      console.log(`✅ Initialized: ${name}`);

    } catch (error) {
      console.error(`❌ Failed to initialize ${name}:`, error);
      throw error;
    }
  }

  // Shutdown all dependencies
  async shutdown() {
    console.log('Starting graceful shutdown...');

    const shutdownOrder = [...this.initializationOrder].reverse();

    for (const name of shutdownOrder) {
      if (this.instances.has(name)) {
        await this.shutdownDependency(name);
      }
    }

    console.log('All dependencies shut down successfully');
  }

  async shutdownDependency(name) {
    const instance = this.instances.get(name);

    if (!instance) {
      return;
    }

    console.log(`Shutting down: ${name}`);

    try {
      // Call shutdown method if it exists
      if (typeof instance.shutdown === 'function') {
        await instance.shutdown();
      }

      // Special shutdown for web server
      if (name === 'webServer' && typeof instance.stop === 'function') {
        await instance.stop();
      }

      // Special shutdown for database
      if (name === 'database' && typeof instance.disconnect === 'function') {
        await instance.disconnect();
      }

      console.log(`✅ Shut down: ${name}`);

    } catch (error) {
      console.error(`❌ Error shutting down ${name}:`, error);
    }
  }

  // Utility methods
  has(name) {
    return this.factories.has(name);
  }

  isInstantiated(name) {
    return this.instances.has(name);
  }

  getInstance(name) {
    return this.instances.get(name);
  }

  getAllInstances() {
    return new Map(this.instances);
  }

  getDependencyGraph() {
    const graph = {};

    for (const [name, factoryInfo] of this.factories.entries()) {
      graph[name] = {
        singleton: factoryInfo.options.singleton,
        instantiated: this.instances.has(name),
        dependencies: this.extractDependencies(name)
      };
    }

    return graph;
  }

  extractDependencies(name) {
    // In a more sophisticated DI container, this would analyze the factory function
    // For now, we'll return the known dependencies
    const dependencyMap = {
      webServer: ['userController'],
      userController: ['createUserUseCase', 'getUserUseCase', 'updateUserUseCase', 'deleteUserUseCase', 'userPresenter'],
      userRepository: ['database'],
      createUserUseCase: ['userRepository'],
      getUserUseCase: ['userRepository'],
      updateUserUseCase: ['userRepository'],
      deleteUserUseCase: ['userRepository']
    };

    return dependencyMap[name] || [];
  }

  // Health check for all dependencies
  async healthCheck() {
    const health = {
      status: 'healthy',
      dependencies: {},
      timestamp: new Date().toISOString()
    };

    let overallHealthy = true;

    for (const [name, instance] of this.instances.entries()) {
      try {
        let dependencyHealth = { status: 'healthy' };

        if (typeof instance.healthCheck === 'function') {
          dependencyHealth = await instance.healthCheck();
        }

        health.dependencies[name] = dependencyHealth;

        if (dependencyHealth.status !== 'healthy') {
          overallHealthy = false;
        }

      } catch (error) {
        health.dependencies[name] = {
          status: 'unhealthy',
          error: error.message
        };
        overallHealthy = false;
      }
    }

    health.status = overallHealthy ? 'healthy' : 'unhealthy';
    return health;
  }

  // Configuration management
  getConfig() {
    return { ...this.config };
  }

  updateConfig(updates) {
    this.config = {
      ...this.config,
      ...updates
    };
  }

  // Factory for creating new container instances
  static create(config = {}) {
    return new DIContainer(config);
  }

  // Helper to create a scoped container (for testing)
  createScope() {
    const scopedContainer = new DIContainer(this.config);

    // Copy factory registrations but not instances
    for (const [name, factoryInfo] of this.factories.entries()) {
      scopedContainer.factories.set(name, factoryInfo);
    }

    return scopedContainer;
  }
}

// Additional Use Case classes needed for the DI container
export class UpdateUserUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(id, updateData) {
    // Simplified update logic - in a real app this would be more complex
    const user = await this.userRepository.findById(id);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Update user properties
    if (updateData.name) {
      user.setName(updateData.name);
    }
    if (updateData.email) {
      user.setEmail(updateData.email);
    }

    const updatedUser = await this.userRepository.save(user);

    return {
      success: true,
      user: updatedUser,
      updatedAt: new Date(),
      updatedFields: Object.keys(updateData)
    };
  }
}

export class DeleteUserUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(id) {
    const exists = await this.userRepository.exists(id);
    if (!exists) {
      return { success: false, error: 'User not found' };
    }

    await this.userRepository.delete(id);

    return {
      success: true,
      deletedUserId: id,
      deletedAt: new Date()
    };
  }
}
