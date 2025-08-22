// Database Service - Handles database operations
export class Database {
  constructor() {
    this.collections = new Map();
    this.connected = false;
  }

  async connect() {
    // Simulate database connection
    this.connected = true;
    this.setupCollections();
    console.log('Database connected successfully');
  }

  setupCollections() {
    this.collections.set('users', new Map());
    this.collections.set('products', new Map());
    this.collections.set('categories', new Map());
  }

  async findOne(collection, query) {
    const coll = this.collections.get(collection);
    if (!coll) return null;

    for (const [id, item] of coll.entries()) {
      if (this.matchesQuery(item, query)) {
        return item;
      }
    }
    return null;
  }

  async findAll(collection, query = {}) {
    const coll = this.collections.get(collection);
    if (!coll) return [];

    const results = [];
    for (const [id, item] of coll.entries()) {
      if (this.matchesQuery(item, query)) {
        results.push(item);
      }
    }
    return results;
  }

  async create(collection, data) {
    const coll = this.collections.get(collection);
    if (!coll) throw new Error(`Collection ${collection} does not exist`);

    const id = this.generateId();
    const item = { ...data, id };
    coll.set(id, item);
    return item;
  }

  async update(collection, query, data) {
    const coll = this.collections.get(collection);
    if (!coll) throw new Error(`Collection ${collection} does not exist`);

    for (const [id, item] of coll.entries()) {
      if (this.matchesQuery(item, query)) {
        const updatedItem = { ...item, ...data };
        coll.set(id, updatedItem);
        return updatedItem;
      }
    }
    return null;
  }

  async delete(collection, query) {
    const coll = this.collections.get(collection);
    if (!coll) throw new Error(`Collection ${collection} does not exist`);

    for (const [id, item] of coll.entries()) {
      if (this.matchesQuery(item, query)) {
        coll.delete(id);
        return true;
      }
    }
    return false;
  }

  matchesQuery(item, query) {
    for (const [key, value] of Object.entries(query)) {
      if (item[key] !== value) {
        return false;
      }
    }
    return true;
  }

  generateId() {
    return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async disconnect() {
    this.connected = false;
    this.collections.clear();
    console.log('Database disconnected');
  }
}
