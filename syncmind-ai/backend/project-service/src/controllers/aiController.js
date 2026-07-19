const { z } = require('zod');
const prisma = require('../config/db');
const { ok, created, AppError } = require('../utils/apiResponse');
const { analyzeConversation } = require('../services/geminiService');
const { generateProjectFromAnalysis } = require('../services/conversationParser');
const { refreshProjectInsights } = require('../services/projectInsightService');
const { notifyProjectEvent } = require('../services/notificationService');

const analyzeSchema = z.object({ conversationId: z.string().uuid() });

async function analyze(req, res) {
  const parsed = analyzeSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError('conversationId is required', 422);

  const conversation = await prisma.conversation.findUnique({ where: { id: parsed.data.conversationId } });
  if (!conversation || conversation.projectId !== req.project.id) {
    throw new AppError('Conversation not found in this project', 404);
  }

  const { data, isMock } = await analyzeConversation(conversation.rawText);

  const analysis = await prisma.aIAnalysis.create({
    data: {
      conversationId: conversation.id,
      projectId: req.project.id,
      rawResponse: JSON.stringify(data),
      status: 'PENDING',
      isMock,
    },
  });

  // Return the structured data directly (not just the DB row) so the
  // frontend can render the review-before-confirm screen immediately.
  return created(res, { analysisId: analysis.id, isMock, ...data });
}

async function confirmAnalysis(req, res) {
  const analysis = await prisma.aIAnalysis.findUnique({ where: { id: req.params.analysisId } });
  if (!analysis || analysis.projectId !== req.project.id) {
    throw new AppError('Analysis not found', 404);
  }
  if (analysis.status !== 'PENDING') {
    throw new AppError(`Analysis has already been ${analysis.status.toLowerCase()}`, 409);
  }

  // The user may have edited tasks in the review UI before confirming —
  // accept an optional edited payload, falling back to the original AI output.
  const editedSchema = z.object({
    tasks: z.array(z.any()).optional(),
    decisions: z.array(z.any()).optional(),
  });
  const edits = editedSchema.safeParse(req.body).success ? req.body : {};

  const stored = JSON.parse(analysis.rawResponse);
  const finalPayload = {
    tasks: edits.tasks && Array.isArray(edits.tasks) ? edits.tasks : stored.tasks,
    decisions: edits.decisions && Array.isArray(edits.decisions) ? edits.decisions : stored.decisions,
  };

  const result = await generateProjectFromAnalysis({ projectId: req.project.id, analysis: finalPayload });

  await prisma.aIAnalysis.update({
    where: { id: analysis.id },
    data: { status: 'CONFIRMED', confirmedAt: new Date() },
  });

  await refreshProjectInsights(req.project.id);

  await notifyProjectEvent(req.project.id, {
    title: 'AI generated new tasks from a conversation',
    message: `${result.tasks.length} task(s) and ${result.decisionsCreated} decision(s) were added to the project. Review them on the Kanban board.`,
  }).catch(() => {});

  return ok(res, { generated: result.tasks.length, decisionsCreated: result.decisionsCreated });
}

async function discardAnalysis(req, res) {
  const analysis = await prisma.aIAnalysis.findUnique({ where: { id: req.params.analysisId } });
  if (!analysis || analysis.projectId !== req.project.id) {
    throw new AppError('Analysis not found', 404);
  }
  await prisma.aIAnalysis.update({ where: { id: analysis.id }, data: { status: 'DISCARDED' } });
  return ok(res, { discarded: true });
}

module.exports = { analyze, confirmAnalysis, discardAnalysis };
