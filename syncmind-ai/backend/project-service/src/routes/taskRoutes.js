const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const taskController = require('../controllers/taskController');
const { updateTaskSchema, updateStatusSchema } = require('../validators/taskValidators');

router.use(requireAuth);

router.put('/:id', validate(updateTaskSchema), taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.patch('/:id/status', validate(updateStatusSchema), taskController.updateTaskStatus);

module.exports = router;
