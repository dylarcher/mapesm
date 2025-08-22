// Database Adapter - Frameworks & Drivers Layer
export class Database {
  constructor(config) {
    this.config = config;
    this.connection = null;
    this.isConnected = false;
    this.inMemoryStore = new Map(); // For demo purposes
    this.transactionStore = new Map();
    this.nextId = 1;
  }

  async connect() {
    try {
      // In a real application, this would connect to a real database
      console.log(`Connecting to database: ${this.config.type || 'in-memory'}`);

      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 100));

      this.connection = {
        type: this.config.type || 'in-memory',
        host: this.config.host || 'localhost',
        database: this.config.database || 'clean_arch_db',
        connected: true,
        connectionTime: new Date()
      };

      this.isConnected = true;

      // Initialize tables if needed
      await this.initializeTables();

      console.log('Database connected successfully');
      return this.connection;

    } catch (error) {
      console.error('Database connection failed:', error);
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  async disconnect() {
    if (this.connection) {
      console.log('Disconnecting from database...');
      this.connection = null;
      this.isConnected = false;
      console.log('Database disconnected');
    }
  }

  async initializeTables() {
    // Initialize in-memory tables
    if (!this.inMemoryStore.has('users')) {
      this.inMemoryStore.set('users', new Map());
    }
  }

  // CRUD Operations
  async create(tableName, data) {
    this.ensureConnected();

    const table = this.inMemoryStore.get(tableName);
    if (!table) {
      throw new Error(`Table ${tableName} does not exist`);
    }

    const id = this.generateId();
    const now = new Date();

    const record = {
      ...data,
      id,
      created_at: now,
      updated_at: now
    };

    table.set(id, record);

    console.log(`Created record in ${tableName}:`, record);
    return record;
  }

  async findById(tableName, id) {
    this.ensureConnected();

    const table = this.inMemoryStore.get(tableName);
    if (!table) {
      throw new Error(`Table ${tableName} does not exist`);
    }

    const record = table.get(id);
    console.log(`Found record by id ${id} in ${tableName}:`, record);
    return record || null;
  }

  async findOne(tableName, criteria) {
    this.ensureConnected();

    const table = this.inMemoryStore.get(tableName);
    if (!table) {
      throw new Error(`Table ${tableName} does not exist`);
    }

    for (const [id, record] of table.entries()) {
      if (this.matchesCriteria(record, criteria)) {
        console.log(`Found record in ${tableName}:`, record);
        return record;
      }
    }

    console.log(`No record found in ${tableName} matching:`, criteria);
    return null;
  }

  async findMany(tableName, query = {}) {
    this.ensureConnected();

    const table = this.inMemoryStore.get(tableName);
    if (!table) {
      throw new Error(`Table ${tableName} does not exist`);
    }

    let records = Array.from(table.values());

    // Apply where conditions
    if (query.where) {
      records = records.filter(record => this.matchesCriteria(record, query.where));
    }

    // Apply sorting
    if (query.orderBy && query.orderBy.length > 0) {
      records = this.applySorting(records, query.orderBy);
    }

    // Calculate total before pagination
    const total = records.length;

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 50;

    records = records.slice(offset, offset + limit);

    console.log(`Found ${records.length} of ${total} records in ${tableName}`);

    return {
      data: records,
      total,
      offset,
      limit,
      hasMore: (offset + limit) < total
    };
  }

  async update(tableName, id, data) {
    this.ensureConnected();

    const table = this.inMemoryStore.get(tableName);
    if (!table) {
      throw new Error(`Table ${tableName} does not exist`);
    }

    const existingRecord = table.get(id);
    if (!existingRecord) {
      throw new Error(`Record with id ${id} not found in ${tableName}`);
    }

    const updatedRecord = {
      ...existingRecord,
      ...data,
      id, // Preserve ID
      created_at: existingRecord.created_at, // Preserve creation time
      updated_at: new Date()
    };

    table.set(id, updatedRecord);

    console.log(`Updated record in ${tableName}:`, updatedRecord);
    return updatedRecord;
  }

  async delete(tableName, id) {
    this.ensureConnected();

    const table = this.inMemoryStore.get(tableName);
    if (!table) {
      throw new Error(`Table ${tableName} does not exist`);
    }

    const record = table.get(id);
    if (!record) {
      throw new Error(`Record with id ${id} not found in ${tableName}`);
    }

    table.delete(id);

    console.log(`Deleted record from ${tableName}:`, record);
    return record;
  }

  async count(tableName, criteria = {}) {
    this.ensureConnected();

    const table = this.inMemoryStore.get(tableName);
    if (!table) {
      throw new Error(`Table ${tableName} does not exist`);
    }

    let count = 0;
    for (const record of table.values()) {
      if (this.matchesCriteria(record, criteria)) {
        count++;
      }
    }

    console.log(`Counted ${count} records in ${tableName} matching:`, criteria);
    return count;
  }

  // Transaction support
  async beginTransaction() {
    const transactionId = this.generateId();
    const transaction = {
      id: transactionId,
      operations: [],
      startedAt: new Date()
    };

    this.transactionStore.set(transactionId, transaction);
    console.log(`Transaction ${transactionId} started`);
    return transactionId;
  }

  async commitTransaction(transactionId) {
    const transaction = this.transactionStore.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    // All operations in the transaction have already been applied
    // In a real database, this would actually commit the changes
    this.transactionStore.delete(transactionId);
    console.log(`Transaction ${transactionId} committed with ${transaction.operations.length} operations`);
  }

  async rollbackTransaction(transactionId) {
    const transaction = this.transactionStore.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    // In a real database, this would rollback all operations
    // For this demo, we'll just remove the transaction
    this.transactionStore.delete(transactionId);
    console.log(`Transaction ${transactionId} rolled back`);
  }

  async createInTransaction(tableName, data, transactionId) {
    const transaction = this.transactionStore.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    const result = await this.create(tableName, data);
    transaction.operations.push({ type: 'create', tableName, id: result.id });

    return result;
  }

  async updateInTransaction(tableName, id, data, transactionId) {
    const transaction = this.transactionStore.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    const result = await this.update(tableName, id, data);
    transaction.operations.push({ type: 'update', tableName, id });

    return result;
  }

  // Schema operations
  async createTable(schema) {
    this.inMemoryStore.set(schema.tableName, new Map());
    console.log(`Table ${schema.tableName} created with schema:`, schema);
    return true;
  }

  async dropTable(tableName) {
    const deleted = this.inMemoryStore.delete(tableName);
    console.log(`Table ${tableName} ${deleted ? 'dropped' : 'not found'}`);
    return deleted;
  }

  // Raw query support
  async query(sql, params = []) {
    this.ensureConnected();

    // For demo purposes, just return a simple response
    console.log(`Executing query: ${sql}`, params);

    if (sql.trim().toLowerCase().startsWith('select 1')) {
      return [{ result: 1 }];
    }

    return [];
  }

  // Helper methods
  ensureConnected() {
    if (!this.isConnected) {
      throw new Error('Database is not connected');
    }
  }

  matchesCriteria(record, criteria) {
    for (const [key, value] of Object.entries(criteria)) {
      if (typeof value === 'object' && value !== null) {
        // Handle complex criteria like { gte: date, lte: date }
        if (value.like && typeof record[key] === 'string') {
          const pattern = value.like.replace(/%/g, '.*');
          const regex = new RegExp(pattern, 'i');
          if (!regex.test(record[key])) {
            return false;
          }
        } else if (value.gte && record[key] < value.gte) {
          return false;
        } else if (value.lte && record[key] > value.lte) {
          return false;
        } else if (value.gt && record[key] <= value.gt) {
          return false;
        } else if (value.lt && record[key] >= value.lt) {
          return false;
        }
      } else if (record[key] !== value) {
        return false;
      }
    }
    return true;
  }

  applySorting(records, orderBy) {
    return records.sort((a, b) => {
      for (const sort of orderBy) {
        const { field, direction = 'ASC' } = sort;
        const aVal = a[field];
        const bVal = b[field];

        let comparison = 0;
        if (aVal < bVal) comparison = -1;
        else if (aVal > bVal) comparison = 1;

        if (direction.toUpperCase() === 'DESC') {
          comparison = -comparison;
        }

        if (comparison !== 0) {
          return comparison;
        }
      }
      return 0;
    });
  }

  generateId() {
    return `user_${this.nextId++}`;
  }

  // Health and monitoring
  async healthCheck() {
    return {
      status: this.isConnected ? 'healthy' : 'unhealthy',
      connection: this.connection,
      stats: {
        tables: this.inMemoryStore.size,
        activeTransactions: this.transactionStore.size,
        totalRecords: this.getTotalRecords()
      },
      timestamp: new Date().toISOString()
    };
  }

  getTotalRecords() {
    let total = 0;
    for (const table of this.inMemoryStore.values()) {
      total += table.size;
    }
    return total;
  }

  // Configuration and metadata
  getConfig() {
    return { ...this.config };
  }

  getConnectionInfo() {
    return this.connection;
  }

  isHealthy() {
    return this.isConnected;
  }
}
