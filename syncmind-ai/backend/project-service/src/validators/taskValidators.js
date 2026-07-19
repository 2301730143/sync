const { z } = require('zod');
const { TaskStatus, TaskPriority } = require('../utils/enums');

const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000).optional().nullable(),
  ownerId: z.string().uuid().optional().nullable(),
  status: z.enum(Object.values(TaskStatus)).optional().default('TODO'),
  priority: z.enum(Object.values(TaskPriority)).optional().default('MEDIUM'),
  deadline: z.string().datetime().optional().nullable(),
  dependsOnTaskIds: z.array(z.string().uuid()).optional().default([]),
});

const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(4000).optional().nullable(),
  ownerId: z.string().uuid().optional().nullable(),
  status: z.enum(Object.values(TaskStatus)).optional(),
  priority: z.enum(Object.values(TaskPriority)).optional(),
  deadline: z.string().datetime().optional().nullable(),
});

const updateStatusSchema = z.object({
  status: z.enum(Object.values(TaskStatus)),
});

module.exports = { createTaskSchema, updateTaskSchema, updateStatusSchema };
