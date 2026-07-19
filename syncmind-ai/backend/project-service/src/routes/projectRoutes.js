const router = require('express').Router();
const { requireAuth, requireProjectAccess } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { aiLimiter } = require('../middleware/rateLimit');

const projectController = require('../controllers/projectController');
const memberController = require('../controllers/memberController');
const conversationController = require('../controllers/conversationController');
const aiController = require('../controllers/aiController');
const taskController = require('../controllers/taskController');
const insightController = require('../controllers/insightController');

const {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  updateMemberSchema,
} = require('../validators/projectValidators');
const { createConversationSchema } = require('../validators/conversationValidators');
const { createTaskSchema } = require('../validators/taskValidators');

router.use(requireAuth);

// ---- Projects ----
router.get('/', projectController.listProjects);
router.post('/', validate(createProjectSchema), projectController.createProject);
router.get('/:id', requireProjectAccess, projectController.getProject);
router.put('/:id', requireProjectAccess, validate(updateProjectSchema), projectController.updateProject);
router.delete('/:id', requireProjectAccess, projectController.deleteProject);
router.get('/:id/overview', requireProjectAccess, projectController.getOverview);

// ---- Team ----
router.get('/:id/members', requireProjectAccess, memberController.listMembers);
router.post('/:id/members', requireProjectAccess, validate(addMemberSchema), memberController.addMember);
router.put('/:id/members/:memberId', requireProjectAccess, validate(updateMemberSchema), memberController.updateMember);
router.delete('/:id/members/:memberId', requireProjectAccess, memberController.removeMember);

// ---- Conversations ----
router.get('/:id/conversations', requireProjectAccess, conversationController.listConversations);
router.post(
  '/:id/conversations',
  requireProjectAccess,
  validate(createConversationSchema),
  conversationController.createConversation
);

// ---- AI Analysis ----
router.post('/:id/analyze', requireProjectAccess, aiLimiter, aiController.analyze);
router.post('/:id/analysis/:analysisId/confirm', requireProjectAccess, aiController.confirmAnalysis);
router.post('/:id/analysis/:analysisId/discard', requireProjectAccess, aiController.discardAnalysis);

// ---- Tasks (project-scoped) ----
router.get('/:id/tasks', requireProjectAccess, taskController.listTasks);
router.post('/:id/tasks', requireProjectAccess, validate(createTaskSchema), taskController.createTask);

// ---- Insights & Workload ----
router.get('/:id/insights', requireProjectAccess, insightController.listInsights);
router.post('/:id/insights/generate', requireProjectAccess, insightController.generateInsightsNow);
router.get('/:id/workload-analysis', requireProjectAccess, insightController.getWorkloadAnalysis);

module.exports = router;
