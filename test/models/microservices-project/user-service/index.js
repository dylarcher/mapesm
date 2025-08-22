// User Service - Handles user management in microservices architecture
import { CacheClient } from '../shared/CacheClient.js';
import { DatabaseClient } from '../shared/DatabaseClient.js';
import { MessageBroker } from '../shared/MessageBroker.js';
import { ServiceBase } from '../shared/ServiceBase.js';

export class UserService extends ServiceBase {
  constructor(config = {}) {
    super('user-service', config);

    this.database = new DatabaseClient(config.database);
    this.cache = new CacheClient(config.cache);
    this.messageBroker = new MessageBroker(config.messaging);

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Listen for user-related events from other services
    this.messageBroker.subscribe('user.profile.update.request', this.handleProfileUpdateRequest.bind(this));
    this.messageBroker.subscribe('user.deletion.request', this.handleUserDeletionRequest.bind(this));
    this.messageBroker.subscribe('order.created', this.handleOrderCreated.bind(this));
  }

  // Core user operations
  async createUser(userData) {
    try {
      // Validate user data
      const validation = await this.validateUserData(userData);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check for existing user
      const existingUser = await this.database.findOne('users', { email: userData.email });
      if (existingUser) {
        throw new Error('User already exists');
      }

      // Create user
      const user = await this.database.create('users', {
        ...userData,
        id: this.generateId(),
        createdAt: new Date(),
        status: 'active'
      });

      // Cache user data
      await this.cache.set(`user:${user.id}`, user, 3600);

      // Publish user created event
      await this.messageBroker.publish('user.created', {
        userId: user.id,
        email: user.email,
        name: user.name,
        timestamp: new Date()
      });

      return this.sanitizeUser(user);

    } catch (error) {
      this.logger.error('Failed to create user:', error);
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      // Try cache first
      let user = await this.cache.get(`user:${userId}`);

      if (!user) {
        // Fallback to database
        user = await this.database.findOne('users', { id: userId });
        if (user) {
          await this.cache.set(`user:${userId}`, user, 3600);
        }
      }

      return user ? this.sanitizeUser(user) : null;

    } catch (error) {
      this.logger.error('Failed to get user:', error);
      throw error;
    }
  }

  async updateUser(userId, updates) {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Update user
      const updatedUser = await this.database.update('users', { id: userId }, {
        ...updates,
        updatedAt: new Date()
      });

      // Update cache
      await this.cache.set(`user:${userId}`, updatedUser, 3600);

      // Publish update event
      await this.messageBroker.publish('user.updated', {
        userId,
        changes: updates,
        timestamp: new Date()
      });

      return this.sanitizeUser(updatedUser);

    } catch (error) {
      this.logger.error('Failed to update user:', error);
      throw error;
    }
  }

  async deleteUser(userId) {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Publish deletion request event (other services can respond)
      await this.messageBroker.publish('user.deletion.requested', {
        userId,
        timestamp: new Date()
      });

      // Wait for responses (simplified - would use more sophisticated event handling)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Delete user
      await this.database.delete('users', { id: userId });

      // Remove from cache
      await this.cache.delete(`user:${userId}`);

      // Publish deletion completed event
      await this.messageBroker.publish('user.deleted', {
        userId,
        timestamp: new Date()
      });

      return { success: true, message: 'User deleted' };

    } catch (error) {
      this.logger.error('Failed to delete user:', error);
      throw error;
    }
  }

  // Event handlers
  async handleProfileUpdateRequest(event) {
    try {
      const { userId, updates, requestId } = event.data;

      const result = await this.updateUser(userId, updates);

      await this.messageBroker.publish('user.profile.update.response', {
        requestId,
        userId,
        result,
        success: true
      });

    } catch (error) {
      await this.messageBroker.publish('user.profile.update.response', {
        requestId: event.data.requestId,
        userId: event.data.userId,
        error: error.message,
        success: false
      });
    }
  }

  async handleUserDeletionRequest(event) {
    try {
      const { userId } = event.data;

      // Check if user can be deleted (no pending orders, etc.)
      const canDelete = await this.canDeleteUser(userId);

      await this.messageBroker.publish('user.deletion.check.response', {
        userId,
        canDelete,
        serviceName: this.serviceName
      });

    } catch (error) {
      this.logger.error('Error handling deletion request:', error);
    }
  }

  async handleOrderCreated(event) {
    try {
      const { userId, orderId } = event.data;

      // Update user statistics
      await this.incrementUserOrderCount(userId);

    } catch (error) {
      this.logger.error('Error handling order created event:', error);
    }
  }

  // Helper methods
  async validateUserData(userData) {
    const errors = [];

    if (!userData.name || userData.name.length < 2) {
      errors.push('Name must be at least 2 characters');
    }

    if (!userData.email || !this.isValidEmail(userData.email)) {
      errors.push('Valid email is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  sanitizeUser(user) {
    const { password, ...sanitized } = user;
    return sanitized;
  }

  async canDeleteUser(userId) {
    // Check with other services if user can be deleted
    // This would involve checking orders, payments, etc.
    return true; // Simplified
  }

  async incrementUserOrderCount(userId) {
    await this.database.update('users', { id: userId }, {
      $inc: { orderCount: 1 },
      updatedAt: new Date()
    });

    // Invalidate cache
    await this.cache.delete(`user:${userId}`);
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
