// Schéma Drizzle des motifs de refus (comptes utilisateurs et propositions de documents).

import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

export const rejectionTargetEnum = pgEnum("rejection_target_type", [
  "user",
  "document",
]);

export const rejections = pgTable(
  "rejections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    targetType: rejectionTargetEnum("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    reason: text("reason").notNull(),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("rejections_target_type_target_id_idx").on(
      table.targetType,
      table.targetId
    ),
  ]
);

export const rejectionsRelations = relations(rejections, ({ one }) => ({
  author: one(users, {
    fields: [rejections.createdBy],
    references: [users.id],
  }),
}));
