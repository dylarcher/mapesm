// REST API Server Entry Point
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Import middleware
import { auth } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './middleware/logger.js';

// Import routes
import { authRoutes } from './routes/authRoutes.js';
import { healthRoutes } from './routes/healthRoutes.js';
import { orderRoutes } from './routes/orderRoutes.js';
import { productRoutes } from './routes/productRoutes.js';
import { userRoutes } from './routes/userRoutes.js';

// Import services
import { CacheService } from './services/CacheService.js';
import { ConfigService } from './services/ConfigService.js';
import { DatabaseService } from './services/DatabaseService.js';

export class ApiServer {
  constructor() {
    this.app = express();
    this.config = new ConfigService();
    this.database = new DatabaseService();
    this.cache = new CacheService();

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet());

    // CORS configuration
    this.app.use(cors({
      origin: this.config.get('cors.origin', '*'),
      credentials: true,
      optionsSuccessStatus: 200
    }));

    // Compression
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: this.config.get('rateLimit.windowMs', 15 * 60 * 1000), // 15 minutes
      max: this.config.get('rateLimit.max', 100), // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.'
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use(logger);

    // Health check endpoint (no auth required)
    this.app.use('/health', healthRoutes);
  }

  setupRoutes() {
    const apiRouter = express.Router();

    // Public routes
    apiRouter.use('/auth', authRoutes);

    // Protected routes (require authentication)
    apiRouter.use(auth);
    apiRouter.use('/users', userRoutes);
    apiRouter.use('/products', productRoutes);
    apiRouter.use('/orders', orderRoutes);

    // Mount API routes
    this.app.use('/api/v1', apiRouter);

    // API documentation route
    this.app.get('/api/docs', (req, res) => {
      res.json({
        title: 'REST API Documentation',
        version: '1.0.0',
        endpoints: this.getEndpoints()
      });
    });

    // 404 handler for unknown routes
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl
      });
    });
  }

  setupErrorHandling() {
    this.app.use(errorHandler);
  }

  getEndpoints() {
    return [
      { method: 'GET', path: '/health', description: 'Health check' },
      { method: 'POST', path: '/api/v1/auth/login', description: 'User login' },
      { method: 'POST', path: '/api/v1/auth/register', description: 'User registration' },
      { method: 'GET', path: '/api/v1/users', description: 'Get all users' },
      { method: 'GET', path: '/api/v1/users/:id', description: 'Get user by ID' },
      { method: 'PUT', path: '/api/v1/users/:id', description: 'Update user' },
      { method: 'DELETE', path: '/api/v1/users/:id', description: 'Delete user' },
      { method: 'GET', path: '/api/v1/products', description: 'Get all products' },
      { method: 'POST', path: '/api/v1/products', description: 'Create product' },
      { method: 'GET', path: '/api/v1/products/:id', description: 'Get product by ID' },
      { method: 'PUT', path: '/api/v1/products/:id', description: 'Update product' },
      { method: 'DELETE', path: '/api/v1/products/:id', description: 'Delete product' },
      { method: 'GET', path: '/api/v1/orders', description: 'Get user orders' },
      { method: 'POST', path: '/api/v1/orders', description: 'Create order' },
      { method: 'GET', path: '/api/v1/orders/:id', description: 'Get order by ID' }
    ];
  }

  async start(port = 3000) {
    try {
      // Connect to database
      await this.database.connect();
      console.log('Database connected successfully');

      // Connect to cache
      await this.cache.connect();
      console.log('Cache connected successfully');

      // Start server
      this.server = this.app.listen(port, () => {
        console.log(`REST API server running on port ${port}`);
        console.log(`API Documentation: http://localhost:${port}/api/docs`);
        console.log(`Health Check: http://localhost:${port}/health`);
      });

      // Graceful shutdown handling
      this.setupGracefulShutdown();

    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(`Received ${signal}. Starting graceful shutdown...`);

      if (this.server) {
        this.server.close(async () => {
          console.log('HTTP server closed');

          try {
            await this.database.disconnect();
            await this.cache.disconnect();
            console.log('All connections closed successfully');
            process.exit(0);
          } catch (error) {
            console.error('Error during shutdown:', error);
            process.exit(1);
          }
        });
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }
}
