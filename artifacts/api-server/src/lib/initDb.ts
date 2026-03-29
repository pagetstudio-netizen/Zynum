import crypto from "crypto";
import { db, usersTable, socialLinksTable, paymentProvidersTable } from "@workspace/db";
import { sql } from "drizzle-orm";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function generateApiKey(): string {
  return `zyn_${crypto.randomBytes(32).toString("hex")}`;
}

async function ensureSchema() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "users" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" text NOT NULL,
      "email" text NOT NULL,
      "password_hash" text NOT NULL,
      "api_key" text,
      "balance_usd" real DEFAULT 0 NOT NULL,
      "is_admin" boolean DEFAULT false NOT NULL,
      "is_banned" boolean DEFAULT false NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "users_email_unique" UNIQUE("email"),
      CONSTRAINT "users_api_key_unique" UNIQUE("api_key")
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "sessions" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" integer NOT NULL,
      "token" text NOT NULL,
      "expires_at" timestamp with time zone NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "sessions_token_unique" UNIQUE("token")
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "orders" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" integer NOT NULL,
      "external_id" text NOT NULL,
      "phone" text NOT NULL,
      "service" text NOT NULL,
      "service_name" text NOT NULL,
      "country" text NOT NULL,
      "country_name" text NOT NULL,
      "status" text DEFAULT 'PENDING' NOT NULL,
      "sms_code" text,
      "sms_text" text,
      "price_usd" real DEFAULT 0 NOT NULL,
      "price_fcfa" real DEFAULT 0 NOT NULL,
      "currency" text DEFAULT 'USD' NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "transactions" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" integer NOT NULL,
      "type" text DEFAULT 'recharge' NOT NULL,
      "amount_usd" real NOT NULL,
      "amount_fcfa" real NOT NULL,
      "method" text NOT NULL,
      "provider" text,
      "status" text DEFAULT 'pending' NOT NULL,
      "reference" text,
      "metadata" text,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "admin_settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "key" text NOT NULL,
      "value" text NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "admin_settings_key_unique" UNIQUE("key")
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "admin_messages" (
      "id" serial PRIMARY KEY NOT NULL,
      "sender_id" integer NOT NULL,
      "type" text DEFAULT 'popup' NOT NULL,
      "target" text DEFAULT 'all' NOT NULL,
      "subject" text,
      "content" text NOT NULL,
      "sent_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "payment_providers" (
      "id" serial PRIMARY KEY NOT NULL,
      "category" text NOT NULL,
      "name" text NOT NULL,
      "slug" text NOT NULL,
      "is_active" boolean DEFAULT false NOT NULL,
      "is_selected" boolean DEFAULT false NOT NULL,
      "config" text,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "payment_providers_slug_unique" UNIQUE("slug")
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "faq_articles" (
      "id" serial PRIMARY KEY NOT NULL,
      "type" text DEFAULT 'faq' NOT NULL,
      "category" text,
      "question" text NOT NULL,
      "answer" text NOT NULL,
      "lang" text DEFAULT 'fr' NOT NULL,
      "is_active" boolean DEFAULT true NOT NULL,
      "sort_order" integer DEFAULT 0 NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "social_links" (
      "id" serial PRIMARY KEY NOT NULL,
      "platform" text NOT NULL,
      "url" text NOT NULL,
      "icon" text,
      "is_active" boolean DEFAULT true NOT NULL,
      "sort_order" integer DEFAULT 0 NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "social_links_platform_unique" UNIQUE("platform")
    )
  `);
  // Ensure the unique constraint exists on already-created tables (idempotent)
  await db.execute(sql`
    ALTER TABLE social_links ADD CONSTRAINT social_links_platform_unique UNIQUE (platform)
  `).catch(() => { /* constraint already exists, ignore */ });
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "country_overrides" (
      "id" serial PRIMARY KEY NOT NULL,
      "country_slug" text NOT NULL,
      "country_name" text NOT NULL,
      "is_disabled" boolean DEFAULT false NOT NULL,
      "price_multiplier" real DEFAULT 1 NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "country_overrides_country_slug_unique" UNIQUE("country_slug")
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "contact_messages" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" text NOT NULL,
      "email" text NOT NULL,
      "subject" text NOT NULL,
      "message" text NOT NULL,
      "is_read" boolean DEFAULT false NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "api_waitlist" (
      "id" serial PRIMARY KEY NOT NULL,
      "email" text NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "api_waitlist_email_unique" UNIQUE("email")
    )
  `);
}

async function seedData() {
  const adminEmail = "pagetstudio@gmail.com";
  const adminPassword = "AAbb11##";

  await db
    .insert(usersTable)
    .values({
      name: "Admin",
      email: adminEmail,
      passwordHash: hashPassword(adminPassword),
      apiKey: generateApiKey(),
      balanceUsd: 0,
      isAdmin: true,
      isBanned: false,
    })
    .onConflictDoUpdate({
      target: usersTable.email,
      set: { isAdmin: true, name: "Admin" },
    });

  const socials = [
    { platform: "WhatsApp", url: "https://whatsapp.com/channel/0029Vb8MmTnHQbS8sEmxvd3z", icon: "whatsapp", isActive: true, sortOrder: 1 },
    { platform: "Facebook", url: "https://facebook.com/zynum",  icon: "facebook", isActive: true, sortOrder: 2 },
    { platform: "Discord",  url: "https://discord.gg/zynum",    icon: "discord",  isActive: true, sortOrder: 3 },
    { platform: "Telegram", url: "https://t.me/ZyNumSupport",   icon: "telegram", isActive: true, sortOrder: 4 },
    { platform: "YouTube",  url: "https://youtube.com/@zynum",  icon: "youtube",  isActive: true, sortOrder: 5 },
    { platform: "X",        url: "https://x.com/zynum",         icon: "x",        isActive: true, sortOrder: 6 },
  ];
  for (const s of socials) {
    await db.insert(socialLinksTable).values(s).onConflictDoNothing();
  }

  const providers = [
    {
      category: "mobile_money",
      name: "Paxity – Mobile Money",
      slug: "paxity",
      isActive: true,
      isSelected: true,
      config: JSON.stringify({
        countries: ["SN","CI","CM","BJ","BF","GH","GN","KE","ML","NG","TG"],
        operators: ["WAVESN","OMSN","MTNCI","WAVECI","OMCI","MTNCM","OMCM","MOOVBJ","MTNBJ","MOOVBF","OMBF","ATGH","MTNGH","TLGH","MTNGN","OMGN","MPESAKE","MOOVML","OMML","MTNNG","OPNG","TMONEYTG","MOOVTG"],
        apiUrl: "https://transaction.paxity.io/api/v1",
      }),
    },
    {
      category: "card",
      name: "Paxity – Carte bancaire",
      slug: "paxity_card",
      isActive: true,
      isSelected: true,
      config: JSON.stringify({ currencies: ["XOF","XAF"], apiUrl: "https://transaction.paxity.io/api/v1" }),
    },
  ];
  for (const p of providers) {
    await db
      .insert(paymentProvidersTable)
      .values(p)
      .onConflictDoUpdate({
        target: paymentProvidersTable.slug,
        set: { name: p.name, isActive: p.isActive, isSelected: p.isSelected, config: p.config },
      });
  }
}

export async function initDb() {
  try {
    console.log("Initializing database schema...");
    await ensureSchema();
    console.log("Seeding initial data...");
    await seedData();
    console.log("Database ready.");
  } catch (err) {
    console.error("Database initialization failed:", err);
    throw err;
  }
}
