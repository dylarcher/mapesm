// Query Handler - CQRS Pattern Implementation
class QueryHandler {
  constructor() {
    this.handlers = new Map();
    this.readModels = new Map();
  }

  register(queryName, handler) {
    this.handlers.set(queryName, handler);
    console.log(`🔍 Registered query handler: ${queryName}`);
  }

  async execute(queryName, queryParams = {}) {
    const handler = this.handlers.get(queryName);
    if (!handler) {
      throw new Error(`No handler found for query: ${queryName}`);
    }

    console.log(`🔍 Executing query: ${queryName}`);

    const result = await handler(queryParams);
    return result;
  }

  updateReadModel(modelName, data) {
    if (!this.readModels.has(modelName)) {
      this.readModels.set(modelName, []);
    }

    const model = this.readModels.get(modelName);
    model.push(data);

    console.log(`📊 Updated read model: ${modelName}`);
  }

  getReadModel(modelName) {
    return this.readModels.get(modelName) || [];
  }
}

module.exports = QueryHandler;
