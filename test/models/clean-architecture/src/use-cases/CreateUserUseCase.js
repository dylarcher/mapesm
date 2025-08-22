// Create User Use Case - Application business rules
import { User } from '../entities/User.js';

export class CreateUserUseCase {
  constructor(userRepository, logger) {
    this.userRepository = userRepository;
    this.logger = logger;
  }

  async execute(userData) {
    try {
      this.logger.info('Executing CreateUserUseCase', { email: userData.email });

      // Business rule: Check if user already exists
      const existingUser = await this.userRepository.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Business rule: Generate unique ID for new user
      const userId = await this.generateUniqueUserId();

      // Create User entity (this validates the data)
      const user = new User(userId, userData.email, userData.name);

      // Business rule: Additional email validation for business domains
      await this.validateBusinessEmail(user.email);

      // Persist the user
      const savedUser = await this.userRepository.save(user);

      this.logger.info('User created successfully', { userId: savedUser.id });

      return {
        success: true,
        user: savedUser,
        message: 'User created successfully'
      };

    } catch (error) {
      this.logger.error('Failed to create user:', error);

      return {
        success: false,
        error: error.message,
        message: 'Failed to create user'
      };
    }
  }

  async generateUniqueUserId() {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const candidateId = this.generateId();
      const existingUser = await this.userRepository.findById(candidateId);

      if (!existingUser) {
        return candidateId;
      }

      attempts++;
    }

    throw new Error('Unable to generate unique user ID after multiple attempts');
  }

  generateId() {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async validateBusinessEmail(email) {
    // Business rule: Certain domains might be blocked
    const blockedDomains = ['tempmail.com', 'throwaway.email', '10minutemail.com'];
    const domain = email.split('@')[1].toLowerCase();

    if (blockedDomains.includes(domain)) {
      throw new Error('Email domain is not allowed');
    }

    // Business rule: Corporate domains might require additional verification
    const corporateDomains = ['company.com', 'enterprise.org'];
    if (corporateDomains.includes(domain)) {
      this.logger.info('Corporate email detected, additional verification may be required', { email, domain });
    }
  }

  // Business rules for user creation policies
  async applyCreationPolicies(user) {
    // Business rule: Rate limiting for user creation
    const recentUsers = await this.userRepository.findRecentUsers(24); // last 24 hours
    const recentUsersFromSameDomain = recentUsers.filter(u =>
      u.getEmailDomain() === user.getEmailDomain()
    );

    if (recentUsersFromSameDomain.length > 10) {
      throw new Error('Too many users created from this domain recently');
    }

    return true;
  }
}
