// User Presenter - Interface Adapter Layer
export class UserPresenter {
  presentCreateUserResponse(result) {
    if (!result.success) {
      return this.presentValidationError(result);
    }

    return {
      success: true,
      message: 'User created successfully',
      data: {
        user: this.formatUserForOutput(result.user)
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  }

  presentGetUserResponse(result) {
    if (!result.success) {
      return this.presentNotFoundError(result);
    }

    return {
      success: true,
      data: {
        user: this.formatUserForOutput(result.user)
      },
      meta: {
        timestamp: new Date().toISOString(),
        retrievedAt: result.retrievedAt
      }
    };
  }

  presentGetUsersResponse(result) {
    return {
      success: true,
      data: {
        users: result.users.map(user => this.formatUserForOutput(user)),
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
          hasNext: result.hasNext,
          hasPrevious: result.hasPrevious
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        count: result.users.length,
        queryTime: result.queryTime
      }
    };
  }

  presentUpdateUserResponse(result) {
    if (!result.success) {
      if (result.error === 'User not found') {
        return this.presentNotFoundError(result);
      }
      return this.presentValidationError(result);
    }

    return {
      success: true,
      message: 'User updated successfully',
      data: {
        user: this.formatUserForOutput(result.user),
        previousValues: result.previousValues,
        updatedFields: result.updatedFields
      },
      meta: {
        timestamp: new Date().toISOString(),
        updatedAt: result.updatedAt
      }
    };
  }

  presentDeleteUserResponse(result) {
    if (!result.success) {
      return this.presentNotFoundError(result);
    }

    return {
      success: true,
      message: 'User deleted successfully',
      data: {
        deletedUserId: result.deletedUserId
      },
      meta: {
        timestamp: new Date().toISOString(),
        deletedAt: result.deletedAt
      }
    };
  }

  presentError(error) {
    // Log error for monitoring (in real app, use proper logging)
    console.error('Application Error:', error);

    // Determine error type and response
    if (error.name === 'ValidationError') {
      return this.presentValidationError({ error: error.message, validationErrors: error.validationErrors });
    }

    if (error.name === 'NotFoundError') {
      return this.presentNotFoundError({ error: error.message });
    }

    if (error.name === 'BusinessRuleError') {
      return this.presentBusinessRuleError({ error: error.message, rule: error.rule });
    }

    // Generic error response (don't expose internal details)
    return {
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again later.',
      meta: {
        timestamp: new Date().toISOString(),
        errorId: this.generateErrorId()
      }
    };
  }

  // Private formatting methods
  presentValidationError(result) {
    return {
      success: false,
      error: 'Validation failed',
      message: result.error || 'The provided data is invalid',
      details: result.validationErrors || [],
      meta: {
        timestamp: new Date().toISOString(),
        errorType: 'VALIDATION_ERROR'
      }
    };
  }

  presentNotFoundError(result) {
    return {
      success: false,
      error: 'Not found',
      message: result.error || 'The requested resource was not found',
      meta: {
        timestamp: new Date().toISOString(),
        errorType: 'NOT_FOUND_ERROR'
      }
    };
  }

  presentBusinessRuleError(result) {
    return {
      success: false,
      error: 'Business rule violation',
      message: result.error || 'A business rule was violated',
      rule: result.rule || 'Unknown rule',
      meta: {
        timestamp: new Date().toISOString(),
        errorType: 'BUSINESS_RULE_ERROR'
      }
    };
  }

  formatUserForOutput(user) {
    // Convert domain entity to presentation format
    return {
      id: user.getId(),
      email: user.getEmail(),
      name: user.getName(),
      createdAt: user.getCreatedAt()?.toISOString(),
      updatedAt: user.getUpdatedAt()?.toISOString(),
      // Add computed/presentation-specific fields
      displayName: this.createDisplayName(user),
      avatarUrl: this.generateAvatarUrl(user),
      profileComplete: this.calculateProfileCompleteness(user),
      accountAge: this.calculateAccountAge(user)
    };
  }

  createDisplayName(user) {
    const name = user.getName();
    return name || user.getEmail().split('@')[0];
  }

  generateAvatarUrl(user) {
    // Generate avatar URL based on email (using Gravatar-style)
    const email = user.getEmail().toLowerCase().trim();
    const hash = this.simpleHash(email);
    return `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(user.getName())}&size=64`;
  }

  calculateProfileCompleteness(user) {
    let completeness = 0;

    if (user.getEmail()) completeness += 40;
    if (user.getName()) completeness += 40;
    if (user.getCreatedAt()) completeness += 20;

    return completeness;
  }

  calculateAccountAge(user) {
    if (!user.getCreatedAt()) return null;

    const now = new Date();
    const created = user.getCreatedAt();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      return `${diffDays} days`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years > 1 ? 's' : ''}`;
    }
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  generateErrorId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // API Documentation helpers
  getApiDocumentation() {
    return {
      endpoints: {
        'POST /users': {
          description: 'Create a new user',
          requestBody: {
            required: ['email', 'name'],
            properties: {
              email: { type: 'string', format: 'email' },
              name: { type: 'string', minLength: 1 }
            }
          },
          responses: {
            201: { description: 'User created successfully' },
            400: { description: 'Validation error' },
            500: { description: 'Internal server error' }
          }
        },
        'GET /users/:id': {
          description: 'Get a user by ID',
          parameters: {
            id: { type: 'string', description: 'User ID' }
          },
          responses: {
            200: { description: 'User retrieved successfully' },
            404: { description: 'User not found' },
            500: { description: 'Internal server error' }
          }
        }
      }
    };
  }
}
