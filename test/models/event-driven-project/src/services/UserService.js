// User Service - Application Service
const UserAggregate = require('../domain/UserAggregate');

class UserService {
  constructor(eventBus, commandHandler, queryHandler) {
    this.eventBus = eventBus;
    this.commandHandler = commandHandler;
    this.queryHandler = queryHandler;
    this.users = new Map(); // In-memory store for demo
    this.setupCommandHandlers();
    this.setupQueryHandlers();
    this.setupEventHandlers();
  }

  setupCommandHandlers() {
    this.commandHandler.register('CreateUser', async (data) => {
      const user = new UserAggregate();
      user.create(data.name, data.email);

      // Publish events
      for (const event of user.getUncommittedEvents()) {
        await this.eventBus.publish(event.name, event.data);
      }

      this.users.set(user.id, user);
      user.markEventsAsCommitted();

      return { userId: user.id };
    });

    this.commandHandler.register('UpdateUserProfile', async (data) => {
      const user = this.users.get(data.userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.updateProfile(data.name, data.email);

      // Publish events
      for (const event of user.getUncommittedEvents()) {
        await this.eventBus.publish(event.name, event.data);
      }

      user.markEventsAsCommitted();
      return { userId: user.id };
    });

    this.commandHandler.register('ActivateUser', async (data) => {
      const user = this.users.get(data.userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.activate();

      // Publish events
      for (const event of user.getUncommittedEvents()) {
        await this.eventBus.publish(event.name, event.data);
      }

      user.markEventsAsCommitted();
      return { userId: user.id };
    });
  }

  setupQueryHandlers() {
    this.queryHandler.register('GetUser', async (params) => {
      const user = this.users.get(params.userId);
      if (!user) {
        return null;
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        version: user.version
      };
    });

    this.queryHandler.register('GetAllUsers', async () => {
      return Array.from(this.users.values()).map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        version: user.version
      }));
    });

    this.queryHandler.register('GetUserStats', async () => {
      const users = Array.from(this.users.values());
      return {
        total: users.length,
        active: users.filter(u => u.isActive).length,
        inactive: users.filter(u => !u.isActive).length
      };
    });
  }

  setupEventHandlers() {
    // Update read models when events are published
    this.eventBus.subscribe('UserCreated', (event) => {
      this.queryHandler.updateReadModel('UserList', {
        id: event.data.userId,
        name: event.data.name,
        email: event.data.email,
        isActive: true,
        createdAt: event.data.timestamp
      });
    });

    this.eventBus.subscribe('UserProfileUpdated', (event) => {
      const readModel = this.queryHandler.getReadModel('UserList');
      const userIndex = readModel.findIndex(u => u.id === event.data.userId);
      if (userIndex !== -1) {
        readModel[userIndex].name = event.data.name;
        readModel[userIndex].email = event.data.email;
        readModel[userIndex].updatedAt = event.data.timestamp;
      }
    });

    this.eventBus.subscribe('UserActivated', (event) => {
      const readModel = this.queryHandler.getReadModel('UserList');
      const userIndex = readModel.findIndex(u => u.id === event.data.userId);
      if (userIndex !== -1) {
        readModel[userIndex].isActive = true;
        readModel[userIndex].updatedAt = event.data.timestamp;
      }
    });

    this.eventBus.subscribe('UserDeactivated', (event) => {
      const readModel = this.queryHandler.getReadModel('UserList');
      const userIndex = readModel.findIndex(u => u.id === event.data.userId);
      if (userIndex !== -1) {
        readModel[userIndex].isActive = false;
        readModel[userIndex].updatedAt = event.data.timestamp;
      }
    });
  }
}

module.exports = UserService;
