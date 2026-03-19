import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";

export const adminMessagesTable = pgTable("admin_messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  type: text("type").notNull().default("popup"),
  target: text("target").notNull().default("all"),
  subject: text("subject"),
  content: text("content").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AdminMessage = typeof adminMessagesTable.$inferSelect;
