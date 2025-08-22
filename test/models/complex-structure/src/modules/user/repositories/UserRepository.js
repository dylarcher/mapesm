class UserRepository {
  constructor() {
    // In a real app, this would be injected
    this.users = [
      { id: 1, name: 'John Doe', email: 'john@example.com', createdAt: new Date() },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', createdAt: new Date() }
    ];
  }

  async findAll() {
    return this.users;
  }

  async findById(id) {
    return this.users.find(user => user.id == id);
  }

  async findByEmail(email) {
    return this.users.find(user => user.email === email);
  }

  async create(userData) {
    const newUser = {
      id: this.users.length + 1,
      ...userData,
      createdAt: new Date()
    };
    this.users.push(newUser);
    return newUser;
  }

  async update(id, userData) {
    const userIndex = this.users.findIndex(user => user.id == id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...userData,
      updatedAt: new Date()
    };

    return this.users[userIndex];
  }

  async delete(id) {
    const userIndex = this.users.findIndex(user => user.id == id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    this.users.splice(userIndex, 1);
    return true;
  }
}

module.exports = UserRepository;
