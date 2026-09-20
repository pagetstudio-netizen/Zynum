import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";

export const ipBlocksTable = pgTable("ip_blocks", {
  id: serial("id").primaryKey(),
  ip: text("ip").notNull().unique(),
  reason: text("reason").notNull(),
  blockedUntil: timestamp("blocked_until", { withTimezone: true }).notNull(),
  createdByUserId: integer("created_by_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type IpBlock = typeof ipBlocksTable.$inferSelect;