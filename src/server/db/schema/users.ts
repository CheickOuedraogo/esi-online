// Schéma Drizzle de la table users : rôle, statut et mot de passe temporaire.

import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { levels, programs } from "./catalog";

export const roleEnum = pgEnum("role", ["student", "admin"]);
export const userStatusEnum = pgEnum("user_status", [
  "pending",
  "validated",
  "rejected",
  "suspended",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("student"),
  status: userStatusEnum("status").notNull().default("pending"),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  programId: uuid("program_id").references(() => programs.id, {
    onDelete: "set null",
  }),
  levelId: uuid("level_id").references(() => levels.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const usersRelations = relations(users, ({ one }) => ({
  program: one(programs, {
    fields: [users.programId],
    references: [programs.id],
  }),
  level: one(levels, {
    fields: [users.levelId],
    references: [levels.id],
  }),
}));
