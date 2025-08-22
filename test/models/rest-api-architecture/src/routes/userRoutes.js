// User Routes - Express router for user endpoints
import { Router } from 'express';
import { UserController } from '../controllers/UserController.js';
import { adminMiddleware } from '../middleware/admin.js';
import { authMiddleware } from '../middleware/auth.js';
import { rateLimitMiddleware } from '../middleware/rateLimit.js';
import { validationMiddleware } from '../middleware/validator.js';

const router = Router();
const userController = new UserController();

// Rate limiting for user endpoints
const userRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
  message: 'Too many user requests, please try again later.'
});

// Apply rate limiting to all user routes
router.use(userRateLimit);

// Get current user profile (no admin required)
router.get('/me',
  authMiddleware,
  userController.getCurrentUser.bind(userController)
);

// Update current user profile
router.put('/me',
  authMiddleware,
  validationMiddleware('updateProfile'),
  userController.updateCurrentUser.bind(userController)
);

// Admin-only routes
router.get('/',
  authMiddleware,
  adminMiddleware,
  userController.getUsers.bind(userController)
);

router.get('/:id',
  authMiddleware,
  adminMiddleware,
  userController.getUserById.bind(userController)
);

router.post('/',
  authMiddleware,
  adminMiddleware,
  validationMiddleware('createUser'),
  userController.createUser.bind(userController)
);

router.put('/:id',
  authMiddleware,
  adminMiddleware,
  validationMiddleware('updateUser'),
  userController.updateUser.bind(userController)
);

router.delete('/:id',
  authMiddleware,
  adminMiddleware,
  userController.deleteUser.bind(userController)
);

export { router as userRoutes };
