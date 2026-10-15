// Contrats d'administration : gestion des utilisateurs, statuts, réinitialisation, statistiques.

import { z } from "zod";
import { paginationSchema, searchQuerySchema } from "./common";
import { userPublicSchema } from "./auth";
import { documentSummarySchema } from "./documents";

// ── Filtres de la liste des utilisateurs ────────────────────────────────────

export const adminUserFiltersSchema = paginationSchema
  .merge(searchQuerySchema)
  .extend({
    status: z.enum(["pending", "validated", "rejected", "suspended"]).optional(),
    role: z.enum(["student", "admin"]).optional(),
  });

export type AdminUserFilters = z.infer<typeof adminUserFiltersSchema>;

// ── Utilisateur (vue admin, avec noms de filière et niveau) ─────────────────

export const adminUserSchema = userPublicSchema.extend({
  programName: z.string().nullable(),
  levelName: z.string().nullable(),
});

export type AdminUser = z.infer<typeof adminUserSchema>;

// ── Mise à jour du statut d'un utilisateur ──────────────────────────────────

export const updateUserStatusSchema = z.object({
  status: z.enum(["pending", "validated", "rejected", "suspended"]),
  reason: z
    .string()
    .trim()
    .min(1, "Motif requis pour un refus")
    .max(500)
    .optional(),
});

export type UpdateUserStatus = z.infer<typeof updateUserStatusSchema>;

// ── Création directe d'un compte par l'admin ────────────────────────────────

export const createUserInputSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(128).optional(),
  role: z.enum(["student", "admin"]).default("student"),
  status: z
    .enum(["pending", "validated", "rejected", "suspended"])
    .default("validated"),
  levelId: z.string().uuid().nullable().optional(),
  programId: z.string().uuid().nullable().optional(),
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// ── Réinitialisation de mot de passe par l'admin ────────────────────────────
// Le mot de passe peut être imposé ; sinon le serveur en génère un temporaire.

export const resetPasswordInputSchema = z.object({
  password: z.string().min(8).max(128).optional(),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;

export const resetPasswordResponseSchema = z.object({
  temporaryPassword: z.string(),
});

export type ResetPasswordResponse = z.infer<typeof resetPasswordResponseSchema>;

// ── Demandes de réinitialisation de mot de passe (vue admin) ───────────────

export const passwordResetRequestItemSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  userFullName: z.string(),
  userEmail: z.string().email(),
  status: z.enum(["pending", "done"]),
  createdAt: z.string().datetime(),
  handledAt: z.string().datetime().nullable(),
});

export type PasswordResetRequestItem = z.infer<
  typeof passwordResetRequestItemSchema
>;

// ── Modération des propositions (vue admin) ─────────────────────────────────

export const reviewProposalInputSchema = z.object({
  action: z.enum(["approve", "reject"]),
  visibility: z.enum(["public", "students"]).optional(),
  reason: z.string().trim().max(500).optional(),
});

export type ReviewProposalInput = z.infer<typeof reviewProposalInputSchema>;

// ── Modification du contenu (document ou proposition) ───────────────────────

export const adminContentInputSchema = z.object({
  title: z.string().trim().min(1, "Titre requis").max(255),
  description: z.string().trim().max(2000).optional(),
  subjectId: z.string().uuid(),
  typeId: z.string().uuid(),
  academicYear: z.coerce
    .number()
    .int()
    .min(2000)
    .max(2100)
    .nullable()
    .optional(),
  visibility: z.enum(["public", "students"]),
});

export type AdminContentInput = z.infer<typeof adminContentInputSchema>;

// ── Statistiques du tableau de bord admin ───────────────────────────────────

export const adminStatsSchema = z.object({
  pendingUsersCount: z.number(),
  pendingProposalsCount: z.number(),
  pendingResetRequestsCount: z.number(),
  totalStudentsCount: z.number(),
  totalDocumentsCount: z.number(),
  totalDownloadsCount: z.number(),
  topDownloadedDocuments: z.array(documentSummarySchema),
});

export type AdminStats = z.infer<typeof adminStatsSchema>;

// ── Alias de compatibilité (front) ──────────────────────────────────────────

export const adminUserListQuerySchema = adminUserFiltersSchema;
export type AdminUserListQuery = AdminUserFilters;

export const updateUserStatusInputSchema = updateUserStatusSchema;
export type UpdateUserStatusInput = UpdateUserStatus;

export type ResetRequest = PasswordResetRequestItem;
