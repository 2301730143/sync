const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

router.use(requireAuth);

router.get('/', notificationController.listNotifications);
router.patch('/:id/read', notificationController.markRead);

module.exports = router;
