// User Controller - Handles user-related HTTP requests
import { CacheService } from '../services/CacheService.js';
import { UserService } from '../services/UserService.js';
import { ValidationService } from '../services/ValidationService.js';

export class UserController {
  constructor() {
    this.userService = new UserService();
    this.validation = new ValidationService();
    this.cache = new CacheService();
  }

  // Get all users with pagination and filtering
  async getUsers(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'createdAt',
        order = 'desc',
        search,
        role,
        status
      } = req.query;

      // Create cache key
      const cacheKey = `users:${JSON.stringify(req.query)}`;

      // Try to get from cache first
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return res.json({
          success: true,
          data: cached,
          cached: true
        });
      }

      // Build filter object
      const filters = {};
      if (search) filters.search = search;
      if (role) filters.role = role;
      if (status) filters.status = status;

      // Get users from service
      const result = await this.userService.getUsers({
        page: parseInt(page),
        limit: parseInt(limit),
        sort,
        order,
        filters
      });

      // Cache the result
      await this.cache.set(cacheKey, result, 300); // 5 minutes

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      next(error);
    }
  }

  // Get single user by ID
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;

      // Validate ID format
      if (!this.validation.isValidId(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID format'
        });
      }

      const cacheKey = `user:${id}`;

      // Try cache first
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return res.json({
          success: true,
          data: cached,
          cached: true
        });
      }

      const user = await this.userService.getUserById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Cache user data
      await this.cache.set(cacheKey, user, 600); // 10 minutes

      res.json({
        success: true,
        data: user
      });

    } catch (error) {
      next(error);
    }
  }

  // Create new user
  async createUser(req, res, next) {
    try {
      const userData = req.body;

      // Validate input
      const validationResult = this.validation.validateUser(userData);
      if (!validationResult.valid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationResult.errors
        });
      }

      // Check if user already exists
      const existingUser = await this.userService.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Create user
      const newUser = await this.userService.createUser(userData);

      // Invalidate users cache
      await this.cache.invalidatePattern('users:*');

      res.status(201).json({
        success: true,
        data: newUser,
        message: 'User created successfully'
      });

    } catch (error) {
      next(error);
    }
  }

  // Update user
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Validate ID
      if (!this.validation.isValidId(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID format'
        });
      }

      // Validate updates
      const validationResult = this.validation.validateUserUpdate(updates);
      if (!validationResult.valid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationResult.errors
        });
      }

      // Check if user exists
      const existingUser = await this.userService.getUserById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check authorization (users can only update themselves unless admin)
      if (req.user.id !== id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this user'
        });
      }

      // Update user
      const updatedUser = await this.userService.updateUser(id, updates);

      // Invalidate cache
      await this.cache.delete(`user:${id}`);
      await this.cache.invalidatePattern('users:*');

      res.json({
        success: true,
        data: updatedUser,
        message: 'User updated successfully'
      });

    } catch (error) {
      next(error);
    }
  }

  // Delete user
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      // Validate ID
      if (!this.validation.isValidId(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID format'
        });
      }

      // Check if user exists
      const existingUser = await this.userService.getUserById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check authorization (only admins can delete users)
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete users'
        });
      }

      // Prevent self-deletion
      if (req.user.id === id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete your own account'
        });
      }

      // Delete user
      await this.userService.deleteUser(id);

      // Invalidate cache
      await this.cache.delete(`user:${id}`);
      await this.cache.invalidatePattern('users:*');

      res.json({
        success: true,
        message: 'User deleted successfully'
      });

    } catch (error) {
      next(error);
    }
  }

  // Get current user profile
  async getCurrentUser(req, res, next) {
    try {
      const userId = req.user.id;

      const user = await this.userService.getUserById(userId);

      res.json({
        success: true,
        data: user
      });

    } catch (error) {
      next(error);
    }
  }

  // Update current user profile
  async updateCurrentUser(req, res, next) {
    try {
      const userId = req.user.id;
      const updates = req.body;

      // Validate updates
      const validationResult = this.validation.validateUserUpdate(updates);
      if (!validationResult.valid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationResult.errors
        });
      }

      // Remove sensitive fields that shouldn't be updated via this endpoint
      delete updates.role;
      delete updates.status;
      delete updates.password; // Use separate endpoint for password changes

      const updatedUser = await this.userService.updateUser(userId, updates);

      // Invalidate cache
      await this.cache.delete(`user:${userId}`);
      await this.cache.invalidatePattern('users:*');

      res.json({
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully'
      });

    } catch (error) {
      next(error);
    }
  }
}
