// Schéma Drizzle des documents : visibilité, statut, métadonnées de fichier et compteurs.

import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
  index,
  customType,
} from "drizzle-orm/pg-core";
import { relations, sql, SQL } from "drizzle-orm";
import { subjects, documentTypes } from "./catalog";
import { users } from "./users";

export const visibilityEnum = pgEnum("visibility", ["public", "students"]);
export const documentStatusEnum = pgEnum("document_status", [
  "pending",
  "approved",
  "rejected",
]);

// Type personnalisé pour PostgreSQL tsvector
const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "restrict" }),
    typeId: uuid("type_id")
      .notNull()
      .references(() => documentTypes.id, { onDelete: "restrict" }),
    academicYear: integer("academic_year"),
    visibility: visibilityEnum("visibility").notNull().default("students"),
    status: documentStatusEnum("status").notNull().default("pending"),
    fileKey: text("file_key").notNull(),
    originalFilename: text("original_filename").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    uploadedBy: uuid("uploaded_by").references(() => users.id, {
      onDelete: "set null",
    }),
    downloadCount: integer("download_count").notNull().default(0),
    searchVector: tsvector("search_vector").generatedAlwaysAs(
      (): SQL =>
        sql`to_tsvector('french', coalesce("title", '') || ' ' || coalesce("description", ''))`
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (table) => [
    index("documents_status_visibility_idx").on(table.status, table.visibility),
    index("documents_subject_id_idx").on(table.subjectId),
    index("documents_type_id_idx").on(table.typeId),
    index("documents_academic_year_idx").on(table.academicYear),
    index("documents_published_at_idx").on(table.publishedAt),
    index("documents_download_count_idx").on(table.downloadCount),
    index("documents_search_vector_idx").using("gin", table.searchVector),
    index("documents_title_trgm_idx").using("gin", sql`${table.title} gin_trgm_ops`),
  ]
);

export const documentsRelations = relations(documents, ({ one }) => ({
  subject: one(subjects, {
    fields: [documents.subjectId],
    references: [subjects.id],
  }),
  type: one(documentTypes, {
    fields: [documents.typeId],
    references: [documentTypes.id],
  }),
  uploader: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
}));
