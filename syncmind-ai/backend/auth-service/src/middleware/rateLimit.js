const rateLimit = require('express-rate-limit');

// General API limiter — generous, just guards against runaway loops/abuse.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please slow down.' },
});

// Tighter limiter for auth endpoints to slow down credential stuffing / brute force.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many auth attempts. Try again later.' },
});

// AI analysis is the most expensive endpoint (external API cost + latency).
const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many AI analysis requests. Try again in a few minutes.' },
});

module.exports = { apiLimiter, authLimiter, aiLimiter };
