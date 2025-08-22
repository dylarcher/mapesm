// Circular dependency example - ModuleA depends on ModuleB
const ModuleB = require('./moduleB');

class ModuleA {
  constructor() {
    this.name = 'ModuleA';
    this.moduleB = null;
  }

  initialize() {
    // This creates a circular dependency
    this.moduleB = new ModuleB();
    this.moduleB.setModuleA(this);
  }

  callModuleB() {
    if (this.moduleB) {
      return this.moduleB.process(`Hello from ${this.name}`);
    }
    return null;
  }

  processFromB(data) {
    console.log(`ModuleA processing: ${data}`);
    return `ModuleA processed: ${data}`;
  }
}

module.exports = ModuleA;
