// User Controller - Handles user-related HTTP requests
import { User } from '../models/User.js';
import { ValidationError } from '../utils/Errors.js';
import { UserView } from '../views/UserView.js';

export class UserController {
  constructor(authService, database) {
    this.authService = authService;
    this.database = database;
    this.userView = new UserView();
  }

  async index(req, res) {
    try {
      const users = await User.findAll(this.database);
      const response = this.userView.renderIndex(users);
      res.status(200).json(response);
    } catch (error) {
      const errorResponse = this.userView.renderError(error);
      res.status(500).json(errorResponse);
    }
  }

  async show(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id, this.database);

      if (!user) {
        const notFoundResponse = this.userView.renderNotFound();
        return res.status(404).json(notFoundResponse);
      }

      const response = this.userView.renderShow(user);
      res.status(200).json(response);
    } catch (error) {
      const errorResponse = this.userView.renderError(error);
      res.status(500).json(errorResponse);
    }
  }

  async create(req, res) {
    try {
      const userData = req.body;
      const user = new User(null, userData.email, userData.password, userData.name);

      await user.save(this.database);

      const response = this.userView.renderCreate(user);
      res.status(201).json(response);
    } catch (error) {
      if (error instanceof ValidationError) {
        const validationResponse = this.userView.renderValidationError(error);
        return res.status(400).json(validationResponse);
      }

      const errorResponse = this.userView.renderError(error);
      res.status(500).json(errorResponse);
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const userData = req.body;

      const user = await User.findById(id, this.database);
      if (!user) {
        const notFoundResponse = this.userView.renderNotFound();
        return res.status(404).json(notFoundResponse);
      }

      // Update user properties
      Object.assign(user, userData);
      await user.save(this.database);

      const response = this.userView.renderUpdate(user);
      res.status(200).json(response);
    } catch (error) {
      if (error instanceof ValidationError) {
        const validationResponse = this.userView.renderValidationError(error);
        return res.status(400).json(validationResponse);
      }

      const errorResponse = this.userView.renderError(error);
      res.status(500).json(errorResponse);
    }
  }

  async destroy(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id, this.database);

      if (!user) {
        const notFoundResponse = this.userView.renderNotFound();
        return res.status(404).json(notFoundResponse);
      }

      await user.delete(this.database);

      const response = this.userView.renderDestroy();
      res.status(200).json(response);
    } catch (error) {
      const errorResponse = this.userView.renderError(error);
      res.status(500).json(errorResponse);
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findByEmail(email, this.database);
      if (!user) {
        const loginFailedResponse = this.userView.renderLoginFailed();
        return res.status(401).json(loginFailedResponse);
      }

      const isValidPassword = await this.authService.verifyPassword(password, user.password);
      if (!isValidPassword) {
        const loginFailedResponse = this.userView.renderLoginFailed();
        return res.status(401).json(loginFailedResponse);
      }

      const token = await this.authService.generateToken(user);
      const response = this.userView.renderLogin(user, token);
      res.status(200).json(response);
    } catch (error) {
      const errorResponse = this.userView.renderError(error);
      res.status(500).json(errorResponse);
    }
  }

  async logout(req, res) {
    try {
      const response = this.userView.renderLogout();
      res.status(200).json(response);
    } catch (error) {
      const errorResponse = this.userView.renderError(error);
      res.status(500).json(errorResponse);
    }
  }
}
