import crypto from "crypto";
import { db, usersTable, socialLinksTable, paymentProvidersTable, adminSettingsTable } from "./index.js";

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
      set: { isAdmin: true, name: "Admin" },
    });

  console.log(`Admin account ready: ${adminEmail}`);

  const socials = [
    { platform: "WhatsApp", url: "https://whatsapp.com/channel/0029Vb8MmTnHQbS8sEmxvd3z", icon: "whatsapp", isActive: true, sortOrder: 1 },
    { platform: "Facebook", url: "https://facebook.com/zynum",   icon: "facebook", isActive: true, sortOrder: 2 },
    { platform: "Discord",  url: "https://discord.gg/zynum",     icon: "discord",  isActive: true, sortOrder: 3 },
    { platform: "Telegram", url: "https://t.me/ZyNumSupport",    icon: "telegram", isActive: true, sortOrder: 4 },
    { platform: "YouTube",  url: "https://youtube.com/@zynum",   icon: "youtube",  isActive: true, sortOrder: 5 },
    { platform: "X",        url: "https://x.com/zynum",          icon: "x",        isActive: true, sortOrder: 6 },
  ];

  for (const s of socials) {
    await db.insert(socialLinksTable).values(s).onConflictDoNothing();
  }

  console.log("Social links ready");

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

  console.log("Payment providers ready");

  // Seed 5sim API key from env var if present and not already in DB
  const fiveSimKey = process.env.FIVESIM_API_KEY;
  if (fiveSimKey) {
    await db
      .insert(adminSettingsTable)
      .values({ key: "fivesim_api_key", value: fiveSimKey })
      .onConflictDoNothing();
    console.log("5sim API key seeded");
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
