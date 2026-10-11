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
