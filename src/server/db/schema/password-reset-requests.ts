// Schéma Drizzle des demandes de réinitialisation de mot de passe.

import {
  pgTable,
  uuid,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

export const resetRequestStatusEnum = pgEnum("reset_request_status", [
  "pending",
  "done",
]);

export const passwordResetRequests = pgTable(
  "password_reset_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: resetRequestStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    handledBy: uuid("handled_by").references(() => users.id, {
      onDelete: "set null",
    }),
    handledAt: timestamp("handled_at", { withTimezone: true }),
  },
  (table) => [
    index("password_reset_requests_status_idx").on(table.status),
    index("password_reset_requests_user_id_idx").on(table.userId),
  ]
);

export const passwordResetRequestsRelations = relations(
  passwordResetRequests,
  ({ one }) => ({
    user: one(users, {
      fields: [passwordResetRequests.userId],
      references: [users.id],
    }),
    handler: one(users, {
      fields: [passwordResetRequests.handledBy],
      references: [users.id],
    }),
  })
);
