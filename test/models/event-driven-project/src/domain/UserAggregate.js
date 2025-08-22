// User Aggregate - Domain Model with Event Sourcing
const { v4: uuidv4 } = require('uuid');

class UserAggregate {
  constructor(id = null) {
    this.id = id || uuidv4();
    this.version = 0;
    this.name = null;
    this.email = null;
    this.isActive = false;
    this.createdAt = null;
    this.updatedAt = null;
    this.uncommittedEvents = [];
  }

  static fromHistory(events) {
    const user = new UserAggregate();
    events.forEach(event => user.apply(event));
    user.uncommittedEvents = [];
    return user;
  }

  // Command Methods
  create(name, email) {
    if (this.createdAt) {
      throw new Error('User already exists');
    }

    this.raise('UserCreated', {
      userId: this.id,
      name,
      email,
      timestamp: new Date()
    });
  }

  updateProfile(name, email) {
    if (!this.createdAt) {
      throw new Error('User does not exist');
    }

    this.raise('UserProfileUpdated', {
      userId: this.id,
      name,
      email,
      timestamp: new Date()
    });
  }

  activate() {
    if (!this.createdAt) {
      throw new Error('User does not exist');
    }

    if (this.isActive) {
      throw new Error('User is already active');
    }

    this.raise('UserActivated', {
      userId: this.id,
      timestamp: new Date()
    });
  }

  deactivate() {
    if (!this.isActive) {
      throw new Error('User is already inactive');
    }

    this.raise('UserDeactivated', {
      userId: this.id,
      timestamp: new Date()
    });
  }

  // Event Application Methods
  apply(event) {
    switch (event.name) {
      case 'UserCreated':
        this.applyUserCreated(event.data);
        break;
      case 'UserProfileUpdated':
        this.applyUserProfileUpdated(event.data);
        break;
      case 'UserActivated':
        this.applyUserActivated(event.data);
        break;
      case 'UserDeactivated':
        this.applyUserDeactivated(event.data);
        break;
    }
    this.version++;
  }

  applyUserCreated(data) {
    this.name = data.name;
    this.email = data.email;
    this.isActive = true;
    this.createdAt = data.timestamp;
    this.updatedAt = data.timestamp;
  }

  applyUserProfileUpdated(data) {
    this.name = data.name;
    this.email = data.email;
    this.updatedAt = data.timestamp;
  }

  applyUserActivated(data) {
    this.isActive = true;
    this.updatedAt = data.timestamp;
  }

  applyUserDeactivated(data) {
    this.isActive = false;
    this.updatedAt = data.timestamp;
  }

  // Helper Methods
  raise(eventName, eventData) {
    const event = {
      name: eventName,
      data: eventData
    };

    this.apply(event);
    this.uncommittedEvents.push(event);
  }

  getUncommittedEvents() {
    return [...this.uncommittedEvents];
  }

  markEventsAsCommitted() {
    this.uncommittedEvents = [];
  }
}

module.exports = UserAggregate;
