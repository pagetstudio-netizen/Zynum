import { Router, type IRouter, type Response } from "express";
import { db, ordersTable, usersTable, affiliateCommissionsTable, discountCodesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { BuyNumberBody, CheckSmsParams, GetOrderHistoryQueryParams } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/authMiddleware.js";
import {
  buyNumber,
  cancelOrder,
  checkOrder,
  finishOrder,
  getOperatorsForServiceCountry,
  getServiceName,
  getServiceInfo,
  getCountryName,
  mapFiveSimStatus,
} from "../lib/fivesim.js";
import { applyTieredPricing } from "../lib/pricing.js";
import { applyDiscountCode } from "./discounts.js";
import { notifyPurchase } from "../lib/telegram.js";
import { refundOrder } from "../lib/orderRefund.js";

const router: IRouter = Router();

function isNumberUnavailableError(message: string): boolean {
  return /no\s+free|no\s+(?:available\s+)?(?:phone|number)s?|not\s+available|unavailable|out\s+of\s+stock|sold\s+out/i.test(message);
}

class InsufficientBalanceError extends Error {}

async function cancelUnpersistedPurchase(externalId: number, cancel: typeof cancelOrder): Promise<void> {
  const canceled = await cancel(externalId);
  const status = mapFiveSimStatus(canceled.status);
  if (!["CANCELED", "TIMEOUT", "BANNED"].includes(status)) {
    throw new Error(`5SIM n'a pas confirmé l'annulation (statut ${status}).`);
  }
}

function formatOrder(order: typeof ordersTable.$inferSelect) {
  const { icon: serviceIcon, color: serviceColor } = getServiceInfo(order.service);
  return {
    id: String(order.id),
    externalId: order.externalId,
    phone: order.phone,
    service: order.service,
    serviceName: order.serviceName,
    serviceIcon,
    serviceColor,
    country: order.country,
    countryName: order.countryName,
    status: order.status as "PENDING" | "RECEIVED" | "FINISHED" | "TIMEOUT" | "BANNED" | "CANCELED",
    smsCode: order.smsCode ?? null,
    smsText: order.smsText ?? null,
    priceUsd: order.priceUsd,
    priceFcfa: order.priceFcfa,
    currency: order.currency,
    purchaseSource: order.purchaseSource,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

// ─── List operators for service + country ─────────────────────────────────────
router.get("/v1/operators", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const service = typeof req.query.service === "string" ? req.query.service : "";
  const country = typeof req.query.country === "string" ? req.query.country : "";
  if (!service || !country) {
    res.status(400).json({ error: "Validation error", message: "service and country are required" });
    return;
  }
  const rawOperators = await getOperatorsForServiceCountry(service, country);
  const operators = rawOperators.map((op) => {
    const { priceUsd, priceFcfa } = applyTieredPricing(op.priceUsd);
    return { ...op, priceUsd, priceFcfa };
  });
  res.json({ operators });
});

type BuyNumberServices = {
  getOperatorsForServiceCountry: typeof getOperatorsForServiceCountry;
  buyNumber: typeof buyNumber;
  cancelOrder: typeof cancelOrder;
  applyDiscountCode: typeof applyDiscountCode;
  notifyPurchase: typeof notifyPurchase;
};

const defaultBuyNumberServices: BuyNumberServices = {
  getOperatorsForServiceCountry,
  buyNumber,
  cancelOrder,
  applyDiscountCode,
  notifyPurchase,
};

export function createBuyNumberHandler(services: BuyNumberServices = defaultBuyNumberServices) {
  return async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = BuyNumberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const { service, country, currency, operator, discountCode } = parsed.data;
  const userId = req.userId!;
  const serviceName = getServiceName(service);
  const countryName = getCountryName(country);
  const selectedOperator = operator ?? "any";

  let catalogOperators: Awaited<ReturnType<typeof getOperatorsForServiceCountry>>;
  let fiveSimOrder: Awaited<ReturnType<typeof buyNumber>>;
  try {
    catalogOperators = await services.getOperatorsForServiceCountry(service, country);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur lors de l'achat du numéro";
    if (isNumberUnavailableError(message)) {
      res.status(409).json({
        error: "NUMBER_UNAVAILABLE",
        message: "Ce numéro n’est pas disponible à l’achat. Veuillez en choisir un autre.",
      });
      return;
    }
    res.status(502).json({ error: "Purchase failed", message });
    return;
  }

  const quotedOperator = catalogOperators.find((entry) => entry.name === selectedOperator);
  if (!quotedOperator) {
    res.status(409).json({
      error: "NUMBER_UNAVAILABLE",
      message: "Ce numéro n’est pas disponible à l’achat. Veuillez en choisir un autre.",
    });
    return;
  }

  const quotedPrice = applyTieredPricing(quotedOperator.priceUsd);
  let quotePriceUsd = quotedPrice.priceUsd;
  let quotePriceFcfa = quotedPrice.priceFcfa;
  if (discountCode) {
    const quoteDiscount = await services.applyDiscountCode(
      discountCode,
      country,
      quotePriceUsd,
      quotePriceFcfa,
      { recordUsage: false },
    );
    quotePriceUsd = quoteDiscount.finalPriceUsd;
    quotePriceFcfa = quoteDiscount.finalPriceFcfa;
  }

  const [userBeforePurchase] = await db
    .select({ balanceUsd: usersTable.balanceUsd })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  if (!userBeforePurchase || userBeforePurchase.balanceUsd < quotePriceUsd) {
    res.status(400).json({
      error: "INSUFFICIENT_BALANCE",
      message: "Solde insuffisant. Veuillez recharger votre compte.",
      balanceUsd: userBeforePurchase?.balanceUsd ?? 0,
      requiredUsd: quotePriceUsd,
    });
    return;
  }

  try {
    fiveSimOrder = await services.buyNumber(service, country, selectedOperator);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur lors de l'achat du numéro";
    if (isNumberUnavailableError(message)) {
      res.status(409).json({
        error: "NUMBER_UNAVAILABLE",
        message: "Ce numéro n’est pas disponible à l’achat. Veuillez en choisir un autre.",
      });
      return;
    }
    res.status(400).json({ error: "Purchase failed", message });
    return;
  }

  let priceUsd = 0;
  let priceFcfa = 0;
  let discountResult: Awaited<ReturnType<typeof applyDiscountCode>> | undefined;
  let order: typeof ordersTable.$inferSelect;
  try {
    // Applique le prix réel et le code promo sans comptabiliser celui-ci avant validation du débit.
    ({ priceUsd, priceFcfa } = applyTieredPricing(fiveSimOrder.price));
    if (discountCode) {
      discountResult = await services.applyDiscountCode(discountCode, country, priceUsd, priceFcfa, { recordUsage: false });
      priceUsd = discountResult.finalPriceUsd;
      priceFcfa = discountResult.finalPriceFcfa;
    }

    order = await db.transaction(async (tx) => {
      const [chargedUser] = await tx
        .update(usersTable)
        .set({ balanceUsd: sql`${usersTable.balanceUsd} - ${priceUsd}` })
        .where(and(eq(usersTable.id, userId), sql`${usersTable.balanceUsd} >= ${priceUsd}`))
        .returning({ id: usersTable.id });
      if (!chargedUser) throw new InsufficientBalanceError("Solde insuffisant.");

      const [newOrder] = await tx.insert(ordersTable).values({
        userId,
        externalId: String(fiveSimOrder.id),
        phone: fiveSimOrder.phone,
        service, serviceName, country, countryName,
        status: mapFiveSimStatus(fiveSimOrder.status),
        priceUsd, priceFcfa,
        currency: currency ?? "USD",
        purchaseSource: req.userApiKey ? "api" : "web",
      }).returning();

      if (discountResult?.discountId !== null && discountResult?.discountId !== undefined) {
        await tx
          .update(discountCodesTable)
          .set({
            usedCount: sql`${discountCodesTable.usedCount} + 1`,
            totalSavedFcfa: sql`${discountCodesTable.totalSavedFcfa} + ${discountResult.savedFcfa}`,
            totalSavedUsd: sql`${discountCodesTable.totalSavedUsd} + ${discountResult.savedUsd}`,
            updatedAt: new Date(),
          })
          .where(eq(discountCodesTable.id, discountResult.discountId));
      }

      return newOrder;
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur lors de l'achat";
    try {
      await cancelUnpersistedPurchase(fiveSimOrder.id, services.cancelOrder);
    } catch (cleanupError: unknown) {
      const cleanupMessage = cleanupError instanceof Error ? cleanupError.message : "Erreur 5SIM inconnue";
      console.error(
        `[buy] Failed to persist/cancel 5SIM order ${fiveSimOrder.id} for user ${userId}: ${cleanupMessage}`,
      );
      res.status(503).json({
        error: "PURCHASE_CLEANUP_PENDING",
        message: "L’achat n’a pas été enregistré et son annulation fournisseur reste à confirmer. Ne relancez pas cet achat; contactez le support.",
      });
      return;
    }

    if (err instanceof InsufficientBalanceError) {
      const [currentUser] = await db
        .select({ balanceUsd: usersTable.balanceUsd })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);
      res.status(400).json({
        error: "INSUFFICIENT_BALANCE",
        message: "Solde insuffisant. Veuillez recharger votre compte.",
        balanceUsd: currentUser?.balanceUsd ?? 0,
        requiredUsd: priceUsd,
      });
      return;
    }

    res.status(500).json({ error: "Purchase failed", message });
    return;
  }

  res.json({ order: formatOrder(order) });

  // Fire-and-forget Telegram notification
  db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId)).limit(1).then(([u]) => {
    services.notifyPurchase({
      userId,
      userName: u?.name ?? `User#${userId}`,
      orderId: String(order.id),
      serviceName,
      countryName,
      phone: fiveSimOrder.phone,
      priceFcfa: order.priceFcfa,
      priceUsd:  order.priceUsd,
    }).catch(() => {});
  }).catch(() => {});
  };
}

// ─── Buy number ───────────────────────────────────────────────────────────────
router.post("/v1/buy", requireAuth, createBuyNumberHandler());

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
    .where(and(eq(ordersTable.id, parseInt(String(rawId), 10)), eq(ordersTable.userId, req.userId!)))
    .limit(1);

  if (!dbOrder) {
    res.status(404).json({ error: "Not found", message: "Commande introuvable" });
    return;
  }

  let updatedOrder = dbOrder;

  if (dbOrder.status === "PENDING" || dbOrder.status === "RECEIVED") {
    // Auto-cancel if >6 minutes old with no code received
    const SIX_MIN_MS = 6 * 60 * 1000;
    const orderAge = Date.now() - new Date(dbOrder.createdAt).getTime();
    if (orderAge > SIX_MIN_MS && !dbOrder.smsCode) {
      const result = await refundOrder(dbOrder.id);
      if (result.status === "retry") {
        res.status(503).json({
          order: formatOrder(result.order),
          refundPending: true,
          message: "5SIM n'a pas confirmé l'annulation. Le traitement automatique réessaiera ; vérifiez la commande plus tard.",
        });
        return;
      }
      res.json({
        order: formatOrder(result.order),
        autocanceled: result.status === "refunded" || result.status === "already_refunded",
        refundPending: result.status === "in_progress",
      });
      return;
    }

    try {
      const fiveSimOrder = await checkOrder(parseInt(dbOrder.externalId, 10));
      const newStatus = mapFiveSimStatus(fiveSimOrder.status);
      const deliveredSms = fiveSimOrder.sms?.find((sms) => sms.code || sms.text);
      const smsCode = deliveredSms?.code ?? null;
      const smsText = deliveredSms?.text ?? null;

      if (!deliveredSms && ["CANCELED", "TIMEOUT", "BANNED"].includes(newStatus)) {
        const result = await refundOrder(dbOrder.id);
        updatedOrder = result.order;
        res.json({
          order: formatOrder(updatedOrder),
          autocanceled: result.status === "refunded" || result.status === "already_refunded",
          refundPending: result.status === "retry" || result.status === "in_progress",
        });
        return;
      }

      const [updated] = await db
        .update(ordersTable)
        .set({ status: newStatus, smsCode, smsText })
        .where(
          and(
            eq(ordersTable.id, dbOrder.id),
            eq(ordersTable.status, dbOrder.status),
            sql`${ordersTable.refundToken} IS NULL`,
          ),
        )
        .returning();

      if (updated) {
        updatedOrder = updated;
      } else {
        const [current] = await db.select().from(ordersTable).where(eq(ordersTable.id, dbOrder.id)).limit(1);
        updatedOrder = current ?? dbOrder;
      }
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
    .where(and(eq(ordersTable.id, parseInt(String(rawId), 10)), eq(ordersTable.userId, req.userId!)))
    .limit(1);

  if (!dbOrder) {
    res.status(404).json({ error: "Not found", message: "Commande introuvable" });
    return;
  }

  // Allow cancel if PENDING, or if RECEIVED but no SMS code was delivered
  const canCancel = dbOrder.status === "PENDING" || (dbOrder.status === "RECEIVED" && !dbOrder.smsCode);
  if (!canCancel) {
    res.status(400).json({ error: "Invalid", message: "Cette commande ne peut pas être annulée (SMS déjà reçu)" });
    return;
  }

  const result = await refundOrder(dbOrder.id);
  if (result.status === "retry") {
    res.status(503).json({
      error: "Refund pending",
      message: "5SIM n'a pas confirmé l'annulation. Le traitement automatique réessaiera ; vérifiez la commande plus tard.",
      order: formatOrder(result.order),
    });
    return;
  }
  if (result.status === "not_refundable") {
    res.status(409).json({ error: "Invalid", message: result.reason, order: formatOrder(result.order) });
    return;
  }

  res.json({
    order: formatOrder(result.order),
    refundPending: result.status === "in_progress",
  });
});

// ─── Finish/confirm order ─────────────────────────────────────────────────────
router.post("/v1/finish/:orderId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const rawId = req.params.orderId;
  const userId = req.userId!;

  const [dbOrder] = await db
    .select()
    .from(ordersTable)
    .where(and(eq(ordersTable.id, parseInt(String(rawId), 10)), eq(ordersTable.userId, userId)))
    .limit(1);

  if (!dbOrder) {
    res.status(404).json({ error: "Not found", message: "Commande introuvable" });
    return;
  }

  if (dbOrder.status !== "RECEIVED" || !dbOrder.smsCode) {
    res.status(409).json({
      error: "Invalid status",
      message: "Seule une commande ayant reçu un SMS peut être terminée.",
      order: formatOrder(dbOrder),
    });
    return;
  }

  let fiveSimFinished;
  try {
    fiveSimFinished = await finishOrder(parseInt(dbOrder.externalId, 10));
  } catch (error) {
    const message = error instanceof Error ? error.message : "5SIM n'a pas confirmé la fin de la commande.";
    res.status(502).json({ error: "5SIM finish failed", message, order: formatOrder(dbOrder) });
    return;
  }

  if (mapFiveSimStatus(fiveSimFinished.status) !== "FINISHED") {
    res.status(502).json({
      error: "5SIM finish not confirmed",
      message: `5SIM a retourné le statut ${fiveSimFinished.status}.`,
      order: formatOrder(dbOrder),
    });
    return;
  }

  const [updated] = await db
    .update(ordersTable)
    .set({ status: "FINISHED" })
    .where(
      and(
        eq(ordersTable.id, dbOrder.id),
        eq(ordersTable.status, dbOrder.status),
        sql`${ordersTable.refundToken} IS NULL`,
      ),
    )
    .returning();

  if (!updated) {
    const [current] = await db.select().from(ordersTable).where(eq(ordersTable.id, dbOrder.id)).limit(1);
    res.status(409).json({
      error: "Order changed",
      message: "La commande a changé pendant la confirmation.",
      order: current ? formatOrder(current) : undefined,
    });
    return;
  }

  res.json({ order: formatOrder(updated) });

  // Credit affiliate commission (fire-and-forget)
  db.select({ referredBy: usersTable.referredBy })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1)
    .then(async ([buyer]) => {
      if (!buyer?.referredBy) return;

      const commission = Math.round(dbOrder.priceUsd * 0.10 * 10000) / 10000;
      if (commission <= 0) return;

      await db.transaction(async (tx) => {
        // Serialise la commission par commande, même entre plusieurs instances.
        await tx.execute(sql`SELECT pg_advisory_xact_lock(${dbOrder.id})`);
        const [existing] = await tx
          .select({ id: affiliateCommissionsTable.id })
          .from(affiliateCommissionsTable)
          .where(eq(affiliateCommissionsTable.orderId, dbOrder.id))
          .limit(1);
        if (existing) return;

        await tx.insert(affiliateCommissionsTable).values({
          userId: buyer.referredBy!,
          filleulId: userId,
          orderId: dbOrder.id,
          amountUsd: commission,
        });
        await tx
          .update(usersTable)
          .set({ affiliateBalance: sql`${usersTable.affiliateBalance} + ${commission}` })
          .where(eq(usersTable.id, buyer.referredBy!));
      });
    })
    .catch(() => {});
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
