// Error Handler Middleware
// Centralized error handling for the application

const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  // Default error response
  let status = err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    status = 400;
    message = err.details?.map(d => d.message).join(', ') || 'Validation failed';
  }

  if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid ID format';
  }

  if (err.code === '23505') { // Unique violation
    status = 409;
    message = 'This record already exists';
  }

  if (err.code === '23503') { // Foreign key violation
    status = 409;
    message = 'Cannot delete: associated records exist';
  }

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { error: err })
  });
};

module.exports = {
  errorHandler
};