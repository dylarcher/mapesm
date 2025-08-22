// Circular dependency example - ModuleB depends on ModuleA
const ModuleA = require('./moduleA');

class ModuleB {
  constructor() {
    this.name = 'ModuleB';
    this.moduleA = null;
  }

  setModuleA(moduleA) {
    this.moduleA = moduleA;
  }

  process(data) {
    console.log(`ModuleB processing: ${data}`);
    if (this.moduleA) {
      return this.moduleA.processFromB(`Hello from ${this.name}`);
    }
    return `ModuleB processed: ${data}`;
  }

  callModuleA() {
    if (this.moduleA) {
      return this.moduleA.processFromB(`Message from ${this.name}`);
    }
    return null;
  }
}

module.exports = ModuleB;
