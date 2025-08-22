// User Domain Service
class UserDomainService {
  constructor() {
    this.users = [];
  }

  createUser(userData) {
    const user = {
      id: this.users.length + 1,
      ...userData,
      createdAt: new Date()
    };

    this.users.push(user);
    return user;
  }

  getUserById(id) {
    return this.users.find(user => user.id === id);
  }

  updateUser(id, updates) {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updates,
      updatedAt: new Date()
    };

    return this.users[userIndex];
  }

  validateUserData(userData) {
    if (!userData.name || userData.name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }

    if (!userData.email || !this.isValidEmail(userData.email)) {
      throw new Error('Valid email is required');
    }
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = UserDomainService;
