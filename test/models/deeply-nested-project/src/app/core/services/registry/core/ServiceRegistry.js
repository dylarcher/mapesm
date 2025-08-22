// Service Registry for Dependency Injection
class ServiceRegistry {
  constructor() {
    this.services = new Map();
  }

  register(name, service) {
    this.services.set(name, service);
  }

  resolve(name) {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service '${name}' not found in registry`);
    }
    return service;
  }

  has(name) {
    return this.services.has(name);
  }

  getAll() {
    return Array.from(this.services.keys());
  }
}

module.exports = ServiceRegistry;
