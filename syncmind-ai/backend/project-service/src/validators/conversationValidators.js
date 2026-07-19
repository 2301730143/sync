const { z } = require('zod');
const { ConversationSource } = require('../utils/enums');

// Conversation content is untrusted user data — bound its size hard.
const MAX_CHARS = 50000;

const createConversationSchema = z.object({
  rawText: z
    .string()
    .trim()
    .min(20, 'Conversation text is too short to analyze (min 20 characters)')
    .max(MAX_CHARS, `Conversation text exceeds the ${MAX_CHARS} character limit`),
  source: z.enum(Object.values(ConversationSource)).optional().default('PASTE'),
  fileName: z.string().trim().max(255).optional().nullable(),
});

module.exports = { createConversationSchema, MAX_CHARS };
