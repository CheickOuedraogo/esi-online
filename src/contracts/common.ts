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

export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
  });
}

export const sortSchema = z.enum(['recent', 'popular', 'title']).default('recent');
export type Sort = z.infer<typeof sortSchema>;
