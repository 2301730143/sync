const env = require('../config/env');

function notFound(req, res) {
  res.status(404).json({ success: false, error: 'Route not found' });
}

// Central error handler. Never leaks stack traces, DB errors, or internal
// details in production; logs full detail server-side for debugging.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const isAppError = err.isAppError === true;
  const statusCode = isAppError ? err.statusCode : err.status || 500;

  if (!isAppError) {
    // eslint-disable-next-line no-console
    console.error('[unhandled error]', err);
  }

  const payload = {
    success: false,
    error: isAppError ? err.message : 'Something went wrong. Please try again.',
  };

  if (isAppError && err.details) {
    payload.details = err.details;
  }

  if (env.NODE_ENV === 'development' && !isAppError) {
    payload.debug = { message: err.message, stack: err.stack };
  }

  res.status(statusCode).json(payload);
}

module.exports = { notFound, errorHandler };
