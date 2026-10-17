// Contrats du catalogue : niveaux et types de documents.
// L'ESI est une école unique : pas de filière ni de table de matières
// (la matière d'un document est un simple texte libre).

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
  documentTypes: z.array(documentTypeSchema),
});
export type CatalogResponse = z.infer<typeof catalogResponseSchema>;

// ── Alias de compatibilité (front) ──────────────────────────────────────────

export const createLevelInputSchema = createLevelSchema;
export type CreateLevelInput = CreateLevel;

export const createDocumentTypeInputSchema = createDocumentTypeSchema;
export type CreateDocumentTypeInput = CreateDocumentType;
