// Contrats d'administration : statistiques du tableau de bord, gestion des
// utilisateurs, moderation des documents/propositions et demandes de reinitialisation.

import { z } from 'zod';
import { uuidSchema } from './common';
import { authUserSchema, emailSchema, userRoleSchema, userStatusSchema } from './auth';

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

export const resetPasswordInputSchema = z.object({
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères.')
    .max(200, 'Le mot de passe est trop long.'),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;

export const adminContentInputSchema = z.object({
  title: z.string().trim().min(3, 'Le titre doit contenir au moins 3 caractères.').max(200),
  description: z.string().trim().max(2000).optional(),
  subjectId: uuidSchema,
  typeId: uuidSchema,
  academicYear: z.string().trim().max(20).optional(),
  visibility: z.enum(['public', 'students']),
});

export type AdminContentInput = z.infer<typeof adminContentInputSchema>;

export const createUserInputSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Le nom doit contenir au moins 2 caractères.')
    .max(120, 'Le nom est trop long.'),
  email: emailSchema,
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères.')
    .max(200, 'Le mot de passe est trop long.'),
  levelId: uuidSchema.nullable().optional(),
  role: userRoleSchema,
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

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
