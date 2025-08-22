// Clean Architecture Application Entry Point
import { DIContainer } from './frameworks-drivers/DIContainer.js';

async function startApplication() {
  try {
    console.log('🚀 Starting Clean Architecture Application...');

    // Create and configure dependency injection container
    const container = DIContainer.create({
      database: {
        type: 'in-memory',
        host: 'localhost',
        database: 'clean_arch_demo'
      },
      server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || 'localhost',
        environment: process.env.NODE_ENV || 'development',
        corsOrigins: ['http://localhost:3000', 'http://localhost:3001'],
        version: '1.0.0'
      },
      app: {
        logLevel: 'info',
        enableMetrics: false,
        enableTracing: false
      }
    });

    // Initialize all dependencies in correct order
    await container.initialize();

    // Perform health check to ensure everything is working
    const healthCheck = await container.healthCheck();
    console.log('🏥 System Health:', healthCheck.status);

    if (healthCheck.status !== 'healthy') {
      console.error('⚠️  System is not healthy:', healthCheck);
      throw new Error('System health check failed');
    }

    // Start the web server
    const webServer = container.resolve('webServer');
    const server = webServer.start();

    console.log('✅ Clean Architecture Application started successfully!');
    console.log('\n📋 System Information:');
    console.log(`- Environment: ${container.getConfig().server.environment}`);
    console.log(`- Server: http://${container.getConfig().server.host}:${container.getConfig().server.port}`);
    console.log(`- Database: ${container.getConfig().database.type}`);

    console.log('\n🌐 Available endpoints:');
    console.log(`- Health Check: http://localhost:${container.getConfig().server.port}/health`);
    console.log(`- API Health: http://localhost:${container.getConfig().server.port}/api/health`);
    console.log(`- API Docs: http://localhost:${container.getConfig().server.port}/api/docs`);
    console.log(`- Users API: http://localhost:${container.getConfig().server.port}/api/v1/users`);

    console.log('\n🏗️  Dependency Graph:');
    const graph = container.getDependencyGraph();
    Object.entries(graph).forEach(([name, info]) => {
      const status = info.instantiated ? '✅' : '⏳';
      const deps = info.dependencies.length > 0 ? ` -> [${info.dependencies.join(', ')}]` : '';
      console.log(`  ${status} ${name} (${info.singleton ? 'singleton' : 'transient'})${deps}`);
    });

    // Example usage demonstration
    console.log('\n🧪 Testing the system...');
    await demonstrateUsage(container);

    // Graceful shutdown handling
    const gracefulShutdown = async () => {
      console.log('\n🛑 Shutting down gracefully...');
      try {
        await container.shutdown();
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      gracefulShutdown();
    });
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown();
    });

    return container;

  } catch (error) {
    console.error('❌ Failed to start application:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

async function demonstrateUsage(container) {
  try {
    // Get use case instances
    const createUserUseCase = container.resolve('createUserUseCase');
    const getUserUseCase = container.resolve('getUserUseCase');

    // Create a test user
    console.log('Creating test user...');
    const createResult = await createUserUseCase.execute({
      email: 'john.doe@example.com',
      name: 'John Doe'
    });

    if (createResult.success) {
      console.log(`✅ User created: ${createResult.user.getName()} (${createResult.user.getEmail()})`);

      // Retrieve the user
      const getUserResult = await getUserUseCase.execute(createResult.user.getId());
      if (getUserResult.success) {
        console.log(`✅ User retrieved: ${getUserResult.user.getName()}`);
      }
    } else {
      console.log('❌ Failed to create user:', createResult.error);
    }

  } catch (error) {
    console.log('❌ Demo failed:', error.message);
  }
}

// Start the application if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startApplication().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { DIContainer, startApplication };

