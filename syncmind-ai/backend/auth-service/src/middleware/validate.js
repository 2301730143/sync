const { AppError } = require('../utils/apiResponse');

// Wraps a zod schema into Express middleware. On success, replaces req.body
// with the parsed (and coerced/trimmed) value so downstream code only ever
// sees clean data.
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      throw new AppError('Validation failed', 422, details);
    }
    req.body = result.data;
    next();
  };
}

module.exports = validate;
