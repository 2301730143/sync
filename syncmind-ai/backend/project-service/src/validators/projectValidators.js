const { z } = require('zod');
const { ProjectRole } = require('../utils/enums');

const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional().nullable(),
});

const updateProjectSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  health: z.enum(['ON_TRACK', 'NEEDS_ATTENTION', 'AT_RISK']).optional(),
});

const addMemberSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().optional().nullable(),
  role: z.enum(Object.values(ProjectRole)).optional().default('MEMBER'),
});

const updateMemberSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  role: z.enum(Object.values(ProjectRole)).optional(),
});

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  updateMemberSchema,
};
