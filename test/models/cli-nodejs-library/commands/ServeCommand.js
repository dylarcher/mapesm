// Serve Command - Local development server
import { BaseCommand } from '../lib/BaseCommand.js';
import { DevServer } from '../utils/DevServer.js';

export class ServeCommand extends BaseCommand {
  constructor(config, logger) {
    super('serve', 'Start local development server');
    this.config = config;
    this.logger = logger;

    this.setupCommand();
  }

  setupCommand() {
    this
      .option('-p, --port <number>', 'Port number', '3000')
      .option('-h, --host <address>', 'Host address', 'localhost')
      .option('--https', 'Enable HTTPS', false)
      .option('--open', 'Open browser automatically', false)
      .option('--hot', 'Enable hot module replacement', true)
      .option('--proxy <target>', 'Proxy API requests to target server')
      .example('serve', 'Start server on localhost:3000')
      .example('serve -p 8080 --open', 'Start server on port 8080 and open browser')
      .example('serve --proxy http://localhost:5000', 'Proxy API calls to backend server');
  }

  async run(args, options, globalOptions) {
    const serverConfig = {
      port: parseInt(options.port),
      host: options.host,
      https: options.https,
      open: options.open,
      hot: options.hot,
      proxy: options.proxy
    };

    // Validate port
    if (isNaN(serverConfig.port) || serverConfig.port <= 0 || serverConfig.port > 65535) {
      throw new Error('Port must be a number between 1 and 65535');
    }

    try {
      const server = new DevServer(serverConfig, this.config, this.logger);

      // Setup graceful shutdown
      this.setupGracefulShutdown(server);

      // Start the server
      await server.start();

      this.logger.success('Development server started successfully!');
      this.showServerInfo(server);

      // Keep process alive
      return new Promise(() => { });

    } catch (error) {
      if (error.code === 'EADDRINUSE') {
        this.logger.error(`Port ${serverConfig.port} is already in use`);
        this.logger.info('Try using a different port with --port option');
      } else {
        this.logger.error(`Failed to start server: ${error.message}`);
      }
      throw error;
    }
  }

  setupGracefulShutdown(server) {
    const shutdown = async (signal) => {
      this.logger.info(`\nReceived ${signal}. Shutting down gracefully...`);

      try {
        await server.stop();
        this.logger.info('Server stopped successfully');
        process.exit(0);
      } catch (error) {
        this.logger.error(`Error during shutdown: ${error.message}`);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2')); // nodemon restart
  }

  showServerInfo(server) {
    const { host, port, https } = server.config;
    const protocol = https ? 'https' : 'http';
    const localUrl = `${protocol}://${host}:${port}`;
    const networkUrl = server.getNetworkUrl();

    console.log('\nLocal Development Server:');
    console.log(`  Local:    ${localUrl}`);
    if (networkUrl) {
      console.log(`  Network:  ${networkUrl}`);
    }

    console.log('\nFeatures:');
    console.log(`  Hot Reload: ${server.config.hot ? 'enabled' : 'disabled'}`);
    if (server.config.proxy) {
      console.log(`  API Proxy:  ${server.config.proxy}`);
    }

    console.log('\nPress Ctrl+C to stop the server');
  }
}
