// Domain Entity - User
const { v4: uuidv4 } = require('uuid');

class User {
  constructor(id, email, name, age) {
    this.id = id || uuidv4();
    this.email = email;
    this.name = name;
    this.age = age;
    this.createdAt = new Date();
    this.events = [];
  }

  static create(email, name, age) {
    const user = new User(null, email, name, age);
    user.validate();
    user.addEvent('UserCreated', { userId: user.id, email, name });
    return user;
  }

  changeEmail(newEmail) {
    if (!this.isValidEmail(newEmail)) {
      throw new Error('Invalid email format');
    }

    const oldEmail = this.email;
    this.email = newEmail;
    this.addEvent('EmailChanged', { userId: this.id, oldEmail, newEmail });
  }

  updateProfile(name, age) {
    this.name = name;
    this.age = age;
    this.addEvent('ProfileUpdated', { userId: this.id, name, age });
  }

  validate() {
    if (!this.email || !this.isValidEmail(this.email)) {
      throw new Error('Valid email is required');
    }
    if (!this.name || this.name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }
    if (!this.age || this.age < 18) {
      throw new Error('User must be at least 18 years old');
    }
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  addEvent(eventType, data) {
    this.events.push({
      type: eventType,
      data,
      timestamp: new Date()
    });
  }

  clearEvents() {
    this.events = [];
  }
}

module.exports = User;
