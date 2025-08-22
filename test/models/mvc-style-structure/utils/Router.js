// Router Utility - Simple routing system for MVC application
export class Router {
  constructor() {
    this.routes = {
      GET: new Map(),
      POST: new Map(),
      PUT: new Map(),
      DELETE: new Map(),
      PATCH: new Map()
    };
  }

  get(path, handler) {
    this.addRoute('GET', path, handler);
  }

  post(path, handler) {
    this.addRoute('POST', path, handler);
  }

  put(path, handler) {
    this.addRoute('PUT', path, handler);
  }

  delete(path, handler) {
    this.addRoute('DELETE', path, handler);
  }

  patch(path, handler) {
    this.addRoute('PATCH', path, handler);
  }

  addRoute(method, path, handler) {
    if (!this.routes[method]) {
      throw new Error(`HTTP method ${method} is not supported`);
    }

    const routePattern = this.createRoutePattern(path);
    this.routes[method].set(path, {
      pattern: routePattern,
      handler: handler,
      originalPath: path
    });
  }

  createRoutePattern(path) {
    // Convert route path to regex pattern
    // Example: /users/:id becomes /^\/users\/([^\/]+)$/
    const pattern = path
      .replace(/\//g, '\\/')
      .replace(/:\w+/g, '([^\\/]+)');
    return new RegExp(`^${pattern}$`);
  }

  async handleRequest(method, path, req, res) {
    const routes = this.routes[method];
    if (!routes) {
      return this.sendNotFound(res);
    }

    for (const [routePath, route] of routes.entries()) {
      const match = route.pattern.exec(path);
      if (match) {
        // Extract route parameters
        req.params = this.extractParams(route.originalPath, match);

        try {
          await route.handler(req, res);
          return;
        } catch (error) {
          return this.sendServerError(res, error);
        }
      }
    }

    return this.sendNotFound(res);
  }

  extractParams(routePath, match) {
    const params = {};
    const pathSegments = routePath.split('/');

    let paramIndex = 1; // match[0] is the full match
    for (const segment of pathSegments) {
      if (segment.startsWith(':')) {
        const paramName = segment.substring(1);
        params[paramName] = match[paramIndex];
        paramIndex++;
      }
    }

    return params;
  }

  sendNotFound(res) {
    res.status(404).json({
      success: false,
      message: 'Route not found',
      error: {
        code: 'ROUTE_NOT_FOUND',
        details: 'The requested route does not exist'
      }
    });
  }

  sendServerError(res, error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
      }
    });
  }

  getRegisteredRoutes() {
    const allRoutes = [];
    for (const [method, routes] of Object.entries(this.routes)) {
      for (const [path, route] of routes.entries()) {
        allRoutes.push({
          method,
          path: route.originalPath,
          pattern: route.pattern.toString()
        });
      }
    }
    return allRoutes;
  }
}
