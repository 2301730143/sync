const router = require('express').Router();
const { register, login, me, updatePreferences } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema, updatePreferencesSchema } = require('../validators/authValidators');
const { authLimiter } = require('../middleware/rateLimit');

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);

// GET /profile is the milestone-spec name; GET /me is kept as an alias since
// the frontend already used it and "current user" reads naturally either way.
router.get('/profile', requireAuth, me);
router.get('/me', requireAuth, me);

router.patch('/preferences', requireAuth, validate(updatePreferencesSchema), updatePreferences);

module.exports = router;
