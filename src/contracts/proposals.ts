// Contrats des propositions etudiantes : creation, liste, moderation.

import { z } from 'zod';
import { uuidSchema } from './common';
import { documentSchema } from './documents';

export const proposalSchema = documentSchema.extend({
  rejectionReason: z.string().nullable(),
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
