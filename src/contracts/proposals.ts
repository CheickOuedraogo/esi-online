// Contrats des propositions etudiantes : creation, edition, liste, moderation.
// Le contenu des fichiers est conserve 3 jours pour economiser le stockage ;
// passe ce delai le fichier est supprime mais la proposition reste consultable.

import { z } from 'zod';
import { uuidSchema } from './common';
import { documentSchema } from './documents';

export const PROPOSAL_RETENTION_DAYS = 3;

export const proposalSchema = documentSchema.extend({
  rejectionReason: z.string().nullable(),
  contentAvailable: z.boolean(),
  fileExpiresAt: z.string(),
});

export type Proposal = z.infer<typeof proposalSchema>;

export const createProposalInputSchema = z.object({
  title: z.string().trim().min(3, 'Le titre doit contenir au moins 3 caractères.').max(200),
  description: z.string().trim().max(2000).optional(),
  subjectId: uuidSchema,
  typeId: uuidSchema,
  academicYear: z.string().trim().max(20).optional(),
  originalFilename: z.string().trim().min(1, 'Le fichier est requis.'),
});

export type CreateProposalInput = z.infer<typeof createProposalInputSchema>;

export const updateProposalInputSchema = createProposalInputSchema;

export type UpdateProposalInput = z.infer<typeof updateProposalInputSchema>;
