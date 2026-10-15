// Contrats des propositions étudiantes : création, liste, modération.
// Le contenu des fichiers est conservé 3 jours pour économiser le stockage ;
// passé ce délai le fichier est supprimé mais la proposition reste consultable.

import { z } from "zod";
import { paginationSchema } from "./common";

export const PROPOSAL_RETENTION_DAYS = 3;

// ── Création d'une proposition ──────────────────────────────────────────────

export const createProposalSchema = z.object({
  title: z.string().trim().min(1, "Titre requis").max(255),
  description: z.string().trim().max(2000).optional(),
  subjectId: z.string().uuid("Matière invalide"),
  typeId: z.string().uuid("Type invalide"),
  academicYear: z.coerce.number().int().min(2000).max(2100).optional(),
});

export type CreateProposal = z.infer<typeof createProposalSchema>;

// ── Proposition (réponse) ───────────────────────────────────────────────────

export const proposalSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  subjectId: z.string().uuid(),
  subjectName: z.string(),
  typeId: z.string().uuid(),
  typeName: z.string(),
  academicYear: z.number().nullable(),
  status: z.enum(["pending", "approved", "rejected"]),
  visibility: z.enum(["public", "students"]),
  mimeType: z.string(),
  sizeBytes: z.number(),
  originalFilename: z.string(),
  rejectionReason: z.string().nullable(),
  uploaderName: z.string().nullable(),
  levelName: z.string().nullable(),
  contentAvailable: z.boolean(),
  fileExpiresAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  publishedAt: z.string().datetime().nullable(),
});

export type Proposal = z.infer<typeof proposalSchema>;

// ── Filtres des propositions (liste admin) ──────────────────────────────────

export const proposalFiltersSchema = paginationSchema.extend({
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
});

export type ProposalFilters = z.infer<typeof proposalFiltersSchema>;

// ── Modération (admin) ──────────────────────────────────────────────────────
// `action` est optionnelle : sans action, l'admin corrige seulement les métadonnées.

export const moderateProposalSchema = z.object({
  action: z.enum(["approve", "reject"]).optional(),
  reason: z
    .string()
    .trim()
    .min(1, "Motif requis pour un refus")
    .max(500)
    .optional(),
  // Champs corrigeables à l'approbation
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().max(2000).optional(),
  subjectId: z.string().uuid().optional(),
  typeId: z.string().uuid().optional(),
  academicYear: z.coerce.number().int().min(2000).max(2100).nullable().optional(),
  visibility: z.enum(["public", "students"]).default("students"),
});

export type ModerateProposal = z.infer<typeof moderateProposalSchema>;

// ── Alias de compatibilité (front) ──────────────────────────────────────────

export const createProposalInputSchema = createProposalSchema;
export type CreateProposalInput = CreateProposal;

export const updateProposalInputSchema = createProposalSchema;
export type UpdateProposalInput = CreateProposal;
