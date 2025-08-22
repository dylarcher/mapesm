function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Default error response
  let status = 500;
  let message = 'Internal Server Error';

  // Handle different types of errors
  if (err.message === 'User not found' || err.message === 'Product not found') {
    status = 404;
    message = err.message;
  } else if (err.message.includes('required') || err.message.includes('already exists')) {
    status = 400;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation Error';
  }

  res.status(status).json({
    success: false,
    message,
    timestamp: new Date().toISOString(),
    path: req.path
  });
}

module.exports = errorHandler;
