// Keeps every endpoint returning the same envelope shape, which makes the
// frontend's axios interceptor and error handling trivial.

function ok(res, data, meta = undefined, status = 200) {
  return res.status(status).json({ success: true, data, meta });
}

function created(res, data) {
  return ok(res, data, undefined, 201);
}

class AppError extends Error {
  constructor(message, statusCode = 400, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isAppError = true;
  }
}

module.exports = { ok, created, AppError };
