import { db, ordersTable, transactionsTable, usersTable } from "@workspace/db";
import { and, eq, isNull, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { cancelOrder, checkOrder, mapFiveSimStatus, type FiveSimOrder } from "./fivesim.js";

const REFUNDING_STALE_MS = 2 * 60 * 1000;
const REFUNDABLE_LOCAL_STATUSES = new Set(["PENDING", "RECEIVED", "TIMEOUT", "BANNED"]);
const REFUND_CONFIRMED_STATUSES = new Set(["CANCELED", "TIMEOUT", "BANNED"]);

type Order = typeof ordersTable.$inferSelect;

export type RefundResult =
  | { status: "refunded"; order: Order; fiveSimStatus: string }
  | { status: "already_refunded"; order: Order }
  | { status: "in_progress"; order: Order }
  | { status: "not_refundable"; order: Order; reason: string }
  | { status: "retry"; order: Order; reason: string };

export interface FiveSimRefundClient {
  checkOrder: typeof checkOrder;
  cancelOrder: typeof cancelOrder;
}

const defaultFiveSimClient: FiveSimRefundClient = { checkOrder, cancelOrder };

function deliveredSms(order: FiveSimOrder) {
  return order.sms?.find((sms) => sms.code || sms.text);
}

async function restoreForRetry(order: Order, refundToken: string, reason: string): Promise<RefundResult> {
  const [restored] = await db
    .update(ordersTable)
    .set({ status: order.status, refundToken: null })
    .where(
      and(
        eq(ordersTable.id, order.id),
        eq(ordersTable.status, "REFUNDING"),
        eq(ordersTable.refundToken, refundToken),
      ),
    )
    .returning();

  return { status: "retry", order: restored ?? order, reason };
}

/**
 * Annule une commande chez 5SIM, confirme que 5SIM l'a rendue remboursable,
 * puis crédite l'utilisateur une seule fois.
 */
export async function refundOrder(
  orderId: number,
  fiveSim: FiveSimRefundClient = defaultFiveSimClient,
): Promise<RefundResult> {
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
  if (!order) throw new Error(`Commande ${orderId} introuvable`);

  if (order.status === "CANCELED") {
    return { status: "already_refunded", order };
  }

  if (order.smsCode || order.status === "FINISHED") {
    return { status: "not_refundable", order, reason: "Un SMS a déjà été reçu ou la commande est terminée." };
  }

  if (order.status === "REFUNDING") {
    const age = Date.now() - order.updatedAt.getTime();
    if (age < REFUNDING_STALE_MS) return { status: "in_progress", order };
  } else if (!REFUNDABLE_LOCAL_STATUSES.has(order.status)) {
    return { status: "not_refundable", order, reason: `Statut ${order.status} non remboursable.` };
  }

  const refundToken = randomUUID();
  const previousTokenCondition = order.refundToken === null
    ? isNull(ordersTable.refundToken)
    : eq(ordersTable.refundToken, order.refundToken);

  // Verrou distribué : une seule instance peut faire passer cette version de
  // la commande à REFUNDING. Le jeton précédent permet aussi de reprendre un
  // verrou abandonné sans dépendre de la précision des timestamps PostgreSQL.
  const [claimed] = await db
    .update(ordersTable)
    .set({ status: "REFUNDING", refundToken })
    .where(
      and(
        eq(ordersTable.id, order.id),
        eq(ordersTable.status, order.status),
        previousTokenCondition,
      ),
    )
    .returning();

  if (!claimed) {
    const [current] = await db.select().from(ordersTable).where(eq(ordersTable.id, order.id)).limit(1);
    if (current?.status === "CANCELED") return { status: "already_refunded", order: current };
    return { status: "in_progress", order: current ?? order };
  }

  const externalId = Number.parseInt(order.externalId, 10);
  if (!Number.isSafeInteger(externalId) || externalId <= 0) {
    return restoreForRetry(order, refundToken, "Identifiant de commande 5SIM invalide.");
  }

  let remoteOrder: FiveSimOrder;
  try {
    // Vérifier d'abord : après une réponse réseau perdue, 5SIM peut avoir déjà
    // annulé la commande. Dans ce cas, il ne faut pas appeler cancel à nouveau.
    remoteOrder = await fiveSim.checkOrder(externalId);
    const sms = deliveredSms(remoteOrder);
    if (sms?.code || sms?.text) {
      const [updated] = await db
        .update(ordersTable)
        .set({
          status: mapFiveSimStatus(remoteOrder.status),
          refundToken: null,
          smsCode: sms.code || null,
          smsText: sms.text || null,
        })
        .where(
          and(
            eq(ordersTable.id, order.id),
            eq(ordersTable.status, "REFUNDING"),
            eq(ordersTable.refundToken, refundToken),
          ),
        )
        .returning();
      return {
        status: "not_refundable",
        order: updated ?? order,
        reason: "5SIM a livré un SMS avant l'annulation.",
      };
    }

    const checkedStatus = mapFiveSimStatus(remoteOrder.status);
    if (!REFUND_CONFIRMED_STATUSES.has(checkedStatus)) {
      remoteOrder = await fiveSim.cancelOrder(externalId);
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Erreur 5SIM inconnue";
    return restoreForRetry(order, refundToken, reason);
  }

  const remoteStatus = mapFiveSimStatus(remoteOrder.status);
  if (!REFUND_CONFIRMED_STATUSES.has(remoteStatus)) {
    return restoreForRetry(order, refundToken, `5SIM n'a pas confirmé l'annulation (statut ${remoteStatus}).`);
  }

  const refunded = await db.transaction(async (tx) => {
    // Cette mise à jour conditionnelle est la barrière anti-double crédit.
    const [updated] = await tx
      .update(ordersTable)
      .set({ status: "CANCELED", refundToken: null })
      .where(
        and(
          eq(ordersTable.id, order.id),
          eq(ordersTable.status, "REFUNDING"),
          eq(ordersTable.refundToken, refundToken),
        ),
      )
      .returning();

    if (!updated) return null;

    await tx
      .update(usersTable)
      .set({ balanceUsd: sql`${usersTable.balanceUsd} + ${order.priceUsd}` })
      .where(eq(usersTable.id, order.userId));

    await tx.insert(transactionsTable).values({
      userId: order.userId,
      type: "refund",
      amountUsd: order.priceUsd,
      amountFcfa: order.priceFcfa,
      method: "virtual_number",
      provider: "5sim",
      status: "completed",
      reference: `order_refund:${order.id}`,
      metadata: JSON.stringify({
        orderId: order.id,
        externalId: order.externalId,
        fiveSimStatus: remoteStatus,
      }),
    });

    return updated;
  });

  if (!refunded) {
    const [current] = await db.select().from(ordersTable).where(eq(ordersTable.id, order.id)).limit(1);
    if (current?.status === "CANCELED") return { status: "already_refunded", order: current };
    return { status: "in_progress", order: current ?? order };
  }

  return { status: "refunded", order: refunded, fiveSimStatus: remoteStatus };
}