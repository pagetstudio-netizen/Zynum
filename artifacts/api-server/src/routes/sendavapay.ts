import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable, transactionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import crypto from "node:crypto";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { requireAdmin } from "../middlewares/adminMiddleware.js";
import { notifyDeposit } from "../lib/telegram.js";
import { tryAcquireRef, releaseRef } from "../lib/paymentLock.js";

const router: IRouter = Router();

const SENDAVA_BASE    = "https://sendavapay.com/api/sdk/v1";
const FCFA_PER_USD    = 620;

const CURRENCY_TO_USD: Record<string, number> = {
  XOF: 1 / 620,
  XAF: 1 / 620,
  CDF: 1 / 2800,
  GNF: 1 / 9600,
  USD: 1,
};

interface OpMeta { countryCode: string; namePart: string; currency: string; }

const OP_META: Record<string, OpMeta> = {
  VODACOM_CD: { countryCode: "COD", namePart: "vodacom", currency: "CDF" },
  AIRTEL_CD:  { countryCode: "COD", namePart: "airtel",  currency: "CDF" },
  ORANGE_CD:  { countryCode: "COD", namePart: "orange",  currency: "CDF" },
  MTN_CG:     { countryCode: "COG", namePart: "mtn",     currency: "XAF" },
  AIRTEL_CG:  { countryCode: "COG", namePart: "airtel",  currency: "XAF" },
};

function getSdkKey(): string {
  const k = process.env.SENDAVAPAY_SDK_KEY ?? "";
  if (!k) throw new Error("SENDAVAPAY_SDK_KEY non configuré");
  return k;
}

function getWebhookSecret(): string {
  return process.env.SENDAVAPAY_WEBHOOK_SECRET ?? "";
}

function generateExtRef(userId: string | number): string {
  return `ZNUM${Date.now()}U${userId}`;
}

async function sdkGet(path: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${SENDAVA_BASE}${path}`, {
    headers: { "Authorization": `Bearer ${getSdkKey()}`, "Content-Type": "application/json" },
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

async function sdkPost(path: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch(`${SENDAVA_BASE}${path}`, {
    method:  "POST",
    headers: { "Authorization": `Bearer ${getSdkKey()}`, "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

async function corsPost(path: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch(`${SENDAVA_BASE}${path}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

async function resolveOperatorId(countryCode: string, namePart: string): Promise<string | null> {
  try {
    const data = await fetch(`${SENDAVA_BASE}/operators/${countryCode}`)
      .then(r => r.json()) as { success?: boolean; data?: Array<{id: string; name: string}> };
    if (!data.success || !Array.isArray(data.data)) return null;
    const op = data.data.find(o => o.name.toLowerCase().includes(namePart.toLowerCase()));
    return op?.id ?? null;
  } catch { return null; }
}

function buildMsisdn(phone: string, countryCode: string): string {
  const prefixMap: Record<string, string> = {
    COD: "243", COG: "242",
  };
  const prefix = prefixMap[countryCode] ?? "";
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("00" + prefix)) return "+" + digits.slice(2);
  if (prefix && digits.startsWith(prefix) && digits.length > 8) return "+" + digits;
  if (prefix) return "+" + prefix + digits;
  return "+" + digits;
}

function verifyWebhookSignature(rawBody: Buffer, signature: string, secret: string): boolean {
  if (!secret) return true;
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try { return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected)); }
  catch { return false; }
}

// ─── POST /v1/payments/sendavapay/initiate ────────────────────────────────────
router.post("/v1/payments/sendavapay/initiate", async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, userId, phone, operatorId: operatorKey, firstName, lastName } = req.body ?? {};

    if (!amount || !userId || !phone || !operatorKey) {
      res.status(400).json({ error: "Champs requis : amount, userId, phone, operatorId" });
      return;
    }

    const opMeta = OP_META[String(operatorKey)];
    if (!opMeta) {
      res.status(400).json({ error: `Opérateur SendavaPay inconnu : ${operatorKey}` });
      return;
    }

    const uid       = parseInt(String(userId), 10);
    const rawAmount = Math.round(Number(amount));
    const extRef    = generateExtRef(uid);
    const msisdn    = buildMsisdn(String(phone), opMeta.countryCode);
    const baseUrl   = process.env.API_BASE_URL ?? `https://${process.env.REPLIT_DEV_DOMAIN ?? "zynum.net"}`;
    const webhookUrl = `${baseUrl}/api/v1/webhooks/sendavapay`;

    const rate       = CURRENCY_TO_USD[opMeta.currency] ?? CURRENCY_TO_USD.XOF;
    const amountUsd  = rawAmount * rate;
    const amountFcfa = opMeta.currency === "XOF" ? rawAmount : Math.round(amountUsd * FCFA_PER_USD);

    // 1. Create payment (server-side, gets paymentToken)
    const createRes = await sdkPost("/create-payment", {
      amount:            rawAmount,
      currency:          opMeta.currency,
      description:       "Recharge ZyNum",
      customerName:      `${String(firstName ?? "ZyNum")} ${String(lastName ?? `User${uid}`)}`.trim(),
      customerPhone:     msisdn,
      payerCountry:      opMeta.countryCode,
      webhookUrl,
      externalReference: extRef,
      metadata:          { userId: uid, operatorKey },
    });

    console.log("[SendavaPay create-payment]", JSON.stringify(createRes).slice(0, 400));

    if (!createRes.success) {
      const errCode = String((createRes as any)?.code ?? (createRes as any)?.error ?? "");
      if (errCode === "DUPLICATE_REFERENCE") {
        res.status(409).json({ error: "Référence dupliquée. Veuillez réessayer." });
        return;
      }
      res.status(400).json({ success: false, error: String((createRes as any)?.error ?? "Paiement refusé"), raw: createRes });
      return;
    }

    const createData  = createRes.data as Record<string, unknown>;
    const reference   = String(createData.reference ?? "");
    const paymentToken = String(createData.paymentToken ?? "");

    // 2. Pre-save pending transaction
    if (!isNaN(uid) && uid > 0) {
      try {
        await db.insert(transactionsTable).values({
          userId:     uid,
          type:       "recharge",
          amountUsd,
          amountFcfa,
          method:     "sendavapay",
          provider:   "sendavapay",
          status:     "pending",
          reference,
          metadata:   JSON.stringify({ operatorKey, msisdn, currency: opMeta.currency, extRef, paymentToken }),
        });
      } catch (dbErr) { console.warn("[SendavaPay] DB pre-insert:", dbErr); }
    }

    // 3. Resolve SendavaPay operator ID
    const sendavaOpId = await resolveOperatorId(opMeta.countryCode, opMeta.namePart);
    if (!sendavaOpId) {
      console.warn(`[SendavaPay] Operator not found for ${opMeta.countryCode}/${opMeta.namePart}`);
      res.status(400).json({ success: false, error: "Opérateur indisponible sur SendavaPay actuellement." });
      return;
    }

    // 4. Initiate payment (CORS endpoint, uses paymentToken — proxied server-side)
    const initiateRes = await corsPost("/initiate-payment", {
      paymentToken,
      payerName:    `${String(firstName ?? "ZyNum")} ${String(lastName ?? `User${uid}`)}`.trim(),
      payerPhone:   msisdn,
      payerCountry: opMeta.countryCode,
      operatorId:   sendavaOpId,
    });

    console.log("[SendavaPay initiate-payment]", JSON.stringify(initiateRes).slice(0, 400));

    if (!initiateRes.success) {
      res.status(400).json({ success: false, error: String((initiateRes as any)?.message ?? "Initiation refusée"), reference });
      return;
    }

    // Handle OTP flow — store otpToken in DB metadata for confirm-otp step
    if (initiateRes.requiresOtp && initiateRes.otpToken) {
      try {
        await db.update(transactionsTable)
          .set({ metadata: JSON.stringify({ operatorKey, msisdn, currency: opMeta.currency, extRef, paymentToken, otpToken: String(initiateRes.otpToken) }) })
          .where(eq(transactionsTable.reference, reference));
      } catch { /* ignore */ }
      res.json({ success: true, reference, needsOtp: true });
      return;
    }

    // Handle redirect flow (Wave, etc.)
    if (initiateRes.requiresRedirect && initiateRes.redirectUrl) {
      res.json({ success: true, reference, redirectUrl: String(initiateRes.redirectUrl) });
      return;
    }

    // Standard push notification flow
    res.json({ success: true, reference });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur interne";
    console.error("[SendavaPay initiate] Error:", message);
    res.status(500).json({ error: "initiate_error", message });
  }
});

// ─── POST /v1/payments/sendavapay/confirm-otp ─────────────────────────────────
router.post("/v1/payments/sendavapay/confirm-otp", async (req: Request, res: Response): Promise<void> => {
  try {
    const { reference, otp } = req.body ?? {};

    if (!reference || !otp) {
      res.status(400).json({ error: "Champs requis : reference, otp" });
      return;
    }

    // Retrieve stored otpToken from DB
    const [tx] = await db
      .select({ metadata: transactionsTable.metadata })
      .from(transactionsTable)
      .where(eq(transactionsTable.reference, String(reference)))
      .limit(1);

    let otpToken: string | null = null;
    if (tx?.metadata) {
      try {
        const meta = JSON.parse(String(tx.metadata));
        otpToken = meta.otpToken ?? null;
      } catch { /* ignore */ }
    }

    if (!otpToken) {
      res.status(400).json({ error: "Session OTP introuvable. Veuillez recommencer." });
      return;
    }

    const data = await corsPost("/submit-otp", { otpToken, otp: String(otp) });
    console.log("[SendavaPay submit-otp]", JSON.stringify(data).slice(0, 300));

    if (!data.success) {
      res.status(400).json({ ...data });
      return;
    }

    res.json({ success: true, reference: String(reference), message: String(data.message ?? "OTP accepté. Paiement en cours.") });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur interne";
    console.error("[SendavaPay confirm-otp] Error:", message);
    res.status(500).json({ error: "confirm_otp_error", message });
  }
});

// ─── POST /v1/payments/sendavapay/confirm — vérifier / créditer ───────────────
router.post("/v1/payments/sendavapay/confirm", async (req: Request, res: Response): Promise<void> => {
  try {
    const { reference, userId } = req.body ?? {};

    if (!reference || !userId) {
      res.status(400).json({ error: "Champs requis : reference, userId" });
      return;
    }

    const uid = parseInt(String(userId), 10);
    if (isNaN(uid) || uid <= 0) {
      res.status(400).json({ error: "userId invalide" });
      return;
    }

    if (!tryAcquireRef(String(reference))) {
      res.json({ credited: true, action: "already_processing" });
      return;
    }
    try {

      const [existing] = await db
        .select({ id: transactionsTable.id, status: transactionsTable.status })
        .from(transactionsTable)
        .where(eq(transactionsTable.reference, String(reference)))
        .limit(1);

      if (existing?.status === "completed") {
        res.json({ credited: true, action: "already_credited" });
        return;
      }

      const data = await sdkPost("/verify-payment", { reference: String(reference) });
      console.log("[SendavaPay verify-payment]", JSON.stringify(data).slice(0, 300));

      if (!data.success) {
        res.status(400).json({ credited: false, error: String((data as any)?.error ?? "Vérification échouée") });
        return;
      }

      const txData   = (data.data ?? data) as Record<string, unknown>;
      const status   = String(txData.status ?? "").toLowerCase();

      if (status === "failed" || status === "cancelled") {
        res.json({ credited: false, failed: true, status, message: "Transaction échouée ou annulée." });
        return;
      }
      if (status !== "completed") {
        res.json({ credited: false, status, message: "Paiement en attente de confirmation." });
        return;
      }

      const rawAmount  = parseFloat(String(txData.amount ?? 0));
      const currency   = String(txData.currency ?? "XOF").toUpperCase();
      const rate       = CURRENCY_TO_USD[currency] ?? CURRENCY_TO_USD.XOF;
      const amountUsd  = rawAmount * rate;
      const amountFcfa = currency === "XOF" ? rawAmount : Math.round(amountUsd * FCFA_PER_USD);

      const [user] = await db.select({ id: usersTable.id }).from(usersTable)
        .where(eq(usersTable.id, uid)).limit(1);
      if (!user) {
        res.status(404).json({ error: "Utilisateur introuvable" });
        return;
      }

      await db.update(usersTable)
        .set({ balanceUsd: sql`${usersTable.balanceUsd} + ${amountUsd}` })
        .where(eq(usersTable.id, uid));

      if (existing) {
        await db.update(transactionsTable)
          .set({ status: "completed", amountUsd, amountFcfa })
          .where(eq(transactionsTable.reference, String(reference)));
      } else {
        await db.insert(transactionsTable).values({
          userId: uid, type: "recharge", amountUsd, amountFcfa,
          method: "sendavapay", provider: "sendavapay", status: "completed",
          reference: String(reference),
          metadata: JSON.stringify({ source: "manual_confirm", verifyData: txData }),
        });
      }

      console.log(`[SendavaPay confirm] Crédité $${amountUsd.toFixed(4)} → user #${uid}`);
      res.json({ credited: true, action: "credited", amountUsd });

      db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, uid)).limit(1).then(([u]) => {
        notifyDeposit({
          userId: uid, userName: u?.name ?? `User#${uid}`,
          amountFcfa, amountUsd, reference: String(reference),
          method: "SendavaPay", phone: String(txData.customerPhone ?? ""),
          operator: String(txData.paymentMethod ?? ""),
        }).catch(() => {});
      }).catch(() => {});

    } finally { releaseRef(String(reference)); }

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur";
    console.error("[SendavaPay confirm] Error:", message);
    res.status(500).json({ error: "confirm_error", message });
  }
});

// ─── POST /v1/webhooks/sendavapay — callback signé HMAC ──────────────────────
router.post("/v1/webhooks/sendavapay", async (req: Request, res: Response): Promise<void> => {
  try {
    const rawBody    = (req as any).rawBody as Buffer | undefined;
    const signature  = String(req.headers["x-sendavapay-signature"] ?? "");
    const eventType  = String(req.headers["x-sendavapay-event"] ?? req.body?.event ?? "");
    const webhookSecret = getWebhookSecret();

    // Verify HMAC signature
    if (webhookSecret && rawBody) {
      if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        console.warn("[SendavaPay webhook] Invalid signature");
        res.status(401).json({ error: "Invalid signature" });
        return;
      }
    }

    const body      = req.body ?? {};
    const event     = String(body.event ?? eventType);
    const reference = String(body.reference ?? "");

    console.log("[SendavaPay webhook] Event:", event, "Ref:", reference);

    // Only process payment.completed
    if (event !== "payment.completed") {
      res.json({ received: true, action: "ignored", event });
      return;
    }

    if (!reference) {
      res.status(400).json({ error: "Missing reference" });
      return;
    }

    if (!tryAcquireRef(reference)) {
      res.json({ received: true, action: "already_processing" });
      return;
    }
    try {

      const [existing] = await db
        .select({ id: transactionsTable.id, status: transactionsTable.status, userId: transactionsTable.userId })
        .from(transactionsTable)
        .where(eq(transactionsTable.reference, reference))
        .limit(1);

      if (existing?.status === "completed") {
        res.json({ received: true, action: "duplicate_ignored" });
        return;
      }

      const rawAmount  = parseFloat(String(body.amount ?? 0));
      const currency   = String(body.currency ?? "XOF").toUpperCase();
      const rate       = CURRENCY_TO_USD[currency] ?? CURRENCY_TO_USD.XOF;
      const amountUsd  = rawAmount * rate;
      const amountFcfa = currency === "XOF" ? rawAmount : Math.round(amountUsd * FCFA_PER_USD);

      // Resolve userId: from existing transaction or from externalReference pattern
      let userId: number | null = existing?.userId ?? null;
      if (!userId) {
        const extRef = String(body.externalReference ?? "");
        const match  = extRef.match(/U(\d+)$/);
        if (match) userId = parseInt(match[1], 10);
      }

      if (!userId || isNaN(userId)) {
        console.error("[SendavaPay webhook] Cannot resolve userId, ref:", reference);
        res.status(400).json({ error: "Cannot resolve userId" });
        return;
      }

      const [user] = await db.select({ id: usersTable.id }).from(usersTable)
        .where(eq(usersTable.id, userId)).limit(1);
      if (!user) {
        res.status(404).json({ error: "Utilisateur introuvable" });
        return;
      }

      await db.update(usersTable)
        .set({ balanceUsd: sql`${usersTable.balanceUsd} + ${amountUsd}` })
        .where(eq(usersTable.id, userId));

      if (existing) {
        await db.update(transactionsTable)
          .set({ status: "completed", amountUsd, amountFcfa })
          .where(eq(transactionsTable.reference, reference));
      } else {
        await db.insert(transactionsTable).values({
          userId, type: "recharge", amountUsd, amountFcfa,
          method: "sendavapay", provider: "sendavapay", status: "completed",
          reference,
          metadata: JSON.stringify({ source: "webhook", event, payload: body }),
        });
      }

      console.log(`[SendavaPay webhook] Crédité $${amountUsd.toFixed(4)} → user #${userId}`);
      res.json({ received: true, action: "credited", amountUsd, userId });

      db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId)).limit(1).then(([u]) => {
        notifyDeposit({
          userId, userName: u?.name ?? `User#${userId}`,
          amountFcfa, amountUsd, reference,
          method: "SendavaPay",
          phone:  String(body.customerPhone ?? ""),
          operator: String(body.paymentMethod ?? ""),
        }).catch(() => {});
      }).catch(() => {});

    } finally { releaseRef(reference); }

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur webhook";
    console.error("[SendavaPay webhook] Error:", message);
    res.status(500).json({ error: "webhook_error", message });
  }
});

// ─── Admin : solde SendavaPay ─────────────────────────────────────────────────
router.get("/v1/admin/sendavapay/balance", requireAuth, requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await sdkGet("/balance");
    res.json({ success: true, data: (data as any)?.data ?? data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur";
    res.status(500).json({ error: message });
  }
});

export default router;
