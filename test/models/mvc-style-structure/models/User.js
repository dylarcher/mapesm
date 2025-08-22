// User Model - Represents user data and business logic
import { ValidationError } from '../utils/Errors.js';

export class User {
  constructor(id = null, email = '', password = '', name = '', createdAt = null) {
    this.id = id;
    this.email = email;
    this.password = password;
    this.name = name;
    this.createdAt = createdAt || new Date();
  }

  static validate(userData) {
    const errors = [];

    if (!userData.email || !userData.email.includes('@')) {
      errors.push('Valid email is required');
    }

    if (!userData.password || userData.password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }

    if (!userData.name || userData.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (errors.length > 0) {
      throw new ValidationError('User validation failed', errors);
    }

    return true;
  }

  static async findById(id, database) {
    const userData = await database.findOne('users', { id });
    return userData ? new User(
      userData.id,
      userData.email,
      userData.password,
      userData.name,
      userData.createdAt
    ) : null;
  }

  static async findByEmail(email, database) {
    const userData = await database.findOne('users', { email });
    return userData ? new User(
      userData.id,
      userData.email,
      userData.password,
      userData.name,
      userData.createdAt
    ) : null;
  }

  static async findAll(database) {
    const users = await database.findAll('users');
    return users.map(userData => new User(
      userData.id,
      userData.email,
      userData.password,
      userData.name,
      userData.createdAt
    ));
  }

  async save(database) {
    User.validate(this);

    if (this.id) {
      return await database.update('users', { id: this.id }, this.toJSON());
    } else {
      const result = await database.create('users', this.toJSON());
      this.id = result.id;
      return result;
    }
  }

  async delete(database) {
    if (!this.id) {
      throw new Error('Cannot delete user without ID');
    }
    return await database.delete('users', { id: this.id });
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      password: this.password,
      name: this.name,
      createdAt: this.createdAt
    };
  }

  toPublicJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      createdAt: this.createdAt
    };
  }
}
