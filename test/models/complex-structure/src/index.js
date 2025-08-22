const express = require('express');
const config = require('./config/app.config');
const Database = require('./core/database/DatabaseManager');
const Logger = require('./core/logging/Logger');
const AuthService = require('./modules/auth/services/AuthService');
const UserController = require('./modules/user/controllers/UserController');
const ProductController = require('./modules/product/controllers/ProductController');
const OrderController = require('./modules/order/controllers/OrderController');
const errorHandler = require('./shared/middleware/errorHandler');
const rateLimiter = require('./shared/middleware/rateLimiter');

class Application {
  constructor() {
    this.app = express();
    this.logger = new Logger();
    this.database = new Database(config.database);
    this.authService = new AuthService();
  }

  async initialize() {
    await this.database.connect();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(rateLimiter);
  }

  setupRoutes() {
    const userController = new UserController(this.authService);
    const productController = new ProductController();
    const orderController = new OrderController();

    this.app.use('/api/users', userController.router);
    this.app.use('/api/products', productController.router);
    this.app.use('/api/orders', orderController.router);
  }

  setupErrorHandling() {
    this.app.use(errorHandler);
  }

  start() {
    const port = config.server.port || 3000;
    this.app.listen(port, () => {
      this.logger.info(`Server running on port ${port}`);
    });
  }
}

// Initialize and start the application
const app = new Application();
app.initialize().then(() => {
  app.start();
}).catch(error => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
