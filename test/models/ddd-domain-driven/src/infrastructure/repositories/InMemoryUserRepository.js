// Infrastructure - In-Memory User Repository Implementation
const UserRepository = require('../../domain/repositories/UserRepository');

class InMemoryUserRepository extends UserRepository {
  constructor() {
    super();
    this.users = new Map();
  }

  async findById(id) {
    return this.users.get(id) || null;
  }

  async findByEmail(email) {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async save(user) {
    this.users.set(user.id, { ...user });
    return user;
  }

  async delete(id) {
    return this.users.delete(id);
  }

  async findAll() {
    return Array.from(this.users.values());
  }
}

module.exports = InMemoryUserRepository;
