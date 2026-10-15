// Contrats communs : schémas Zod de pagination, tri et identifiants, et types inférés.

import { z } from "zod";

// ── Pagination ──────────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

// ── Tri ─────────────────────────────────────────────────────────────────────

export const documentSortSchema = z
  .enum(["recent", "popular", "title"])
  .default("recent");

export type DocumentSort = z.infer<typeof documentSortSchema>;

// ── Identifiants ────────────────────────────────────────────────────────────

export const uuidParamSchema = z.object({
  id: z.string().uuid("Identifiant invalide"),
});

export type UuidParam = z.infer<typeof uuidParamSchema>;

// ── Recherche textuelle ────────────────────────────────────────────────────

export const searchQuerySchema = z.object({
  q: z.string().trim().optional(),
});

// ── Alias de compatibilité (front) ──────────────────────────────────────────
// Conservés pour ne pas casser le code front déjà écrit contre ces noms.

export const uuidSchema = z.string().uuid("Identifiant invalide.");

export const paginationQuerySchema = paginationSchema;
export type PaginationQuery = PaginationInput;

export const sortSchema = documentSortSchema;
export type Sort = DocumentSort;

export type Paginated<T> = PaginatedResponse<T>;
