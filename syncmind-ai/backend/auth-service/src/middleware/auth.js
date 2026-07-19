const { verifyToken } = require('../utils/jwt');
const { AppError } = require('../utils/apiResponse');
const prisma = require('../config/db');

// Verifies the bearer JWT and attaches the authenticated user to req.user.
// Re-fetches the user (rather than trusting only the token payload) so a
// deleted/deactivated account is rejected immediately, not just at expiry.
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    throw new AppError('Authentication required', 401);
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    throw new AppError('Invalid or expired session', 401);
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new AppError('Account no longer exists', 401);
  }

  req.user = { id: user.id, email: user.email, name: user.name };
  next();
}

module.exports = { requireAuth };
