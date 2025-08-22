// Serverless Function Simulator
// This simulates a serverless runtime environment

const userFunctions = require('./functions/userFunctions');
const eventFunctions = require('./functions/eventFunctions');

class ServerlessSimulator {
  constructor() {
    this.functions = new Map();
    this.eventQueue = [];
    this.metrics = {
      invocations: 0,
      coldStarts: 0,
      totalExecutionTime: 0,
      errors: 0
    };

    this.registerFunctions();
  }

  registerFunctions() {
    // HTTP Functions
    this.functions.set('createUser', {
      handler: userFunctions.createUser,
      trigger: 'http',
      method: 'POST',
      path: '/users',
      timeout: 30000,
      memory: 128
    });

    this.functions.set('getUser', {
      handler: userFunctions.getUser,
      trigger: 'http',
      method: 'GET',
      path: '/users/{id}',
      timeout: 10000,
      memory: 128
    });

    this.functions.set('listUsers', {
      handler: userFunctions.listUsers,
      trigger: 'http',
      method: 'GET',
      path: '/users',
      timeout: 15000,
      memory: 128
    });

    this.functions.set('updateUser', {
      handler: userFunctions.updateUser,
      trigger: 'http',
      method: 'PUT',
      path: '/users/{id}',
      timeout: 20000,
      memory: 128
    });

    this.functions.set('deleteUser', {
      handler: userFunctions.deleteUser,
      trigger: 'http',
      method: 'DELETE',
      path: '/users/{id}',
      timeout: 15000,
      memory: 128
    });

    // Event-driven Functions
    this.functions.set('onUserCreated', {
      handler: eventFunctions.onUserCreated,
      trigger: 'event',
      eventSource: 'user-service',
      eventType: 'user.created',
      timeout: 30000,
      memory: 256
    });

    this.functions.set('processDataFile', {
      handler: eventFunctions.processDataFile,
      trigger: 'storage',
      bucket: 'data-bucket',
      timeout: 300000, // 5 minutes
      memory: 512
    });

    this.functions.set('scheduledCleanup', {
      handler: eventFunctions.scheduledCleanup,
      trigger: 'schedule',
      schedule: '0 0 * * *', // Daily at midnight
      timeout: 600000, // 10 minutes
      memory: 256
    });

    this.functions.set('getAnalytics', {
      handler: eventFunctions.getAnalytics,
      trigger: 'http',
      method: 'GET',
      path: '/analytics',
      timeout: 30000,
      memory: 256
    });

    console.log(`📋 Registered ${this.functions.size} serverless functions`);
  }

  async invoke(functionName, event = {}, context = {}) {
    const startTime = Date.now();

    console.log(`\n🚀 INVOKING FUNCTION: ${functionName}`);
    console.log('='.repeat(50));

    const func = this.functions.get(functionName);
    if (!func) {
      throw new Error(`Function '${functionName}' not found`);
    }

    // Simulate cold start (random chance)
    const isColdStart = Math.random() < 0.3;
    if (isColdStart) {
      console.log('🥶 COLD START - Initializing function runtime...');
      await this.simulateDelay(500, 1500); // Cold start delay
      this.metrics.coldStarts++;
    }

    // Create execution context
    const executionContext = {
      functionName,
      functionVersion: '1.0',
      invocationId: this.generateInvocationId(),
      startTime: new Date(),
      timeout: func.timeout,
      memoryLimit: func.memory,
      ...context
    };

    this.metrics.invocations++;

    try {
      // Set timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Function timeout')), func.timeout);
      });

      // Execute function
      const executionPromise = func.handler(event, executionContext);

      const result = await Promise.race([executionPromise, timeoutPromise]);

      const executionTime = Date.now() - startTime;
      this.metrics.totalExecutionTime += executionTime;

      console.log(`✅ Function completed in ${executionTime}ms`);
      console.log('📤 Response:', JSON.stringify(result, null, 2));

      // Log metrics
      this.logInvocationMetrics(functionName, executionTime, isColdStart, 'success');

      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.metrics.errors++;

      console.error(`❌ Function failed after ${executionTime}ms:`, error.message);

      this.logInvocationMetrics(functionName, executionTime, isColdStart, 'error');

      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Function execution failed',
          message: error.message
        })
      };
    }
  }

  async simulateHttpRequest(method, path, body = null, queryParams = {}) {
    // Find matching function
    let matchingFunction = null;
    let pathParameters = {};

    for (const [name, func] of this.functions.entries()) {
      if (func.trigger === 'http' && func.method === method) {
        const match = this.matchPath(func.path, path);
        if (match.matches) {
          matchingFunction = name;
          pathParameters = match.parameters;
          break;
        }
      }
    }

    if (!matchingFunction) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Not Found' })
      };
    }

    // Create HTTP event
    const event = {
      httpMethod: method,
      path,
      pathParameters,
      queryStringParameters: queryParams,
      body: body ? JSON.stringify(body) : null,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ServerlessSimulator/1.0'
      }
    };

    return await this.invoke(matchingFunction, event);
  }

  async simulateEvent(eventType, eventData) {
    // Find functions that handle this event type
    const matchingFunctions = [];

    for (const [name, func] of this.functions.entries()) {
      if (func.trigger === 'event' && func.eventType === eventType) {
        matchingFunctions.push(name);
      }
    }

    const results = [];

    for (const functionName of matchingFunctions) {
      const event = {
        source: eventType.split('.')[0],
        'detail-type': eventType,
        detail: eventData,
        time: new Date().toISOString()
      };

      const result = await this.invoke(functionName, event);
      results.push({ function: functionName, result });
    }

    return results;
  }

  async simulateScheduledFunction(functionName) {
    const event = {
      source: 'aws.events',
      'detail-type': 'Scheduled Event',
      detail: {
        scheduledTime: new Date().toISOString()
      }
    };

    return await this.invoke(functionName, event);
  }

  async simulateFileUpload(fileName, fileSize) {
    const event = {
      Records: [{
        eventSource: 'aws:s3',
        eventName: 'ObjectCreated:Put',
        s3: {
          bucket: { name: 'data-bucket' },
          object: {
            key: fileName,
            size: fileSize
          }
        }
      }]
    };

    return await this.invoke('processDataFile', event);
  }

  matchPath(template, actual) {
    const templateParts = template.split('/');
    const actualParts = actual.split('/');

    if (templateParts.length !== actualParts.length) {
      return { matches: false, parameters: {} };
    }

    const parameters = {};

    for (let i = 0; i < templateParts.length; i++) {
      const templatePart = templateParts[i];
      const actualPart = actualParts[i];

      if (templatePart.startsWith('{') && templatePart.endsWith('}')) {
        // Path parameter
        const paramName = templatePart.slice(1, -1);
        parameters[paramName] = actualPart;
      } else if (templatePart !== actualPart) {
        return { matches: false, parameters: {} };
      }
    }

    return { matches: true, parameters };
  }

  generateInvocationId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async simulateDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  logInvocationMetrics(functionName, executionTime, isColdStart, status) {
    console.log(`📊 METRICS: ${functionName}`);
    console.log(`   - Execution Time: ${executionTime}ms`);
    console.log(`   - Cold Start: ${isColdStart ? 'Yes' : 'No'}`);
    console.log(`   - Status: ${status}`);
  }

  getMetrics() {
    const avgExecutionTime = this.metrics.invocations > 0
      ? this.metrics.totalExecutionTime / this.metrics.invocations
      : 0;

    return {
      ...this.metrics,
      averageExecutionTime: Math.round(avgExecutionTime),
      errorRate: this.metrics.invocations > 0
        ? ((this.metrics.errors / this.metrics.invocations) * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  listFunctions() {
    return Array.from(this.functions.entries()).map(([name, func]) => ({
      name,
      trigger: func.trigger,
      method: func.method || null,
      path: func.path || null,
      eventType: func.eventType || null,
      timeout: func.timeout,
      memory: func.memory
    }));
  }
}

module.exports = ServerlessSimulator;
