// Web Server - Frameworks & Drivers Layer
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

export class WebServer {
  constructor(userController, config) {
    this.app = express();
    this.userController = userController;
    this.config = config;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"]
        }
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: this.config.corsOrigins || ['http://localhost:3000'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: this.config.rateLimitWindow || 15 * 60 * 1000, // 15 minutes
      max: this.config.rateLimitMax || 100, // limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests',
        message: 'Please try again later'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({
      limit: '10mb',
      strict: true,
      type: 'application/json'
    }));

    this.app.use(express.urlencoded({
      extended: true,
      limit: '10mb',
      parameterLimit: 20
    }));

    // Request logging middleware
    this.app.use(this.requestLogger.bind(this));

    // Health check endpoint
    this.app.get('/health', this.healthCheck.bind(this));
    this.app.get('/api/health', this.healthCheck.bind(this));
  }

  setupRoutes() {
    // API version prefix
    const apiRouter = express.Router();

    // User routes
    const userRouter = express.Router();
    this.userController.registerRoutes(userRouter);
    apiRouter.use('/users', userRouter);

    // Mount API router
    this.app.use('/api/v1', apiRouter);

    // API documentation
    this.app.get('/api/docs', this.getApiDocumentation.bind(this));

    // Catch-all for undefined routes
    this.app.use('*', this.notFoundHandler.bind(this));
  }

  setupErrorHandling() {
    // Global error handler
    this.app.use(this.errorHandler.bind(this));

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // Application specific logging, throwing an error, or other logic here
    });

    // Uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
    process.on('SIGINT', this.gracefulShutdown.bind(this));
  }

  // Middleware functions
  requestLogger(req, res, next) {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const logData = {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        timestamp: new Date().toISOString()
      };

      console.log('Request:', JSON.stringify(logData));
    });

    next();
  }

  healthCheck(req, res) {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: this.config.version || '1.0.0',
      environment: this.config.environment || 'development',
      memory: process.memoryUsage(),
      nodeVersion: process.version
    };

    res.status(200).json(healthData);
  }

  getApiDocumentation(req, res) {
    const docs = {
      title: 'User Management API',
      version: '1.0.0',
      description: 'RESTful API for user management following Clean Architecture principles',
      baseUrl: '/api/v1',
      endpoints: this.userController.userPresenter.getApiDocumentation().endpoints,
      examples: {
        createUser: {
          method: 'POST',
          url: '/api/v1/users',
          body: {
            email: 'john.doe@example.com',
            name: 'John Doe'
          }
        },
        getUser: {
          method: 'GET',
          url: '/api/v1/users/{id}'
        },
        getUsers: {
          method: 'GET',
          url: '/api/v1/users?limit=10&offset=0'
        }
      },
      errorCodes: {
        400: 'Bad Request - Validation error',
        404: 'Not Found - Resource not found',
        429: 'Too Many Requests - Rate limit exceeded',
        500: 'Internal Server Error'
      }
    };

    res.status(200).json(docs);
  }

  notFoundHandler(req, res) {
    res.status(404).json({
      success: false,
      error: 'Not Found',
      message: `The requested endpoint ${req.method} ${req.path} was not found`,
      meta: {
        timestamp: new Date().toISOString(),
        availableEndpoints: [
          'GET /health',
          'GET /api/health',
          'GET /api/docs',
          'GET /api/v1/users',
          'POST /api/v1/users',
          'GET /api/v1/users/:id',
          'PUT /api/v1/users/:id',
          'DELETE /api/v1/users/:id'
        ]
      }
    });
  }

  errorHandler(error, req, res, next) {
    // Log error
    console.error('Application Error:', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    // Send error response
    const isDevelopment = this.config.environment === 'development';

    res.status(error.status || 500).json({
      success: false,
      error: error.name || 'Internal Server Error',
      message: error.message || 'An unexpected error occurred',
      ...(isDevelopment && { stack: error.stack }),
      meta: {
        timestamp: new Date().toISOString(),
        errorId: this.generateErrorId()
      }
    });
  }

  generateErrorId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Server lifecycle
  start() {
    const port = this.config.port || 3000;
    const host = this.config.host || 'localhost';

    this.server = this.app.listen(port, host, () => {
      console.log(`Server started on ${host}:${port}`);
      console.log(`Health check: http://${host}:${port}/health`);
      console.log(`API documentation: http://${host}:${port}/api/docs`);
      console.log(`Environment: ${this.config.environment || 'development'}`);
    });

    this.server.on('error', (error) => {
      console.error('Server error:', error);
    });

    return this.server;
  }

  async stop() {
    if (this.server) {
      console.log('Stopping server...');

      return new Promise((resolve, reject) => {
        this.server.close((error) => {
          if (error) {
            console.error('Error stopping server:', error);
            reject(error);
          } else {
            console.log('Server stopped');
            resolve();
          }
        });
      });
    }
  }

  async gracefulShutdown() {
    console.log('Received shutdown signal, starting graceful shutdown...');

    try {
      await this.stop();
      process.exit(0);
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  // Utility methods
  getApp() {
    return this.app;
  }

  getServer() {
    return this.server;
  }

  isRunning() {
    return !!this.server && this.server.listening;
  }

  getAddress() {
    if (this.server && this.server.listening) {
      const address = this.server.address();
      return typeof address === 'string' ? address : `${address.address}:${address.port}`;
    }
    return null;
  }
}
