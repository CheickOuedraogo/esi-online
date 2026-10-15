// Contrats du catalogue : niveaux, filieres, matieres et types de documents.

import { z } from 'zod';
import { uuidSchema } from './common';

export const levelSchema = z.object({
  id: uuidSchema,
  name: z.string(),
});

export const programSchema = z.object({
  id: uuidSchema,
  name: z.string(),
});

export const subjectSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  levelId: uuidSchema,
  programId: uuidSchema,
});

export const documentTypeSchema = z.object({
  id: uuidSchema,
  name: z.string(),
});

export const catalogResponseSchema = z.object({
  levels: z.array(levelSchema),
  programs: z.array(programSchema),
  subjects: z.array(subjectSchema),
  documentTypes: z.array(documentTypeSchema),
});

export type Level = z.infer<typeof levelSchema>;
export type Program = z.infer<typeof programSchema>;
export type Subject = z.infer<typeof subjectSchema>;
export type DocumentType = z.infer<typeof documentTypeSchema>;
export type CatalogResponse = z.infer<typeof catalogResponseSchema>;

export const createLevelInputSchema = z.object({
  name: z.string().trim().min(1, 'Le nom est requis.').max(80, 'Le nom est trop long.'),
});

export type CreateLevelInput = z.infer<typeof createLevelInputSchema>;

export const createDocumentTypeInputSchema = z.object({
  name: z.string().trim().min(1, 'Le nom est requis.').max(80, 'Le nom est trop long.'),
});

export type CreateDocumentTypeInput = z.infer<typeof createDocumentTypeInputSchema>;

export const createSubjectInputSchema = z.object({
  name: z.string().trim().min(1, 'Le nom est requis.').max(120, 'Le nom est trop long.'),
  levelId: uuidSchema,
});

export type CreateSubjectInput = z.infer<typeof createSubjectInputSchema>;
