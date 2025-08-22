// Application Service - User Service
class UserApplicationService {
  constructor(userRepository, eventBus) {
    this.userRepository = userRepository;
    this.eventBus = eventBus;
  }

  async createUser(userData) {
    const { email, name, age } = userData;

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create user entity
    const User = require('../../domain/entities/User');
    const user = User.create(email, name, age);

    // Save user
    await this.userRepository.save(user);

    // Publish domain events
    await this.publishEvents(user);

    return user;
  }

  async updateUserProfile(userId, profileData) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.updateProfile(profileData.name, profileData.age);
    await this.userRepository.save(user);
    await this.publishEvents(user);

    return user;
  }

  async changeUserEmail(userId, newEmail) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if new email is already taken
    const existingUser = await this.userRepository.findByEmail(newEmail);
    if (existingUser && existingUser.id !== userId) {
      throw new Error('Email already taken');
    }

    user.changeEmail(newEmail);
    await this.userRepository.save(user);
    await this.publishEvents(user);

    return user;
  }

  async getUserById(userId) {
    return await this.userRepository.findById(userId);
  }

  async publishEvents(aggregate) {
    for (const event of aggregate.events) {
      await this.eventBus.publish(event);
    }
    aggregate.clearEvents();
  }
}

module.exports = UserApplicationService;
