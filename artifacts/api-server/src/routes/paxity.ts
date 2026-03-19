import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable, transactionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

const XOF_TO_USD = 1 / 620;

router.post("/v1/webhooks/paxity", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body ?? {};

    const status: string = (body.status ?? body.paymentStatus ?? "").toUpperCase();
    const idClient: string = String(body.idClient ?? body.clientId ?? body.merchantRef ?? "");
    const rawAmount: number = Number(body.amount ?? body.transactionAmount ?? 0);
    const currency: string = (body.currency ?? "XOF").toUpperCase();
    const reference: string = String(body.reference ?? body.transactionId ?? body.transactionRef ?? "");

    if (!idClient) {
      res.status(400).json({ error: "Missing idClient" });
      return;
    }

    if (status !== "SUCCESS" && status !== "COMPLETED" && status !== "PAID") {
      res.json({ received: true, action: "ignored", status });
      return;
    }

    const userId = parseInt(idClient, 10);
    if (isNaN(userId) || userId <= 0) {
      res.status(400).json({ error: "Invalid idClient format" });
      return;
    }

    const amountUsd = currency === "USD" ? rawAmount : rawAmount * XOF_TO_USD;
    const amountFcfa = currency === "XOF" ? rawAmount : rawAmount * 620;

    const [user] = await db
      .select({ id: usersTable.id, balanceUsd: usersTable.balanceUsd })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found", idClient });
      return;
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
      reference,
      metadata: JSON.stringify({ paxityPayload: body }),
    });

    res.json({ received: true, action: "credited", amountUsd, userId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur webhook";
    console.error("[Paxity IPN]", message);
    res.status(500).json({ error: "webhook_error", message });
  }
});

export default router;
