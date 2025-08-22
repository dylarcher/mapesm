// MVC Application Entry Point
import { ProductController } from './controllers/ProductController.js';
import { UserController } from './controllers/UserController.js';
import { AuthService } from './services/AuthService.js';
import { Database } from './services/Database.js';
import { Router } from './utils/Router.js';

export class MVCApp {
  constructor() {
    this.database = new Database();
    this.authService = new AuthService();
    this.router = new Router();
    this.setupRoutes();
  }

  setupRoutes() {
    const userController = new UserController(this.authService, this.database);
    const productController = new ProductController(this.database);

    // User routes
    this.router.get('/users', userController.index.bind(userController));
    this.router.get('/users/:id', userController.show.bind(userController));
    this.router.post('/users', userController.create.bind(userController));
    this.router.put('/users/:id', userController.update.bind(userController));
    this.router.delete('/users/:id', userController.destroy.bind(userController));

    // Product routes
    this.router.get('/products', productController.index.bind(productController));
    this.router.get('/products/:id', productController.show.bind(productController));
    this.router.post('/products', productController.create.bind(productController));

    // Auth routes
    this.router.post('/auth/login', userController.login.bind(userController));
    this.router.post('/auth/logout', userController.logout.bind(userController));
  }

  async start(port = 3000) {
    await this.database.connect();
    console.log(`MVC Application running on port ${port}`);
    return this.router;
  }
}
