import { z } from "zod"

// Card schema (import/export)
export const CardZ = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  answerMD: z.string(),
  tags: z.array(z.string()).default([]),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
  box: z.number().int().min(1).max(5).optional(),
  due: z.number().int().optional(),
}).strict()

// Backup file schema with versioning
export const BackupZ = z.object({
  schemaVersion: z.literal(1),
  exportedAt: z.number().int(),
  cards: z.array(CardZ),
}).strict()

export type Backup = z.infer<typeof BackupZ>
