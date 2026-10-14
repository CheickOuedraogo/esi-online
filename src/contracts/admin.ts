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
  });

export type AdminUserFilters = z.infer<typeof adminUserFiltersSchema>;

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

// ── Réponse de réinitialisation de mot de passe par l'admin ────────────────

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

// ── Statistiques du tableau de bord admin ───────────────────────────────────

export const adminStatsSchema = z.object({
  pendingUsersCount: z.number(),
  pendingProposalsCount: z.number(),
  totalStudentsCount: z.number(),
  totalDocumentsCount: z.number(),
  topDownloadedDocuments: z.array(documentSummarySchema),
});

export type AdminStats = z.infer<typeof adminStatsSchema>;
