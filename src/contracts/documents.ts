// Contrats des documents : requetes de liste/filtres, resumes, detail.

import { z } from 'zod';
import { paginationQuerySchema, sortSchema, uuidSchema } from './common';

export const visibilitySchema = z.enum(['public', 'students']);
export type Visibility = z.infer<typeof visibilitySchema>;

export const documentStatusSchema = z.enum(['pending', 'approved', 'rejected']);
export type DocumentStatus = z.infer<typeof documentStatusSchema>;

export const documentSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  description: z.string().nullable(),
  subjectId: uuidSchema,
  subjectName: z.string(),
  levelId: uuidSchema.nullable(),
  levelName: z.string().nullable(),
  programId: uuidSchema.nullable(),
  programName: z.string().nullable(),
  typeId: uuidSchema,
  typeName: z.string(),
  academicYear: z.string().nullable(),
  visibility: visibilitySchema,
  status: documentStatusSchema,
  originalFilename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number(),
  uploadedBy: uuidSchema.nullable(),
  uploaderName: z.string().nullable(),
  downloadCount: z.number(),
  createdAt: z.string(),
  publishedAt: z.string().nullable(),
});

export type DocumentItem = z.infer<typeof documentSchema>;

export const documentListQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().optional(),
  levelId: uuidSchema.optional(),
  programId: uuidSchema.optional(),
  subjectId: uuidSchema.optional(),
  typeId: uuidSchema.optional(),
  year: z.string().trim().optional(),
  sort: sortSchema,
});

export type DocumentListQuery = z.infer<typeof documentListQuerySchema>;
