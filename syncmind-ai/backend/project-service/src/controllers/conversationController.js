const prisma = require('../config/db');
const { ok, created } = require('../utils/apiResponse');

async function createConversation(req, res) {
  const { rawText, source, fileName } = req.body;

  const conversation = await prisma.conversation.create({
    data: { projectId: req.project.id, rawText, source, fileName: fileName || null },
  });

  await prisma.activityLog.create({
    data: {
      projectId: req.project.id,
      userId: req.user.id,
      userName: req.user.name,
      action: 'CONVERSATION_IMPORTED',
      metadata: JSON.stringify({ source }),
    },
  });

  return created(res, conversation);
}

async function listConversations(req, res) {
  const conversations = await prisma.conversation.findMany({
    where: { projectId: req.project.id },
    orderBy: { createdAt: 'desc' },
    include: { analyses: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });
  return ok(res, conversations);
}

module.exports = { createConversation, listConversations };
