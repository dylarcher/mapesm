// Example of a circular dependency in action
const ModuleA = require('./moduleA');

// This demonstrates the circular dependency issue
console.log('=== Circular Dependency Demo ===');

try {
  const moduleA = new ModuleA();
  moduleA.initialize();

  console.log('ModuleA calling ModuleB:');
  const result = moduleA.callModuleB();
  console.log('Result:', result);

} catch (error) {
  console.error('Circular dependency error:', error.message);
}

// Alternative approach using dependency injection to break circular dependency
class Container {
  constructor() {
    this.modules = {};
  }

  register(name, moduleClass) {
    this.modules[name] = moduleClass;
  }

  resolve(name) {
    const ModuleClass = this.modules[name];
    if (!ModuleClass) {
      throw new Error(`Module ${name} not found`);
    }
    return new ModuleClass(this);
  }
}

// Better approach - breaking circular dependency
class ImprovedModuleA {
  constructor(container) {
    this.name = 'ImprovedModuleA';
    this.container = container;
  }

  callModuleB() {
    const moduleB = this.container.resolve('ModuleBImproved');
    return moduleB.process(`Hello from ${this.name}`);
  }
}

class ImprovedModuleB {
  constructor(container) {
    this.name = 'ImprovedModuleB';
    this.container = container;
  }

  process(data) {
    console.log(`ImprovedModuleB processing: ${data}`);
    return `ImprovedModuleB processed: ${data}`;
  }
}

// Demonstrate improved approach
console.log('\n=== Improved Approach (No Circular Dependency) ===');
const container = new Container();
container.register('ModuleAImproved', ImprovedModuleA);
container.register('ModuleBImproved', ImprovedModuleB);

const improvedA = container.resolve('ModuleAImproved');
const result = improvedA.callModuleB();
console.log('Result:', result);
