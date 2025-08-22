// User Repository Implementation - Interface Adapter Layer
import { User } from '../entities/User.js';

// Repository interface (would be in use-cases layer in real app)
export class UserRepository {
  constructor(database) {
    this.database = database;
  }

  async save(user) {
    try {
      // Convert domain entity to database format
      const userData = this.entityToDatabase(user);

      let savedData;

      if (user.getId()) {
        // Update existing user
        savedData = await this.database.update('users', user.getId(), userData);
      } else {
        // Create new user
        savedData = await this.database.create('users', userData);
      }

      // Convert back to domain entity
      return this.databaseToEntity(savedData);

    } catch (error) {
      throw new Error(`Failed to save user: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      const userData = await this.database.findById('users', id);

      if (!userData) {
        return null;
      }

      return this.databaseToEntity(userData);

    } catch (error) {
      throw new Error(`Failed to find user by id: ${error.message}`);
    }
  }

  async findByEmail(email) {
    try {
      const userData = await this.database.findOne('users', { email });

      if (!userData) {
        return null;
      }

      return this.databaseToEntity(userData);

    } catch (error) {
      throw new Error(`Failed to find user by email: ${error.message}`);
    }
  }

  async findMany(filters = {}) {
    try {
      // Convert domain filters to database query
      const dbQuery = this.filtersToQuery(filters);

      const result = await this.database.findMany('users', dbQuery);

      return {
        users: result.data.map(userData => this.databaseToEntity(userData)),
        total: result.total,
        limit: filters.limit || 50,
        offset: filters.offset || 0
      };

    } catch (error) {
      throw new Error(`Failed to find users: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      const deletedData = await this.database.delete('users', id);
      return !!deletedData;

    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  async exists(id) {
    try {
      const count = await this.database.count('users', { id });
      return count > 0;

    } catch (error) {
      throw new Error(`Failed to check user existence: ${error.message}`);
    }
  }

  async existsByEmail(email) {
    try {
      const count = await this.database.count('users', { email });
      return count > 0;

    } catch (error) {
      throw new Error(`Failed to check email existence: ${error.message}`);
    }
  }

  async count(filters = {}) {
    try {
      const dbQuery = this.filtersToQuery(filters);
      return await this.database.count('users', dbQuery.where);

    } catch (error) {
      throw new Error(`Failed to count users: ${error.message}`);
    }
  }

  // Transaction support
  async saveInTransaction(users, transaction = null) {
    const tx = transaction || await this.database.beginTransaction();

    try {
      const savedUsers = [];

      for (const user of users) {
        const userData = this.entityToDatabase(user);
        let savedData;

        if (user.getId()) {
          savedData = await this.database.updateInTransaction('users', user.getId(), userData, tx);
        } else {
          savedData = await this.database.createInTransaction('users', userData, tx);
        }

        savedUsers.push(this.databaseToEntity(savedData));
      }

      if (!transaction) {
        await this.database.commitTransaction(tx);
      }

      return savedUsers;

    } catch (error) {
      if (!transaction) {
        await this.database.rollbackTransaction(tx);
      }
      throw error;
    }
  }

  // Data conversion methods
  entityToDatabase(user) {
    return {
      id: user.getId(),
      email: user.getEmail(),
      name: user.getName(),
      created_at: user.getCreatedAt(),
      updated_at: user.getUpdatedAt()
    };
  }

  databaseToEntity(userData) {
    const user = new User(userData.email, userData.name);

    // Set private fields using the entity's methods
    if (userData.id) {
      user.setId(userData.id);
    }

    if (userData.created_at) {
      user.setCreatedAt(new Date(userData.created_at));
    }

    if (userData.updated_at) {
      user.setUpdatedAt(new Date(userData.updated_at));
    }

    return user;
  }

  filtersToQuery(filters) {
    const query = {
      where: {},
      limit: filters.limit || 50,
      offset: filters.offset || 0,
      orderBy: []
    };

    if (filters.email) {
      query.where.email = filters.email;
    }

    if (filters.name) {
      // Support partial name matching
      query.where.name = { like: `%${filters.name}%` };
    }

    if (filters.createdAfter) {
      query.where.created_at = query.where.created_at || {};
      query.where.created_at.gte = filters.createdAfter;
    }

    if (filters.createdBefore) {
      query.where.created_at = query.where.created_at || {};
      query.where.created_at.lte = filters.createdBefore;
    }

    // Default ordering
    query.orderBy.push({ field: 'created_at', direction: 'DESC' });

    // Apply custom sorting if specified
    if (filters.sortBy) {
      query.orderBy.unshift({
        field: this.mapSortField(filters.sortBy),
        direction: filters.sortDirection || 'ASC'
      });
    }

    return query;
  }

  mapSortField(sortBy) {
    const fieldMap = {
      'email': 'email',
      'name': 'name',
      'created': 'created_at',
      'updated': 'updated_at'
    };

    return fieldMap[sortBy] || 'created_at';
  }

  // Database schema helpers
  getSchema() {
    return {
      tableName: 'users',
      columns: {
        id: { type: 'uuid', primaryKey: true, defaultValue: 'uuid()' },
        email: { type: 'string', unique: true, required: true, maxLength: 255 },
        name: { type: 'string', required: true, maxLength: 100 },
        created_at: { type: 'timestamp', defaultValue: 'now()' },
        updated_at: { type: 'timestamp', defaultValue: 'now()', onUpdate: 'now()' }
      },
      indexes: [
        { name: 'idx_users_email', columns: ['email'], unique: true },
        { name: 'idx_users_created_at', columns: ['created_at'] },
        { name: 'idx_users_name', columns: ['name'] }
      ]
    };
  }

  // Migration helpers
  async createTable() {
    const schema = this.getSchema();
    return await this.database.createTable(schema);
  }

  async dropTable() {
    return await this.database.dropTable('users');
  }

  // Health check
  async healthCheck() {
    try {
      await this.database.query('SELECT 1');
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
    }
  }
}
