import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable, transactionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

const FCFA_PER_USD = 620;
const PAXITY_API_BASE = "https://paxity.io/api/v1";

async function verifyPaxityTransaction(reference: string): Promise<{
  verified: boolean;
  status: string;
  amount?: number;
  currency?: string;
  idClient?: string;
}> {
  const token = process.env.PAXITY_APP_TOKEN;
  if (!token || !reference) return { verified: false, status: "missing_token" };

  try {
    const res = await fetch(`${PAXITY_API_BASE}/transaction/pay-in-mobile/merchant`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) return { verified: false, status: `api_error_${res.status}` };

    const data: unknown = await res.json();

    if (Array.isArray(data)) {
      const tx = data.find((t: Record<string, unknown>) =>
        t.reference === reference || t.transactionId === reference || t.id === reference
      );
      if (tx) {
        const status = String((tx as Record<string, unknown>).status ?? "").toUpperCase();
        return {
          verified: status === "SUCCESS" || status === "COMPLETED" || status === "PAID",
          status,
          amount: Number((tx as Record<string, unknown>).amount ?? 0),
          currency: String((tx as Record<string, unknown>).currency ?? "XOF"),
          idClient: String((tx as Record<string, unknown>).idClient ?? (tx as Record<string, unknown>).clientId ?? ""),
        };
      }
    }

    return { verified: false, status: "not_found" };
  } catch (err) {
    console.error("[Paxity verify]", err);
    return { verified: false, status: "fetch_error" };
  }
}

router.post("/v1/webhooks/paxity", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body ?? {};
    console.log("[Paxity IPN] Received:", JSON.stringify(body));

    const rawStatus: string = (body.status ?? body.paymentStatus ?? "").toUpperCase();
    const idClientRaw: string = String(body.idClient ?? body.clientId ?? body.merchantRef ?? "");
    const rawAmount: number = Number(body.amount ?? body.transactionAmount ?? 0);
    const currency: string = (body.currency ?? "XOF").toUpperCase();
    const reference: string = String(body.reference ?? body.transactionId ?? body.transactionRef ?? "");

    if (!rawStatus && !reference) {
      res.status(400).json({ error: "Missing status and reference" });
      return;
    }

    let finalStatus = rawStatus;
    let finalAmount = rawAmount;
    let finalCurrency = currency;
    let finalIdClient = idClientRaw;

    if (reference) {
      const verified = await verifyPaxityTransaction(reference);
      console.log("[Paxity IPN] Verification:", verified);
      if (verified.status && verified.status !== "missing_token" && verified.status !== "fetch_error") {
        finalStatus = verified.status;
        if (verified.amount) finalAmount = verified.amount;
        if (verified.currency) finalCurrency = verified.currency;
        if (verified.idClient) finalIdClient = verified.idClient || idClientRaw;
      }
    }

    if (finalStatus !== "SUCCESS" && finalStatus !== "COMPLETED" && finalStatus !== "PAID") {
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

    const amountUsd = finalCurrency === "USD"
      ? finalAmount
      : finalAmount / FCFA_PER_USD;
    const amountFcfa = finalCurrency === "XOF"
      ? finalAmount
      : Math.round(finalAmount * FCFA_PER_USD);

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
      type: "recharge",
      amountUsd,
      amountFcfa,
      method: "paxity",
      provider: "paxity",
      status: "completed",
      reference: reference || null,
      metadata: JSON.stringify({ ipnPayload: body }),
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
