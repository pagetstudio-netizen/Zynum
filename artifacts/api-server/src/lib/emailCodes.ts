import { db, emailCodesTable } from "@workspace/db";
import { eq, and, gt, isNull } from "drizzle-orm";
import { createHash, randomBytes, timingSafeEqual } from "crypto";

export function generateCode(): string {
  const digits = "0123456789";
  let code = "";
  const bytes = randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += digits[bytes[i] % 10];
  }
  return code;
}

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

function hashCode(code: string): string {
  return createHash("sha256").update(code.trim()).digest("hex");
}

function hashesMatch(storedHash: string, code: string): boolean {
  const candidateHash = hashCode(code);
  const stored = Buffer.from(storedHash, "hex");
  const candidate = Buffer.from(candidateHash, "hex");
  return stored.length === candidate.length && timingSafeEqual(stored, candidate);
}

export async function createEmailCode(opts: {
  email: string;
  userId?: number;
  type: "verify_email" | "reset_password" | "login_2fa" | "admin_telegram";
  expiresInMinutes: number;
}): Promise<{ code: string; token: string }> {
  await db.delete(emailCodesTable).where(
    and(
      eq(emailCodesTable.email, opts.email),
      eq(emailCodesTable.type, opts.type),
    )
  );

  const code = generateCode();
  const token = generateToken();
  const expiresAt = new Date(Date.now() + opts.expiresInMinutes * 60 * 1000);

  await db.insert(emailCodesTable).values({
    email: opts.email,
    userId: opts.userId,
    code: hashCode(code),
    token,
    type: opts.type,
    expiresAt,
  });

  return { code, token };
}

export async function verifyEmailCode(opts: {
  email: string;
  code?: string;
  token?: string;
  type: "verify_email" | "reset_password" | "login_2fa" | "admin_telegram";
}): Promise<{ valid: boolean; record?: typeof emailCodesTable.$inferSelect }> {
  const conditions = [
    eq(emailCodesTable.email, opts.email),
    eq(emailCodesTable.type, opts.type),
    isNull(emailCodesTable.usedAt),
    gt(emailCodesTable.expiresAt, new Date()),
  ];

  const rows = await db.select().from(emailCodesTable).where(and(...conditions));

  const record = rows.find((r) => {
    if (opts.code && !hashesMatch(r.code, opts.code)) return false;
    if (opts.token && r.token !== opts.token) return false;
    return true;
  });

  if (!record) return { valid: false };

  const [usedRecord] = await db
    .update(emailCodesTable)
    .set({ usedAt: new Date() })
    .where(and(
      eq(emailCodesTable.id, record.id),
      isNull(emailCodesTable.usedAt),
      gt(emailCodesTable.expiresAt, new Date()),
    ))
    .returning();

  return usedRecord ? { valid: true, record: usedRecord } : { valid: false };
}

export async function verifyEmailToken(opts: {
  token: string;
  type: "verify_email" | "reset_password" | "login_2fa" | "admin_telegram";
}): Promise<{ valid: boolean; record?: typeof emailCodesTable.$inferSelect }> {
  const [record] = await db
    .select()
    .from(emailCodesTable)
    .where(eq(emailCodesTable.token, opts.token))
    .limit(1);

  if (!record) return { valid: false };
  if (record.type !== opts.type) return { valid: false };
  if (record.usedAt || record.expiresAt < new Date()) return { valid: false };

  const [usedRecord] = await db
    .update(emailCodesTable)
    .set({ usedAt: new Date() })
    .where(and(
      eq(emailCodesTable.id, record.id),
      isNull(emailCodesTable.usedAt),
      gt(emailCodesTable.expiresAt, new Date()),
    ))
    .returning();

  return usedRecord ? { valid: true, record: usedRecord } : { valid: false };
}
