// Contrats d'administration : statistiques du tableau de bord, gestion des
// utilisateurs, moderation des documents/propositions et demandes de reinitialisation.

import { z } from 'zod';
import { uuidSchema } from './common';
import { authUserSchema, userStatusSchema } from './auth';

export const adminUserSchema = authUserSchema.extend({
  programName: z.string().nullable(),
  levelName: z.string().nullable(),
});

export type AdminUser = z.infer<typeof adminUserSchema>;

export const adminUserListQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: userStatusSchema.optional(),
  role: z.enum(['student', 'admin']).optional(),
});

export type AdminUserListQuery = z.infer<typeof adminUserListQuerySchema>;

export const updateUserStatusInputSchema = z.object({
  status: userStatusSchema,
  reason: z.string().trim().max(500).optional(),
});

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusInputSchema>;

export const reviewProposalInputSchema = z.object({
  action: z.enum(['approve', 'reject']),
  visibility: z.enum(['public', 'students']).optional(),
  reason: z.string().trim().max(500).optional(),
});

export type ReviewProposalInput = z.infer<typeof reviewProposalInputSchema>;

export const resetRequestSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  fullName: z.string(),
  email: z.string(),
  status: z.enum(['pending', 'done']),
  createdAt: z.string(),
});

export type ResetRequest = z.infer<typeof resetRequestSchema>;

export const topDocumentSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  downloadCount: z.number(),
});

export const adminStatsSchema = z.object({
  pendingUsers: z.number(),
  pendingProposals: z.number(),
  pendingResetRequests: z.number(),
  totalDocuments: z.number(),
  totalUsers: z.number(),
  totalDownloads: z.number(),
  topDocuments: z.array(topDocumentSchema),
});

export type AdminStats = z.infer<typeof adminStatsSchema>;
