import crypto from "crypto";
import { db, usersTable } from "./index.js";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function generateApiKey(): string {
  return `zyn_${crypto.randomBytes(32).toString("hex")}`;
}

async function seed() {
  console.log("Seeding database...");

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
      set: {
        isAdmin: true,
        name: "Admin",
      },
    });

  console.log(`Admin account ready: ${adminEmail}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
