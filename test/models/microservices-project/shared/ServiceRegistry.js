// Shared Service Registry for microservices discovery
import { EventEmitter } from 'events';

export class ServiceRegistry extends EventEmitter {
  constructor(config = {}) {
    super();
    this.services = new Map();
    this.healthChecks = new Map();
    this.config = {
      healthCheckInterval: config.healthCheckInterval || 30000, // 30 seconds
      healthCheckTimeout: config.healthCheckTimeout || 5000, // 5 seconds
      maxFailures: config.maxFailures || 3
    };
  }

  async registerService(serviceName, instance) {
    const serviceId = `${serviceName}-${instance.host}-${instance.port}`;

    if (!this.services.has(serviceName)) {
      this.services.set(serviceName, new Map());
    }

    this.services.get(serviceName).set(serviceId, {
      ...instance,
      id: serviceId,
      registeredAt: new Date(),
      lastHealthCheck: null,
      status: 'healthy',
      failures: 0
    });

    // Start health checking for this instance
    this.startHealthChecking(serviceName, serviceId);

    this.emit('serviceRegistered', { serviceName, serviceId, instance });
    console.log(`Service registered: ${serviceName} (${serviceId})`);
  }

  async deregisterService(serviceName, serviceId) {
    if (this.services.has(serviceName)) {
      const serviceInstances = this.services.get(serviceName);
      if (serviceInstances.has(serviceId)) {
        serviceInstances.delete(serviceId);

        // Stop health checking
        if (this.healthChecks.has(serviceId)) {
          clearInterval(this.healthChecks.get(serviceId));
          this.healthChecks.delete(serviceId);
        }

        this.emit('serviceDeregistered', { serviceName, serviceId });
        console.log(`Service deregistered: ${serviceName} (${serviceId})`);
      }
    }
  }

  async getServiceInstances(serviceName) {
    const serviceInstances = this.services.get(serviceName);
    if (!serviceInstances) {
      return [];
    }

    return Array.from(serviceInstances.values());
  }

  async getHealthyInstances(serviceName) {
    const instances = await this.getServiceInstances(serviceName);
    return instances.filter(instance => instance.status === 'healthy');
  }

  startHealthChecking(serviceName, serviceId) {
    const interval = setInterval(async () => {
      await this.performHealthCheck(serviceName, serviceId);
    }, this.config.healthCheckInterval);

    this.healthChecks.set(serviceId, interval);
  }

  async performHealthCheck(serviceName, serviceId) {
    try {
      const serviceInstances = this.services.get(serviceName);
      if (!serviceInstances || !serviceInstances.has(serviceId)) {
        return;
      }

      const instance = serviceInstances.get(serviceId);
      const healthUrl = `${instance.protocol}://${instance.host}:${instance.port}/health`;

      const response = await fetch(healthUrl, {
        method: 'GET',
        timeout: this.config.healthCheckTimeout
      });

      if (response.ok) {
        // Health check passed
        instance.status = 'healthy';
        instance.failures = 0;
        instance.lastHealthCheck = new Date();
      } else {
        throw new Error(`Health check failed with status: ${response.status}`);
      }

    } catch (error) {
      const serviceInstances = this.services.get(serviceName);
      if (serviceInstances && serviceInstances.has(serviceId)) {
        const instance = serviceInstances.get(serviceId);
        instance.failures += 1;
        instance.lastHealthCheck = new Date();

        if (instance.failures >= this.config.maxFailures) {
          instance.status = 'unhealthy';
          this.emit('serviceUnhealthy', { serviceName, serviceId, instance });
        }

        console.warn(`Health check failed for ${serviceName} (${serviceId}): ${error.message}`);
      }
    }
  }

  async getAllServices() {
    const result = {};
    for (const [serviceName, instances] of this.services.entries()) {
      result[serviceName] = Array.from(instances.values());
    }
    return result;
  }

  async start() {
    console.log('Service Registry started');
    this.emit('started');
  }

  async stop() {
    // Clear all health check intervals
    for (const interval of this.healthChecks.values()) {
      clearInterval(interval);
    }
    this.healthChecks.clear();
    this.services.clear();

    console.log('Service Registry stopped');
    this.emit('stopped');
  }
}
