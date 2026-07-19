const prisma = require('../config/db');
const { ok } = require('../utils/apiResponse');
const { refreshProjectInsights } = require('../services/projectInsightService');
const { analyzeWorkload } = require('../services/workloadAnalyzer');

async function listInsights(req, res) {
  const insights = await prisma.aIInsight.findMany({
    where: { projectId: req.project.id },
    orderBy: { createdAt: 'desc' },
  });
  return ok(res, insights);
}

async function generateInsightsNow(req, res) {
  const insights = await refreshProjectInsights(req.project.id);
  return ok(res, insights);
}

async function getWorkloadAnalysis(req, res) {
  const analysis = await analyzeWorkload(req.project.id);
  return ok(res, analysis);
}

module.exports = { listInsights, generateInsightsNow, getWorkloadAnalysis };
