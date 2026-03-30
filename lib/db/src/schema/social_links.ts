import { pgTable, text, serial, timestamp, boolean, integer, unique } from "drizzle-orm/pg-core";

export const socialLinksTable = pgTable("social_links", {
  id: serial("id").primaryKey(),
  platform: text("platform").notNull(),
  url: text("url").notNull(),
  icon: text("icon"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique("social_links_platform_unique").on(t.platform),
]);

export type SocialLink = typeof socialLinksTable.$inferSelect;
