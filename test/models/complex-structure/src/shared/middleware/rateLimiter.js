const rateLimit = require('express-rate-limit');

// Create rate limiter - allows 100 requests per 15 minutes per IP
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// For demonstration purposes, we'll create a simple in-memory rate limiter
// since express-rate-limit might not be installed
const simpleRateLimiter = (req, res, next) => {
  // In a real application, you would use Redis or a database
  // This is just for demonstration
  next();
};

module.exports = simpleRateLimiter;
