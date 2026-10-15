// Contrats du catalogue : niveaux, filières, matières et types de documents.

import { z } from "zod";

// ── Niveau ──────────────────────────────────────────────────────────────────

export const levelSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});
export type Level = z.infer<typeof levelSchema>;

export const createLevelSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(100),
});
export type CreateLevel = z.infer<typeof createLevelSchema>;

// ── Filière ─────────────────────────────────────────────────────────────────

export const programSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});
export type Program = z.infer<typeof programSchema>;

export const createProgramSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(100),
});
export type CreateProgram = z.infer<typeof createProgramSchema>;

// ── Matière ─────────────────────────────────────────────────────────────────

export const subjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  levelId: z.string().uuid(),
  programId: z.string().uuid(),
});
export type Subject = z.infer<typeof subjectSchema>;

export const createSubjectSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(100),
  levelId: z.string().uuid("Niveau invalide"),
  programId: z.string().uuid("Filière invalide").optional(),
});
export type CreateSubject = z.infer<typeof createSubjectSchema>;

// ── Type de document ────────────────────────────────────────────────────────

export const documentTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});
export type DocumentType = z.infer<typeof documentTypeSchema>;

export const createDocumentTypeSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(100),
});
export type CreateDocumentType = z.infer<typeof createDocumentTypeSchema>;

// ── Catalogue complet (réponse GET /api/catalog) ────────────────────────────

export const catalogResponseSchema = z.object({
  levels: z.array(levelSchema),
  programs: z.array(programSchema),
  subjects: z.array(subjectSchema),
  documentTypes: z.array(documentTypeSchema),
});
export type CatalogResponse = z.infer<typeof catalogResponseSchema>;

// ── Alias de compatibilité (front) ──────────────────────────────────────────

export const createLevelInputSchema = createLevelSchema;
export type CreateLevelInput = CreateLevel;

export const createDocumentTypeInputSchema = createDocumentTypeSchema;
export type CreateDocumentTypeInput = CreateDocumentType;

export const createSubjectInputSchema = createSubjectSchema;
export type CreateSubjectInput = CreateSubject;
