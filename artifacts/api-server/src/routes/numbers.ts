import { Router, type IRouter } from "express";
import { db, ordersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { BuyNumberBody, CheckSmsParams, GetOrderHistoryQueryParams } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/authMiddleware.js";
import {
  buyNumber,
  checkOrder,
  cancelOrder,
  finishOrder,
  getServiceName,
  getCountryName,
  mapFiveSimStatus,
  usdToFcfa,
} from "../lib/fivesim.js";

const router: IRouter = Router();

function formatOrder(order: typeof ordersTable.$inferSelect) {
  return {
    id: String(order.id),
    externalId: order.externalId,
    phone: order.phone,
    service: order.service,
    serviceName: order.serviceName,
    country: order.country,
    countryName: order.countryName,
    status: order.status as "PENDING" | "RECEIVED" | "FINISHED" | "TIMEOUT" | "BANNED" | "CANCELED",
    smsCode: order.smsCode ?? null,
    smsText: order.smsText ?? null,
    priceUsd: order.priceUsd,
    priceFcfa: order.priceFcfa,
    currency: order.currency,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

// ─── Buy number ───────────────────────────────────────────────────────────────
router.post("/v1/buy", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = BuyNumberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const { service, country, currency } = parsed.data;
  const userId = req.userId!;

  let fiveSimOrder;
  try {
    fiveSimOrder = await buyNumber(service, country);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur lors de l'achat du numéro";
    res.status(400).json({ error: "Purchase failed", message });
    return;
  }

  const priceUsd = fiveSimOrder.price;
  const priceFcfa = usdToFcfa(priceUsd);
  const serviceName = getServiceName(service);
  const countryName = getCountryName(country);

  const [order] = await db
    .insert(ordersTable)
    .values({
      userId,
      externalId: String(fiveSimOrder.id),
      phone: fiveSimOrder.phone,
      service,
      serviceName,
      country,
      countryName,
      status: mapFiveSimStatus(fiveSimOrder.status),
      priceUsd,
      priceFcfa,
      currency: currency ?? "USD",
    })
    .returning();

  res.json({ order: formatOrder(order) });
});

// ─── Check SMS ────────────────────────────────────────────────────────────────
router.get("/v1/check/:orderId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
  const parsed = CheckSmsParams.safeParse({ orderId: rawId });
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const [dbOrder] = await db
    .select()
    .from(ordersTable)
    .where(and(eq(ordersTable.id, parseInt(rawId, 10)), eq(ordersTable.userId, req.userId!)))
    .limit(1);

  if (!dbOrder) {
    res.status(404).json({ error: "Not found", message: "Commande introuvable" });
    return;
  }

  let updatedOrder = dbOrder;

  if (dbOrder.status === "PENDING" || dbOrder.status === "RECEIVED") {
    try {
      const fiveSimOrder = await checkOrder(parseInt(dbOrder.externalId, 10));
      const newStatus = mapFiveSimStatus(fiveSimOrder.status);
      const smsCode = fiveSimOrder.sms?.[0]?.code ?? null;
      const smsText = fiveSimOrder.sms?.[0]?.text ?? null;

      const [updated] = await db
        .update(ordersTable)
        .set({ status: newStatus, smsCode, smsText })
        .where(eq(ordersTable.id, dbOrder.id))
        .returning();

      updatedOrder = updated;
    } catch {
      // Return existing data if 5SIM check fails
    }
  }

  res.json({ order: formatOrder(updatedOrder) });
});

// ─── Cancel order ─────────────────────────────────────────────────────────────
router.post("/v1/cancel/:orderId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const rawId = req.params.orderId;

  const [dbOrder] = await db
    .select()
    .from(ordersTable)
    .where(and(eq(ordersTable.id, parseInt(rawId, 10)), eq(ordersTable.userId, req.userId!)))
    .limit(1);

  if (!dbOrder) {
    res.status(404).json({ error: "Not found", message: "Commande introuvable" });
    return;
  }

  if (dbOrder.status !== "PENDING") {
    res.status(400).json({ error: "Invalid", message: "Seules les commandes en attente peuvent être annulées" });
    return;
  }

  try {
    await cancelOrder(parseInt(dbOrder.externalId, 10));
  } catch {
    // ignore 5SIM cancel error — update DB anyway
  }

  const [updated] = await db
    .update(ordersTable)
    .set({ status: "CANCELED" })
    .where(eq(ordersTable.id, dbOrder.id))
    .returning();

  res.json({ order: formatOrder(updated) });
});

// ─── Finish/confirm order ─────────────────────────────────────────────────────
router.post("/v1/finish/:orderId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const rawId = req.params.orderId;

  const [dbOrder] = await db
    .select()
    .from(ordersTable)
    .where(and(eq(ordersTable.id, parseInt(rawId, 10)), eq(ordersTable.userId, req.userId!)))
    .limit(1);

  if (!dbOrder) {
    res.status(404).json({ error: "Not found", message: "Commande introuvable" });
    return;
  }

  try {
    await finishOrder(parseInt(dbOrder.externalId, 10));
  } catch {
    // ignore
  }

  const [updated] = await db
    .update(ordersTable)
    .set({ status: "FINISHED" })
    .where(eq(ordersTable.id, dbOrder.id))
    .returning();

  res.json({ order: formatOrder(updated) });
});

// ─── Order history ────────────────────────────────────────────────────────────
router.get("/v1/orders", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = GetOrderHistoryQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const page = parsed.data.page ?? 1;
  const limit = parsed.data.limit ?? 20;
  const offset = (page - 1) * limit;

  const { desc, count } = await import("drizzle-orm");

  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.userId, req.userId!))
    .orderBy(desc(ordersTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(ordersTable)
    .where(eq(ordersTable.userId, req.userId!));

  res.json({
    orders: orders.map(formatOrder),
    total: Number(total),
    page,
    limit,
  });
});

export default router;
