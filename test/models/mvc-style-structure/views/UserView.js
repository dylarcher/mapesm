// User View - Handles presentation logic for user data
export class UserView {
  renderIndex(users) {
    return {
      success: true,
      data: {
        users: users.map(user => user.toPublicJSON()),
        total: users.length
      },
      message: 'Users retrieved successfully'
    };
  }

  renderShow(user) {
    return {
      success: true,
      data: {
        user: user.toPublicJSON()
      },
      message: 'User retrieved successfully'
    };
  }

  renderCreate(user) {
    return {
      success: true,
      data: {
        user: user.toPublicJSON()
      },
      message: 'User created successfully'
    };
  }

  renderUpdate(user) {
    return {
      success: true,
      data: {
        user: user.toPublicJSON()
      },
      message: 'User updated successfully'
    };
  }

  renderDestroy() {
    return {
      success: true,
      data: null,
      message: 'User deleted successfully'
    };
  }

  renderLogin(user, token) {
    return {
      success: true,
      data: {
        user: user.toPublicJSON(),
        token: token,
        expiresIn: '24h'
      },
      message: 'Login successful'
    };
  }

  renderLogout() {
    return {
      success: true,
      data: null,
      message: 'Logout successful'
    };
  }

  renderLoginFailed() {
    return {
      success: false,
      data: null,
      message: 'Invalid email or password',
      error: {
        code: 'AUTHENTICATION_FAILED',
        details: 'The provided credentials are invalid'
      }
    };
  }

  renderNotFound() {
    return {
      success: false,
      data: null,
      message: 'User not found',
      error: {
        code: 'USER_NOT_FOUND',
        details: 'The requested user does not exist'
      }
    };
  }

  renderValidationError(error) {
    return {
      success: false,
      data: null,
      message: 'Validation failed',
      error: {
        code: 'VALIDATION_ERROR',
        details: error.errors || [error.message]
      }
    };
  }

  renderError(error) {
    return {
      success: false,
      data: null,
      message: 'An error occurred',
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      }
    };
  }
}
