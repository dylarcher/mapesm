// User Controller - Interface Adapter Layer
export class UserController {
  constructor(createUserUseCase, getUserUseCase, updateUserUseCase, deleteUserUseCase, userPresenter) {
    this.createUserUseCase = createUserUseCase;
    this.getUserUseCase = getUserUseCase;
    this.updateUserUseCase = updateUserUseCase;
    this.deleteUserUseCase = deleteUserUseCase;
    this.userPresenter = userPresenter;
  }

  async createUser(request, response) {
    try {
      // Extract and validate request data
      const userData = this.extractUserDataFromRequest(request);

      // Execute use case
      const result = await this.createUserUseCase.execute(userData);

      // Present response
      const presentedResponse = this.userPresenter.presentCreateUserResponse(result);

      // Send HTTP response
      const statusCode = result.success ? 201 : 400;
      response.status(statusCode).json(presentedResponse);

    } catch (error) {
      const errorResponse = this.userPresenter.presentError(error);
      response.status(500).json(errorResponse);
    }
  }

  async getUser(request, response) {
    try {
      const userId = request.params.id;

      // Execute use case
      const result = await this.getUserUseCase.execute(userId);

      // Present response
      const presentedResponse = this.userPresenter.presentGetUserResponse(result);

      // Send HTTP response
      const statusCode = result.success ? 200 : 404;
      response.status(statusCode).json(presentedResponse);

    } catch (error) {
      const errorResponse = this.userPresenter.presentError(error);
      response.status(500).json(errorResponse);
    }
  }

  async getUsers(request, response) {
    try {
      // Extract query parameters
      const filters = this.extractFiltersFromRequest(request);

      // Execute use case
      const result = await this.getUserUseCase.executeMultiple(filters);

      // Present response
      const presentedResponse = this.userPresenter.presentGetUsersResponse(result);

      // Send HTTP response
      response.status(200).json(presentedResponse);

    } catch (error) {
      const errorResponse = this.userPresenter.presentError(error);
      response.status(500).json(errorResponse);
    }
  }

  async updateUser(request, response) {
    try {
      const userId = request.params.id;
      const updateData = this.extractUserDataFromRequest(request);

      // Execute use case
      const result = await this.updateUserUseCase.execute(userId, updateData);

      // Present response
      const presentedResponse = this.userPresenter.presentUpdateUserResponse(result);

      // Send HTTP response
      const statusCode = result.success ? 200 : (result.error === 'User not found' ? 404 : 400);
      response.status(statusCode).json(presentedResponse);

    } catch (error) {
      const errorResponse = this.userPresenter.presentError(error);
      response.status(500).json(errorResponse);
    }
  }

  async deleteUser(request, response) {
    try {
      const userId = request.params.id;

      // Execute use case
      const result = await this.deleteUserUseCase.execute(userId);

      // Present response
      const presentedResponse = this.userPresenter.presentDeleteUserResponse(result);

      // Send HTTP response
      const statusCode = result.success ? 200 : (result.error === 'User not found' ? 404 : 400);
      response.status(statusCode).json(presentedResponse);

    } catch (error) {
      const errorResponse = this.userPresenter.presentError(error);
      response.status(500).json(errorResponse);
    }
  }

  // Private helper methods for request/response adaptation
  extractUserDataFromRequest(request) {
    const { email, name } = request.body || {};

    if (!email || !name) {
      throw new Error('Missing required fields: email and name are required');
    }

    return {
      email: this.sanitizeInput(email),
      name: this.sanitizeInput(name)
    };
  }

  extractFiltersFromRequest(request) {
    const query = request.query || {};

    const filters = {};

    if (query.email) {
      filters.email = this.sanitizeInput(query.email);
    }

    if (query.name) {
      filters.name = this.sanitizeInput(query.name);
    }

    if (query.createdAfter) {
      filters.createdAfter = query.createdAfter;
    }

    if (query.createdBefore) {
      filters.createdBefore = query.createdBefore;
    }

    if (query.limit) {
      const limit = parseInt(query.limit, 10);
      if (!isNaN(limit) && limit > 0) {
        filters.limit = limit;
      }
    }

    if (query.offset) {
      const offset = parseInt(query.offset, 10);
      if (!isNaN(offset) && offset >= 0) {
        filters.offset = offset;
      }
    }

    return filters;
  }

  sanitizeInput(input) {
    if (typeof input !== 'string') {
      return input;
    }

    // Basic input sanitization
    return input.trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 255); // Limit length
  }

  // Route registration helper
  registerRoutes(router) {
    router.post('/', this.createUser.bind(this));
    router.get('/:id', this.getUser.bind(this));
    router.get('/', this.getUsers.bind(this));
    router.put('/:id', this.updateUser.bind(this));
    router.delete('/:id', this.deleteUser.bind(this));
  }
}
