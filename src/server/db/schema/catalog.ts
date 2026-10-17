// Schéma Drizzle du catalogue académique : niveaux et types de documents.
// L'ESI est une école unique : il n'y a ni filière ni table de matières. La
// matière d'un document est saisie en texte libre sur le document lui-même.

import { pgTable, uuid, text } from "drizzle-orm/pg-core";

// ── Niveaux (ex: 1CP, 2CP, 1CS, 2CS, 3CS) ───────────────────────────────────

export const levels = pgTable("levels", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
});

// ── Types de document (cours, TD, TP, examen, corrigé, mémoire, autre) ──────

export const documentTypes = pgTable("document_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
});
