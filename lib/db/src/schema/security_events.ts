import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";

export const securityEventsTable = pgTable("security_events", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(),
  severity: text("severity").notNull().default("info"),
  ip: text("ip").notNull(),
  countryCode: text("country_code"),
  countryName: text("country_name"),
  userId: integer("user_id"),
  email: text("email"),
  method: text("method"),
  path: text("path"),
  statusCode: integer("status_code"),
  details: text("details"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SecurityEvent = typeof securityEventsTable.$inferSelect;