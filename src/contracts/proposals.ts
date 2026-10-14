// Contrats des propositions étudiantes : création, liste, modération.

import { z } from "zod";
import { paginationSchema } from "./common";

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

export const moderateProposalSchema = z.object({
  action: z.enum(["approve", "reject"]),
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
