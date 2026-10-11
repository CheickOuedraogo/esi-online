// Contrats communs : schemas Zod de pagination, tri et identifiants, et types infers.

import { z } from 'zod';

export const uuidSchema = z.string().uuid("Identifiant invalide.");

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export const sortSchema = z.enum(['recent', 'popular', 'title']).default('recent');
export type Sort = z.infer<typeof sortSchema>;
