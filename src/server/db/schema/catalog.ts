// Schéma Drizzle du catalogue académique : levels, programs, subjects et document_types.

import { pgTable, uuid, text, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Niveaux (ex: 1CP, 2CP, 1CS, 2CS, 3CS) ───────────────────────────────────

export const levels = pgTable("levels", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
});

export const levelsRelations = relations(levels, ({ many }) => ({
  subjects: many(subjects),
}));

// ── Filières (ex: CPI, SIQ, SIT, SIL) ───────────────────────────────────────

export const programs = pgTable("programs", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
});

export const programsRelations = relations(programs, ({ many }) => ({
  subjects: many(subjects),
}));

// ── Matières ────────────────────────────────────────────────────────────────

export const subjects = pgTable(
  "subjects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    levelId: uuid("level_id")
      .notNull()
      .references(() => levels.id, { onDelete: "restrict" }),
    programId: uuid("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "restrict" }),
  },
  (table) => [
    unique("subjects_name_level_program_unique").on(
      table.name,
      table.levelId,
      table.programId
    ),
  ]
);

export const subjectsRelations = relations(subjects, ({ one }) => ({
  level: one(levels, {
    fields: [subjects.levelId],
    references: [levels.id],
  }),
  program: one(programs, {
    fields: [subjects.programId],
    references: [programs.id],
  }),
}));

// ── Types de document (cours, TD, TP, examen, corrigé, mémoire, autre) ──────

export const documentTypes = pgTable("document_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
});
