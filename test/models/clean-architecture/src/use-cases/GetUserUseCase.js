// Get User Use Case - Application business rules for retrieving users

export class GetUserUseCase {
  constructor(userRepository, logger) {
    this.userRepository = userRepository;
    this.logger = logger;
  }

  async execute(userId) {
    try {
      this.logger.info('Executing GetUserUseCase', { userId });

      // Business rule: Validate user ID format
      if (!this.isValidUserId(userId)) {
        throw new Error('Invalid user ID format');
      }

      // Retrieve user from repository
      const user = await this.userRepository.findById(userId);

      if (!user) {
        return {
          success: false,
          error: 'User not found',
          message: 'The requested user does not exist'
        };
      }

      // Business rule: Apply privacy settings
      const sanitizedUser = await this.applySanitizationRules(user);

      this.logger.info('User retrieved successfully', { userId });

      return {
        success: true,
        user: sanitizedUser,
        message: 'User retrieved successfully'
      };

    } catch (error) {
      this.logger.error('Failed to get user:', error);

      return {
        success: false,
        error: error.message,
        message: 'Failed to retrieve user'
      };
    }
  }

  async executeMultiple(filters = {}) {
    try {
      this.logger.info('Executing GetUserUseCase for multiple users', { filters });

      // Business rule: Apply pagination limits
      const pagination = this.applyPaginationLimits(filters);

      // Business rule: Validate search filters
      this.validateSearchFilters(filters);

      // Retrieve users from repository
      const users = await this.userRepository.findMany({
        ...filters,
        ...pagination
      });

      // Business rule: Apply privacy settings to all users
      const sanitizedUsers = await Promise.all(
        users.map(user => this.applySanitizationRules(user))
      );

      this.logger.info('Multiple users retrieved successfully', {
        count: sanitizedUsers.length,
        filters
      });

      return {
        success: true,
        users: sanitizedUsers,
        total: sanitizedUsers.length,
        message: 'Users retrieved successfully'
      };

    } catch (error) {
      this.logger.error('Failed to get multiple users:', error);

      return {
        success: false,
        error: error.message,
        message: 'Failed to retrieve users'
      };
    }
  }

  isValidUserId(userId) {
    // Business rule: User ID must match expected format
    return typeof userId === 'string' &&
      userId.length > 0 &&
      userId.startsWith('user_');
  }

  async applySanitizationRules(user) {
    // Business rule: Remove sensitive information based on privacy settings
    const sanitized = user.clone();

    // Business rule: Mask email for privacy (show only first 3 chars and domain)
    if (this.shouldMaskEmail(user)) {
      const [localPart, domain] = user.email.split('@');
      const maskedLocal = localPart.substring(0, 3) + '*'.repeat(Math.max(0, localPart.length - 3));
      sanitized.email = `${maskedLocal}@${domain}`;
    }

    return sanitized;
  }

  shouldMaskEmail(user) {
    // Business rule: Mask emails for users from certain domains or created recently
    const sensitiveAge = 7; // days
    const userAge = user.getAgeInDays();

    return userAge < sensitiveAge;
  }

  applyPaginationLimits(filters) {
    // Business rule: Enforce maximum page size
    const maxPageSize = 100;
    const defaultPageSize = 20;

    return {
      limit: Math.min(filters.limit || defaultPageSize, maxPageSize),
      offset: filters.offset || 0
    };
  }

  validateSearchFilters(filters) {
    // Business rule: Validate email filter format
    if (filters.email && !this.isValidEmailFilter(filters.email)) {
      throw new Error('Invalid email filter format');
    }

    // Business rule: Validate name filter length
    if (filters.name && (filters.name.length < 2 || filters.name.length > 50)) {
      throw new Error('Name filter must be between 2 and 50 characters');
    }

    // Business rule: Validate date range filters
    if (filters.createdAfter || filters.createdBefore) {
      this.validateDateRangeFilter(filters.createdAfter, filters.createdBefore);
    }
  }

  isValidEmailFilter(email) {
    // Allow partial email matching for search
    return typeof email === 'string' &&
      email.length >= 2 &&
      email.length <= 100 &&
      !email.includes('<') &&
      !email.includes('>');
  }

  validateDateRangeFilter(after, before) {
    if (after && isNaN(new Date(after))) {
      throw new Error('Invalid createdAfter date format');
    }

    if (before && isNaN(new Date(before))) {
      throw new Error('Invalid createdBefore date format');
    }

    if (after && before && new Date(after) > new Date(before)) {
      throw new Error('createdAfter must be before createdBefore');
    }
  }
}
