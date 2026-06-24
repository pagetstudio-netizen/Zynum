import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable, transactionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { notifyDeposit } from "../lib/telegram.js";

const router: IRouter = Router();

const OXAPAY_BASE   = "https://api.oxapay.com";
const FCFA_PER_USD  = 620;

function getMerchantKey(): string {
  return process.env.OXAPAY_MERCHANT_KEY ?? "";
}

function getBaseUrl(): string {
  return process.env.API_BASE_URL ?? "https://zynum.net";
}

/* ── POST /api/v1/payments/oxapay/create ───────────────────────── */
router.post("/v1/payments/oxapay/create", requireAuth, async (req: Request, res: Response) => {
  const merchantKey = getMerchantKey();
  if (!merchantKey) {
    res.status(503).json({ error: "OxaPay non configuré." });
    return;
  }

  const { amountXof, amountUsd, userId } = req.body as {
    amountXof?: number;
    amountUsd?: number;
    userId?: string;
  };

  if (!userId) {
    res.status(400).json({ error: "userId requis." });
    return;
  }

  const usd = amountUsd
    ? Number(amountUsd)
    : amountXof
    ? Number(amountXof) / FCFA_PER_USD
    : 0;

  if (!usd || usd < 0.5) {
    res.status(400).json({ error: "Montant minimum : $0.50 USD." });
    return;
  }

  const baseUrl  = getBaseUrl();
  const orderId  = `ZNUM_CRYPTO_${Date.now()}_U${userId}`;
  const callbackUrl = `${baseUrl}/api/v1/payments/oxapay/webhook`;
  const returnUrl   = `${baseUrl}/dashboard/recharge?crypto=success`;

  try {
    const payload = {
      merchant:    merchantKey,
      amount:      Number(usd.toFixed(2)),
      currency:    "USD",
      lifeTime:    60,
      feePaidByPayer: 0,
      callbackUrl,
      returnUrl,
      description: `Recharge ZyNum — Utilisateur #${userId}`,
      orderId,
    };

    const oxaRes = await fetch(`${OXAPAY_BASE}/merchants/request`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    const oxaJson = (await oxaRes.json()) as Record<string, unknown>;

    if (!oxaRes.ok || oxaJson.result !== "OK") {
      const msg = String(oxaJson.message ?? oxaJson.result ?? "Erreur OxaPay");
      res.status(502).json({ error: msg });
      return;
    }

    const trackId = String(oxaJson.trackId ?? "");
    const payLink = String(oxaJson.payLink ?? "");

    // Enregistrer la transaction en attente
    await db.insert(transactionsTable).values({
      userId:     String(userId),
      type:       "deposit",
      amountUsd:  String(usd.toFixed(4)),
      amountFcfa: String(Math.round(usd * FCFA_PER_USD)),
      method:     "crypto",
      provider:   "oxapay",
      status:     "pending",
      reference:  orderId,
      metadata:   JSON.stringify({ trackId, amountUsd: usd }),
    });

    res.json({ success: true, trackId, payLink, orderId });
  } catch (err) {
    console.error("[OxaPay] create error:", err);
    res.status(500).json({ error: "Erreur interne lors de la création de la facture." });
  }
});

/* ── POST /api/v1/payments/oxapay/status ───────────────────────── */
router.post("/v1/payments/oxapay/status", requireAuth, async (req: Request, res: Response) => {
  const merchantKey = getMerchantKey();
  if (!merchantKey) {
    res.status(503).json({ error: "OxaPay non configuré." });
    return;
  }

  const { trackId, orderId, userId } = req.body as {
    trackId?: string;
    orderId?: string;
    userId?: string;
  };

  if (!trackId || !userId) {
    res.status(400).json({ error: "trackId et userId requis." });
    return;
  }

  try {
    const oxaRes = await fetch(`${OXAPAY_BASE}/merchants/inquiry`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ merchant: merchantKey, trackId }),
    });

    const oxaJson = (await oxaRes.json()) as Record<string, unknown>;

    if (!oxaRes.ok || oxaJson.result !== "OK") {
      res.json({ status: "pending" });
      return;
    }

    const status = String(oxaJson.status ?? "");

    if (status === "Paid" || status === "Confirming") {
      // Vérifier si déjà crédité
      const ref = orderId ?? `ZNUM_CRYPTO_${trackId}`;
      const existing = await db
        .select({ status: transactionsTable.status })
        .from(transactionsTable)
        .where(eq(transactionsTable.reference, ref))
        .limit(1);

      if (existing[0]?.status === "completed") {
        res.json({ status: "paid", credited: true });
        return;
      }

      if (status === "Paid") {
        // Créditer l'utilisateur
        const txRow = await db
          .select()
          .from(transactionsTable)
          .where(eq(transactionsTable.reference, ref))
          .limit(1);

        if (txRow[0]) {
          const amtUsd = Number(txRow[0].amountUsd);
          await db
            .update(usersTable)
            .set({ balanceUsd: sql`${usersTable.balanceUsd} + ${amtUsd}` })
            .where(eq(usersTable.id, Number(userId)));

          await db
            .update(transactionsTable)
            .set({ status: "completed" })
            .where(eq(transactionsTable.reference, ref));

          await notifyDeposit({
            userName:  `User #${userId}`,
            amountUsd: amtUsd,
            amountXof: Math.round(amtUsd * FCFA_PER_USD),
            method:    "Crypto (OxaPay)",
            reference: ref,
          }).catch(() => {});
        }

        res.json({ status: "paid", credited: true });
        return;
      }

      res.json({ status: "confirming" });
      return;
    }

    if (status === "Expired" || status === "Failed") {
      res.json({ status: "failed", failed: true, message: "Transaction expirée ou échouée." });
      return;
    }

    res.json({ status: "pending" });
  } catch (err) {
    console.error("[OxaPay] status error:", err);
    res.status(500).json({ error: "Erreur lors de la vérification du statut." });
  }
});

/* ── POST /api/v1/payments/oxapay/webhook ──────────────────────── */
router.post("/v1/payments/oxapay/webhook", async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>;

    const status  = String(body.status  ?? "");
    const orderId = String(body.orderId ?? "");
    const trackId = String(body.trackId ?? "");
    const amount  = Number(body.amount  ?? 0);

    if (status !== "Paid") {
      res.json({ ok: true });
      return;
    }

    const existing = await db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.reference, orderId))
      .limit(1);

    const tx = existing[0];
    if (!tx || tx.status === "completed") {
      res.json({ ok: true });
      return;
    }

    const userId  = tx.userId;
    const amtUsd  = amount > 0 ? amount : Number(tx.amountUsd);

    await db
      .update(usersTable)
      .set({ balanceUsd: sql`${usersTable.balanceUsd} + ${amtUsd}` })
      .where(eq(usersTable.id, Number(userId)));

    await db
      .update(transactionsTable)
      .set({ status: "completed", metadata: JSON.stringify({ trackId, amountUsd: amtUsd, webhookReceived: true }) })
      .where(eq(transactionsTable.reference, orderId));

    await notifyDeposit({
      userName:  `User #${userId}`,
      amountUsd: amtUsd,
      amountXof: Math.round(amtUsd * FCFA_PER_USD),
      method:    "Crypto (OxaPay — webhook)",
      reference: orderId,
    }).catch(() => {});

    res.json({ ok: true });
  } catch (err) {
    console.error("[OxaPay] webhook error:", err);
    res.status(500).json({ error: "Webhook error" });
  }
});

export default router;
