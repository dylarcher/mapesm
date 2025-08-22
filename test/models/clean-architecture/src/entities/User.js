// User Entity - Core business entity (innermost layer)
export class User {
  constructor(id, email, name, createdAt = null) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.createdAt = createdAt || new Date();

    this.validate();
  }

  validate() {
    const errors = [];

    if (!this.email || !this.isValidEmail(this.email)) {
      errors.push('Valid email is required');
    }

    if (!this.name || this.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    }

    if (this.name && this.name.length > 100) {
      errors.push('Name cannot exceed 100 characters');
    }

    if (errors.length > 0) {
      throw new Error(`User validation failed: ${errors.join(', ')}`);
    }
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  updateEmail(newEmail) {
    if (!newEmail || !this.isValidEmail(newEmail)) {
      throw new Error('Invalid email address');
    }
    this.email = newEmail;
  }

  updateName(newName) {
    if (!newName || newName.trim().length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }
    if (newName.length > 100) {
      throw new Error('Name cannot exceed 100 characters');
    }
    this.name = newName.trim();
  }

  getDisplayName() {
    return this.name;
  }

  getEmailDomain() {
    return this.email.split('@')[1];
  }

  isEmailFromDomain(domain) {
    return this.getEmailDomain().toLowerCase() === domain.toLowerCase();
  }

  getAgeInDays() {
    const now = new Date();
    const diffTime = Math.abs(now - this.createdAt);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      createdAt: this.createdAt
    };
  }

  static fromJSON(data) {
    return new User(data.id, data.email, data.name, new Date(data.createdAt));
  }

  equals(other) {
    return other instanceof User && this.id === other.id;
  }

  clone() {
    return new User(this.id, this.email, this.name, this.createdAt);
  }
}
