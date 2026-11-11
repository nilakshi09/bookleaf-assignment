/**
 * Centralized Express error handler.
 */
export const errorHandler = (err, req, res, next) => {
  console.error('[Server Error]', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected internal server error occurred.';

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
