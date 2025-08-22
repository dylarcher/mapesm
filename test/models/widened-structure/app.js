// Widened Structure Demo - Main Application
// This architecture spreads functionality horizontally across feature modules
// Each feature is self-contained and loosely coupled

const path = require('path');
const fs = require('fs');

// Module registry for managing feature modules
class ModuleRegistry {
  constructor() {
    this.modules = new Map();
    this.middleware = [];
    this.routes = new Map();
  }

  register(name, module) {
    if (this.modules.has(name)) {
      throw new Error(`Module '${name}' is already registered`);
    }

    console.log(`📦 Registering module: ${name}`);
    this.modules.set(name, module);

    // Auto-register routes if provided
    if (module.routes) {
      Object.entries(module.routes).forEach(([path, handler]) => {
        this.routes.set(`/${name}${path}`, handler);
        console.log(`  └─ Route: /${name}${path}`);
      });
    }

    // Auto-register middleware if provided
    if (module.middleware) {
      this.middleware.push({ name, middleware: module.middleware });
      console.log(`  └─ Middleware registered`);
    }
  }

  get(name) {
    return this.modules.get(name);
  }

  getAll() {
    return Array.from(this.modules.entries());
  }

  getRoutes() {
    return this.routes;
  }

  getMiddleware() {
    return this.middleware;
  }

  async initializeAll() {
    console.log('\n🚀 Initializing all modules...');

    for (const [name, module] of this.modules.entries()) {
      try {
        if (module.initialize && typeof module.initialize === 'function') {
          await module.initialize();
          console.log(`  ✅ ${name} initialized`);
        }
      } catch (error) {
        console.error(`  ❌ Failed to initialize ${name}:`, error.message);
      }
    }
  }

  async shutdownAll() {
    console.log('\n🔄 Shutting down modules...');

    for (const [name, module] of this.modules.entries()) {
      try {
        if (module.shutdown && typeof module.shutdown === 'function') {
          await module.shutdown();
          console.log(`  ✅ ${name} shut down`);
        }
      } catch (error) {
        console.error(`  ❌ Failed to shutdown ${name}:`, error.message);
      }
    }
  }
}

// Simple HTTP server to demonstrate the architecture
class WidenedApp {
  constructor() {
    this.registry = new ModuleRegistry();
    this.server = null;
    this.config = {
      port: process.env.PORT || 3000,
      env: process.env.NODE_ENV || 'development'
    };
  }

  // Auto-discover and load feature modules
  async loadModules() {
    console.log('🔍 Loading feature modules...\n');

    const featuresDir = path.join(__dirname, 'features');

    if (!fs.existsSync(featuresDir)) {
      console.log('ℹ️ No features directory found, creating structure...');
      return;
    }

    try {
      const featureNames = fs.readdirSync(featuresDir)
        .filter(item => fs.statSync(path.join(featuresDir, item)).isDirectory());

      for (const featureName of featureNames) {
        try {
          const featurePath = path.join(featuresDir, featureName, 'index.js');

          if (fs.existsSync(featurePath)) {
            const featureModule = require(featurePath);
            this.registry.register(featureName, featureModule);
          } else {
            console.log(`⚠️ Feature '${featureName}' has no index.js file`);
          }
        } catch (error) {
          console.error(`❌ Failed to load feature '${featureName}':`, error.message);
        }
      }
    } catch (error) {
      console.error('❌ Error loading modules:', error.message);
    }
  }

  // Simple HTTP request handler
  handleRequest(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    // Apply middleware
    const middlewares = this.registry.getMiddleware();
    for (const { name, middleware } of middlewares) {
      try {
        middleware(req, res);
      } catch (error) {
        console.error(`Middleware error in ${name}:`, error.message);
      }
    }

    // Route handling
    const routes = this.registry.getRoutes();

    if (routes.has(pathname)) {
      try {
        const handler = routes.get(pathname);
        handler(req, res);
      } catch (error) {
        this.sendError(res, 500, 'Internal Server Error');
      }
    } else if (pathname === '/') {
      this.sendHomePage(res);
    } else if (pathname === '/health') {
      this.sendHealth(res);
    } else {
      this.sendError(res, 404, 'Not Found');
    }
  }

  sendHomePage(res) {
    const modules = this.registry.getAll();
    const routes = Array.from(this.registry.getRoutes().keys());

    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Widened Structure Demo</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .module { background: #e8f4fd; padding: 15px; margin: 10px 0; border-radius: 4px; }
        .route { background: #f0f8f0; padding: 8px; margin: 5px 0; border-radius: 4px; font-family: monospace; }
        h1 { color: #333; }
        h2 { color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏗️ Widened Structure Demo</h1>
        <p>This application demonstrates horizontal/widened architecture where features are organized as independent modules.</p>

        <h2>📦 Loaded Modules (${modules.length})</h2>
        ${modules.map(([name, module]) => `
            <div class="module">
                <strong>${name}</strong> - ${module.description || 'Feature module'}
                ${module.version ? `<br><small>Version: ${module.version}</small>` : ''}
            </div>
        `).join('')}

        <h2>🛣️ Available Routes (${routes.length})</h2>
        ${routes.map(route => `
            <div class="route">
                <a href="${route}">${route}</a>
            </div>
        `).join('')}

        <h2>🔗 System Routes</h2>
        <div class="route"><a href="/">/ - This homepage</a></div>
        <div class="route"><a href="/health">/health - System health check</a></div>

        <h2>🏛️ Architecture Benefits</h2>
        <ul>
            <li><strong>Horizontal Scaling</strong> - Add features without touching existing code</li>
            <li><strong>Team Independence</strong> - Teams can work on separate features</li>
            <li><strong>Feature Isolation</strong> - Each feature is self-contained</li>
            <li><strong>Plugin Architecture</strong> - Easy to add/remove features</li>
            <li><strong>Microservices Ready</strong> - Features can be extracted to separate services</li>
        </ul>
    </div>
</body>
</html>`;

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  sendHealth(res) {
    const modules = this.registry.getAll();
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      modules: modules.map(([name, module]) => ({
        name,
        status: 'loaded',
        version: module.version || 'unknown'
      }))
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(health, null, 2));
  }

  sendError(res, status, message) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: message, status }));
  }

  async start() {
    console.log('=== Widened Structure Demo Application ===\n');

    // Load all feature modules
    await this.loadModules();

    // Initialize all modules
    await this.registry.initializeAll();

    // Start HTTP server
    const http = require('http');

    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    this.server.listen(this.config.port, () => {
      console.log(`\n🌟 Widened Structure Demo running on port ${this.config.port}`);
      console.log(`📱 Open http://localhost:${this.config.port} in your browser`);
      console.log('\n🏗️ Architecture: Features spread horizontally as independent modules');
      console.log('✨ Each feature can be developed, tested, and deployed independently\n');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  async shutdown() {
    console.log('\n🛑 Shutting down application...');

    if (this.server) {
      this.server.close();
    }

    await this.registry.shutdownAll();
    process.exit(0);
  }

  async runDemo() {
    console.log('=== Widened Structure Architecture Demo ===\n');
    console.log('This architecture demonstrates horizontal organization where:');
    console.log('- Features are spread across independent modules');
    console.log('- Each module is self-contained with its own logic');
    console.log('- Modules can be added/removed without affecting others');
    console.log('- Perfect for team-based development\n');

    // Load modules for demo
    await this.loadModules();

    console.log('📊 Demo Statistics:');
    console.log(`  • Loaded modules: ${this.registry.modules.size}`);
    console.log(`  • Registered routes: ${this.registry.routes.size}`);
    console.log(`  • Middleware count: ${this.registry.middleware.length}`);

    console.log('\n🔍 Module Details:');
    for (const [name, module] of this.registry.getAll()) {
      console.log(`  📦 ${name}:`);
      console.log(`     Description: ${module.description || 'No description'}`);
      console.log(`     Version: ${module.version || 'unknown'}`);

      if (module.routes) {
        const routeCount = Object.keys(module.routes).length;
        console.log(`     Routes: ${routeCount}`);
      }

      if (module.dependencies) {
        console.log(`     Dependencies: ${module.dependencies.join(', ')}`);
      }
      console.log('');
    }

    console.log('✅ Demo completed! Run with --start to launch the web server.');
  }
}

// Application startup
async function main() {
  const app = new WidenedApp();

  const args = process.argv.slice(2);

  if (args.includes('--demo')) {
    await app.runDemo();
  } else {
    await app.start();
  }
}

// Run if this is the main module
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Application error:', error);
    process.exit(1);
  });
}

module.exports = { WidenedApp, ModuleRegistry };
