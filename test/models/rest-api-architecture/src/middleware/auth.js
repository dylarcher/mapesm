// Authentication Middleware
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/AuthService.js';
import { CacheService } from '../services/CacheService.js';
import { ConfigService } from '../services/ConfigService.js';

export class AuthMiddleware {
  constructor() {
    this.authService = new AuthService();
    this.cache = new CacheService();
    this.config = new ConfigService();
    this.jwtSecret = this.config.get('jwt.secret');
  }

  // Main authentication middleware
  authenticate = async (req, res, next) => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'No token provided',
          code: 'TOKEN_MISSING'
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify JWT token
      let decoded;
      try {
        decoded = jwt.verify(token, this.jwtSecret);
      } catch (jwtError) {
        if (jwtError.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Token has expired',
            code: 'TOKEN_EXPIRED'
          });
        } else if (jwtError.name === 'JsonWebTokenError') {
          return res.status(401).json({
            success: false,
            message: 'Invalid token',
            code: 'TOKEN_INVALID'
          });
        }
        throw jwtError;
      }

      // Check if token is blacklisted
      const isBlacklisted = await this.cache.get(`blacklist:${token}`);
      if (isBlacklisted) {
        return res.status(401).json({
          success: false,
          message: 'Token has been revoked',
          code: 'TOKEN_REVOKED'
        });
      }

      // Get user from cache or database
      let user = await this.cache.get(`user:${decoded.userId}`);
      if (!user) {
        user = await this.authService.getUserById(decoded.userId);
        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'User not found',
            code: 'USER_NOT_FOUND'
          });
        }

        // Cache user for 5 minutes
        await this.cache.set(`user:${decoded.userId}`, user, 300);
      }

      // Check if user is active
      if (user.status !== 'active') {
        return res.status(401).json({
          success: false,
          message: 'Account is not active',
          code: 'ACCOUNT_INACTIVE'
        });
      }

      // Add user and token info to request
      req.user = user;
      req.token = token;
      req.tokenPayload = decoded;

      next();

    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authentication failed',
        code: 'AUTH_ERROR'
      });
    }
  };

  // Optional authentication - doesn't fail if no token
  optionalAuth = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
      }

      // Use regular authentication
      await this.authenticate(req, res, next);

    } catch (error) {
      // Don't fail for optional auth
      next();
    }
  };

  // Require specific role
  requireRole = (roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.role];
      const requiredRoles = Array.isArray(roles) ? roles : [roles];

      const hasRole = requiredRoles.some(role => userRoles.includes(role));
      if (!hasRole) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: requiredRoles,
          current: userRoles
        });
      }

      next();
    };
  };

  // Require admin role
  requireAdmin = this.requireRole(['admin', 'superadmin']);

  // Require ownership or admin
  requireOwnershipOrAdmin = (getResourceOwnerId) => {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required',
            code: 'AUTH_REQUIRED'
          });
        }

        // Check if user is admin
        const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.role];
        if (userRoles.includes('admin') || userRoles.includes('superadmin')) {
          return next();
        }

        // Check ownership
        const ownerId = await getResourceOwnerId(req);
        if (req.user.id === ownerId) {
          return next();
        }

        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this resource',
          code: 'NOT_AUTHORIZED'
        });

      } catch (error) {
        console.error('Authorization error:', error);
        return res.status(500).json({
          success: false,
          message: 'Authorization failed',
          code: 'AUTH_ERROR'
        });
      }
    };
  };

  // Blacklist token
  async blacklistToken(token, expiresIn = 3600) {
    await this.cache.set(`blacklist:${token}`, true, expiresIn);
  }
}

// Export instances for use in routes
const authMiddleware = new AuthMiddleware();
export const auth = authMiddleware.authenticate;
export const optionalAuth = authMiddleware.optionalAuth;
export const requireRole = authMiddleware.requireRole;
export const requireAdmin = authMiddleware.requireAdmin;
export const requireOwnershipOrAdmin = authMiddleware.requireOwnershipOrAdmin;
