import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable, transactionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

const FCFA_PER_USD   = 620;
const PAXITY_TX_BASE = "https://transaction.paxity.io/api/v1";

// Mapping from our operator keys to Paxity payment method IDs
const OPERATOR_TO_PAXITY_ID: Record<string, { id: string; prefix: string; country: string }> = {
  WAVESN:    { id: "WAVESN",  prefix: "221", country: "SN" },
  OMSN:      { id: "OMSN",   prefix: "221", country: "SN" },
  WAVE:      { id: "WAVESN",  prefix: "221", country: "SN" },
  ORANGE:    { id: "OMSN",   prefix: "221", country: "SN" },
  WAVECI:    { id: "WAVECI",  prefix: "225", country: "CI" },
  OMCI:      { id: "OMCI",   prefix: "225", country: "CI" },
  MTNCI:     { id: "MTNCI",  prefix: "225", country: "CI" },
  MOOVCI:    { id: "MOOVCI", prefix: "225", country: "CI" },
};

function paxityHeaders() {
  return {
    Authorization: `Bearer ${process.env.PAXITY_APP_TOKEN ?? ""}`,
    "Content-Type": "application/json",
    "x-api-key":   process.env.PAXITY_API_KEY   ?? process.env.VITE_PAXITY_API_KEY   ?? "",
    "X-API-TOKEN": process.env.PAXITY_API_TOKEN  ?? process.env.VITE_PAXITY_API_TOKEN ?? "",
  };
}

async function verifyPaxityTransaction(reference: string): Promise<{
  verified: boolean;
  status: string;
  amount?: number;
  currency?: string;
  idClient?: string;
}> {
  if (!reference || !process.env.PAXITY_APP_TOKEN)
    return { verified: false, status: "missing_token" };
  try {
    const res = await fetch(
      `${PAXITY_TX_BASE}/transaction/get-status/${reference}`,
      { headers: paxityHeaders() }
    );
    if (!res.ok) return { verified: false, status: `api_error_${res.status}` };
    const data = (await res.json()) as Record<string, unknown>;
    const txData = (data.data ?? data) as Record<string, unknown>;
    const status = String(txData.status ?? data.status ?? "").toUpperCase();
    return {
      verified: status === "SUCCESS" || status === "COMPLETED" || status === "PAID",
      status,
      amount:   Number(txData.amount ?? data.amount ?? 0),
      currency: String(txData.currency ?? data.currency ?? "XOF"),
      idClient: String(txData.idClient ?? data.idClient ?? ""),
    };
  } catch (err) {
    console.error("[Paxity verify]", err);
    return { verified: false, status: "fetch_error" };
  }
}

// GET /v1/payments/paxity/methods?country=SN
router.get("/v1/payments/paxity/methods", async (req: Request, res: Response): Promise<void> => {
  try {
    const country = String(req.query.country ?? "SN").toUpperCase();
    const paxityRes = await fetch(
      `${PAXITY_TX_BASE}/payment-method/country/${country}`,
      { headers: paxityHeaders() }
    );
    const data = (await paxityRes.json()) as Record<string, unknown>;
    res.status(paxityRes.ok ? 200 : paxityRes.status).json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur";
    res.status(500).json({ error: message });
  }
});

// POST /v1/payments/paxity/initiate
router.post("/v1/payments/paxity/initiate", async (req: Request, res: Response): Promise<void> => {
  try {
    const { method, amount, country, currency, userId, ipn, phone, operator,
            holderName, cardNumber, expMonth, expYear, cvv } = req.body ?? {};

    if (!method || !amount || !userId) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const ipnUrl = ipn || `${process.env.API_BASE_URL ?? ""}/api/v1/webhooks/paxity`;
    const rawAmount = Math.round(Number(amount));

    let paxityRes: globalThis.Response;

    if (method === "mobile") {
      if (!phone || !operator) {
        res.status(400).json({ error: "Missing phone or operator for mobile payment" });
        return;
      }

      // Resolve the Paxity payment method info
      const pmInfo = OPERATOR_TO_PAXITY_ID[operator as string];
      if (!pmInfo) {
        res.status(400).json({ error: `Unsupported operator: ${operator}. Supported: ${Object.keys(OPERATOR_TO_PAXITY_ID).join(", ")}` });
        return;
      }

      // Strip prefix from phone number if it was included
      let phoneNumber = String(phone).replace(/\D/g, "");
      if (phoneNumber.startsWith(pmInfo.prefix)) {
        phoneNumber = phoneNumber.slice(pmInfo.prefix.length);
      }
      if (phoneNumber.startsWith("00" + pmInfo.prefix)) {
        phoneNumber = phoneNumber.slice(2 + pmInfo.prefix.length);
      }

      const body = {
        paymentMethod: pmInfo.id,
        phoneNumber,
        prefixPhone:   pmInfo.prefix,
        amount:        rawAmount,
        country:       country ?? pmInfo.country,
        currency:      currency ?? "XOF",
        ipn:           ipnUrl,
        idClient:      String(userId),
      };

      console.log("[Paxity initiate/mobile] request body:", body);

      paxityRes = await fetch(`${PAXITY_TX_BASE}/transaction/pay-in-mobile`, {
        method:  "POST",
        headers: paxityHeaders(),
        body:    JSON.stringify(body),
      });
    } else if (method === "card") {
      if (!cardNumber || !expMonth || !expYear || !cvv || !holderName) {
        res.status(400).json({ error: "Missing card details" });
        return;
      }
      paxityRes = await fetch(`${PAXITY_TX_BASE}/transaction/pay-in-card-bank`, {
        method:  "POST",
        headers: paxityHeaders(),
        body:    JSON.stringify({
          holderName,
          number:   String(cardNumber).replace(/\s/g, ""),
          expMonth: String(expMonth),
          expYear:  String(expYear),
          cvv,
          amount:   rawAmount,
          country:  country  ?? "SN",
          currency: currency ?? "XOF",
          ipn:      ipnUrl,
          idClient: String(userId),
        }),
      });
    } else {
      res.status(400).json({ error: "Invalid payment method" });
      return;
    }

    const rawBody = await paxityRes.text();
    let data: unknown;
    try { data = JSON.parse(rawBody); } catch { data = { raw: rawBody }; }

    console.log(`[Paxity initiate/${method}] status=${paxityRes.status}`, data);
    res.status(paxityRes.ok ? 200 : paxityRes.status).json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur interne";
    console.error("[Paxity initiate] Error:", message);
    res.status(500).json({ error: "initiate_error", message });
  }
});

// POST /v1/webhooks/paxity  (IPN)
router.post("/v1/webhooks/paxity", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body ?? {};
    console.log("[Paxity IPN] Received:", JSON.stringify(body));

    const rawStatus:   string = (body.status ?? body.paymentStatus ?? "").toUpperCase();
    const idClientRaw: string = String(body.idClient ?? body.clientId ?? body.merchantRef ?? "");
    const rawAmount:   number = Number(body.amount ?? body.transactionAmount ?? 0);
    const currency:    string = (body.currency ?? "XOF").toUpperCase();
    const reference:   string = String(body.reference ?? body.transactionId ?? body.transactionRef ?? "");

    if (!rawStatus && !reference) {
      res.status(400).json({ error: "Missing status and reference" });
      return;
    }

    let finalStatus   = rawStatus;
    let finalAmount   = rawAmount;
    let finalCurrency = currency;
    let finalIdClient = idClientRaw;

    if (reference) {
      const verified = await verifyPaxityTransaction(reference);
      console.log("[Paxity IPN] Verification:", verified);
      if (verified.status && !["missing_token", "fetch_error"].includes(verified.status)) {
        finalStatus   = verified.status;
        if (verified.amount)   finalAmount   = verified.amount;
        if (verified.currency) finalCurrency = verified.currency;
        if (verified.idClient) finalIdClient = verified.idClient || idClientRaw;
      }
    }

    if (!["SUCCESS", "COMPLETED", "PAID"].includes(finalStatus)) {
      res.json({ received: true, action: "ignored", status: finalStatus });
      return;
    }

    if (!finalIdClient) {
      res.status(400).json({ error: "Missing idClient" });
      return;
    }

    const userId = parseInt(finalIdClient, 10);
    if (isNaN(userId) || userId <= 0) {
      res.status(400).json({ error: "Invalid idClient", idClient: finalIdClient });
      return;
    }

    const amountUsd  = finalCurrency === "USD" ? finalAmount : finalAmount / FCFA_PER_USD;
    const amountFcfa = finalCurrency === "XOF" ? finalAmount : Math.round(finalAmount * FCFA_PER_USD);

    const [user] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found", userId });
      return;
    }

    if (reference) {
      const [existing] = await db
        .select({ id: transactionsTable.id })
        .from(transactionsTable)
        .where(eq(transactionsTable.reference, reference))
        .limit(1);
      if (existing) {
        res.json({ received: true, action: "duplicate_ignored", reference });
        return;
      }
    }

    await db.update(usersTable)
      .set({ balanceUsd: sql`${usersTable.balanceUsd} + ${amountUsd}` })
      .where(eq(usersTable.id, userId));

    await db.insert(transactionsTable).values({
      userId,
      type:      "recharge",
      amountUsd,
      amountFcfa,
      method:    "paxity",
      provider:  "paxity",
      status:    "completed",
      reference: reference || null,
      metadata:  JSON.stringify({ ipnPayload: body }),
    });

    console.log(`[Paxity IPN] Credited $${amountUsd.toFixed(2)} to user #${userId}`);
    res.json({ received: true, action: "credited", amountUsd, userId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur webhook";
    console.error("[Paxity IPN] Error:", message);
    res.status(500).json({ error: "webhook_error", message });
  }
});

export default router;
