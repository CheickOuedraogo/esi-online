// Contrats des documents : requêtes de liste/filtres, résumés, détail,
// création/édition, téléchargement.

import { z } from "zod";
import { paginationSchema, documentSortSchema, searchQuerySchema } from "./common";

// ── Énumérations ────────────────────────────────────────────────────────────

export const Visibility = { PUBLIC: "public", STUDENTS: "students" } as const;
export type Visibility = (typeof Visibility)[keyof typeof Visibility];

export const DocumentStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;
export type DocumentStatus =
  (typeof DocumentStatus)[keyof typeof DocumentStatus];

export const visibilitySchema = z.enum(["public", "students"]);
export const documentStatusSchema = z.enum(["pending", "approved", "rejected"]);

// ── Filtres de liste (publique et étudiante) ────────────────────────────────

export const documentFiltersSchema = paginationSchema
  .merge(searchQuerySchema)
  .extend({
    levelId: z.string().uuid().optional(),
    typeId: z.string().uuid().optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    sort: documentSortSchema,
  });

export type DocumentFilters = z.infer<typeof documentFiltersSchema>;

// ── Filtres admin (tous statuts et visibilités) ─────────────────────────────

export const adminDocumentFiltersSchema = documentFiltersSchema.extend({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  visibility: z.enum(["public", "students"]).optional(),
});

export type AdminDocumentFilters = z.infer<typeof adminDocumentFiltersSchema>;

// ── Résumé d'un document (dans les listes) ──────────────────────────────────

export const documentSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  subject: z.string(),
  levelId: z.string().uuid().nullable(),
  levelName: z.string().nullable(),
  typeId: z.string().uuid(),
  typeName: z.string(),
  academicYear: z.number().nullable(),
  visibility: z.enum(["public", "students"]),
  status: z.enum(["pending", "approved", "rejected"]),
  mimeType: z.string(),
  sizeBytes: z.number(),
  downloadCount: z.number(),
  createdAt: z.string().datetime(),
  publishedAt: z.string().datetime().nullable(),
});

export type DocumentSummary = z.infer<typeof documentSummarySchema>;

// ── Détail d'un document ────────────────────────────────────────────────────

export const documentDetailSchema = documentSummarySchema.extend({
  originalFilename: z.string(),
  uploadedBy: z.string().uuid().nullable(),
  uploaderName: z.string().nullable(),
});

export type DocumentDetail = z.infer<typeof documentDetailSchema>;

// ── Création admin ──────────────────────────────────────────────────────────

export const createDocumentSchema = z.object({
  title: z.string().trim().min(1, "Titre requis").max(255),
  description: z.string().trim().max(2000).optional(),
  subject: z.string().trim().min(1, "Matière requise").max(150),
  typeId: z.string().uuid("Type invalide"),
  levelId: z.string().uuid().nullable().optional(),
  academicYear: z.coerce.number().int().min(2000).max(2100).optional(),
  visibility: z.enum(["public", "students"]).default("students"),
});

export type CreateDocument = z.infer<typeof createDocumentSchema>;

// ── Modification admin ──────────────────────────────────────────────────────

export const updateDocumentSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().max(2000).optional(),
  subject: z.string().trim().min(1).max(150).optional(),
  typeId: z.string().uuid().optional(),
  levelId: z.string().uuid().nullable().optional(),
  academicYear: z.coerce.number().int().min(2000).max(2100).nullable().optional(),
  visibility: z.enum(["public", "students"]).optional(),
});

export type UpdateDocument = z.infer<typeof updateDocumentSchema>;

// ── Alias de compatibilité (front) ──────────────────────────────────────────

export type DocumentItem = DocumentDetail;
export type DocumentListQuery = DocumentFilters;
