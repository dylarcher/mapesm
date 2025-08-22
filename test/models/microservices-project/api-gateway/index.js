// API Gateway - Central routing and authentication
import { EventEmitter } from 'events';
import { AuthClient } from '../shared/AuthClient.js';
import { LoadBalancer } from '../shared/LoadBalancer.js';
import { RateLimiter } from '../shared/RateLimiter.js';
import { ServiceRegistry } from '../shared/ServiceRegistry.js';

export class ApiGateway extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = config;
    this.serviceRegistry = new ServiceRegistry();
    this.authClient = new AuthClient();
    this.loadBalancer = new LoadBalancer();
    this.rateLimiter = new RateLimiter();

    this.routes = new Map();
    this.middleware = [];

    this.setupRoutes();
  }

  setupRoutes() {
    // User service routes
    this.registerRoute('/api/users', 'user-service', {
      authentication: true,
      rateLimit: { requests: 100, window: '15m' }
    });

    // Auth service routes
    this.registerRoute('/api/auth', 'auth-service', {
      authentication: false,
      rateLimit: { requests: 20, window: '15m' }
    });

    // Product service routes
    this.registerRoute('/api/products', 'product-service', {
      authentication: false,
      rateLimit: { requests: 200, window: '15m' }
    });

    // Order service routes
    this.registerRoute('/api/orders', 'order-service', {
      authentication: true,
      rateLimit: { requests: 50, window: '15m' }
    });
  }

  registerRoute(pattern, serviceName, options = {}) {
    this.routes.set(pattern, {
      serviceName,
      options,
      pattern: new RegExp(`^${pattern.replace('*', '.*')}`)
    });
  }

  async handleRequest(req, res) {
    try {
      // Apply rate limiting
      const rateLimitResult = await this.rateLimiter.checkLimit(req);
      if (!rateLimitResult.allowed) {
        return this.sendError(res, 429, 'Rate limit exceeded');
      }

      // Find matching route
      const route = this.findRoute(req.path);
      if (!route) {
        return this.sendError(res, 404, 'Route not found');
      }

      // Apply authentication if required
      if (route.options.authentication) {
        const authResult = await this.authClient.validateToken(req.headers.authorization);
        if (!authResult.valid) {
          return this.sendError(res, 401, 'Authentication failed');
        }
        req.user = authResult.user;
      }

      // Get service instance
      const serviceInstances = await this.serviceRegistry.getHealthyInstances(route.serviceName);
      if (serviceInstances.length === 0) {
        return this.sendError(res, 503, 'Service unavailable');
      }

      // Load balance request
      const selectedInstance = this.loadBalancer.selectInstance(serviceInstances, req);

      // Proxy request to service
      const response = await this.proxyRequest(req, selectedInstance);

      // Forward response
      res.status(response.status).json(response.data);

    } catch (error) {
      console.error('Gateway error:', error);
      this.sendError(res, 500, 'Internal gateway error');
    }
  }

  findRoute(path) {
    for (const [pattern, route] of this.routes.entries()) {
      if (route.pattern.test(path)) {
        return route;
      }
    }
    return null;
  }

  async proxyRequest(req, serviceInstance) {
    const serviceUrl = `${serviceInstance.protocol}://${serviceInstance.host}:${serviceInstance.port}`;

    // Implement HTTP client logic to forward request
    const response = await fetch(`${serviceUrl}${req.path}`, {
      method: req.method,
      headers: {
        ...req.headers,
        'x-gateway-request-id': this.generateRequestId(),
        'x-forwarded-for': req.ip,
        'x-forwarded-proto': req.protocol
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });

    return {
      status: response.status,
      data: await response.json()
    };
  }

  sendError(res, status, message) {
    res.status(status).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  generateRequestId() {
    return `gw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async start(port = 3000) {
    // Start service discovery
    await this.serviceRegistry.start();

    console.log(`API Gateway started on port ${port}`);
    this.emit('started', { port });
  }
}
