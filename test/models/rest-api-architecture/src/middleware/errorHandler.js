// Error Handler Middleware
import { ConfigService } from '../services/ConfigService.js';

export class ErrorHandler {
  constructor() {
    this.config = new ConfigService();
    this.isDevelopment = this.config.get('env', 'development') === 'development';
  }

  // Main error handler
  handle = (error, req, res, next) => {
    console.error('Error occurred:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      headers: req.headers,
      body: req.body,
      user: req.user?.id
    });

    // Default error response
    let statusCode = error.statusCode || error.status || 500;
    let message = error.message || 'Internal Server Error';
    let code = error.code || 'INTERNAL_ERROR';

    // Handle specific error types
    if (error.name === 'ValidationError') {
      statusCode = 400;
      message = 'Validation failed';
      code = 'VALIDATION_ERROR';
    } else if (error.name === 'CastError') {
      statusCode = 400;
      message = 'Invalid ID format';
      code = 'INVALID_ID';
    } else if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      if (error.code === 11000) {
        statusCode = 409;
        message = 'Duplicate entry';
        code = 'DUPLICATE_ENTRY';
      } else {
        statusCode = 500;
        message = 'Database error';
        code = 'DATABASE_ERROR';
      }
    } else if (error.name === 'JsonWebTokenError') {
      statusCode = 401;
      message = 'Invalid token';
      code = 'INVALID_TOKEN';
    } else if (error.name === 'TokenExpiredError') {
      statusCode = 401;
      message = 'Token expired';
      code = 'TOKEN_EXPIRED';
    } else if (error.name === 'MulterError') {
      statusCode = 400;
      if (error.code === 'LIMIT_FILE_SIZE') {
        message = 'File too large';
        code = 'FILE_TOO_LARGE';
      } else {
        message = 'File upload error';
        code = 'UPLOAD_ERROR';
      }
    }

    // Prepare error response
    const errorResponse = {
      success: false,
      message,
      code,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    };

    // Add additional details in development
    if (this.isDevelopment) {
      errorResponse.stack = error.stack;
      errorResponse.details = {
        name: error.name,
        statusCode: error.statusCode,
        originalMessage: error.message
      };
    }

    // Add validation errors if present
    if (error.errors) {
      errorResponse.errors = error.errors;
    }

    res.status(statusCode).json(errorResponse);
  };

  // Not found handler
  notFound = (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Resource not found',
      code: 'NOT_FOUND',
      path: req.path,
      method: req.method
    });
  };

  // Async error wrapper
  asyncHandler = (fn) => {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };
}

// Custom error classes
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'APP_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTH_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Not authorized') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

// Export singleton instance
const errorHandler = new ErrorHandler();
export { errorHandler };
