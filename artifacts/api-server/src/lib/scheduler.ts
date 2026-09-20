import { db, ordersTable } from "@workspace/db";
import { and, isNull, inArray, lt, or } from "drizzle-orm";
import { refundOrder } from "./orderRefund.js";

const SIX_MIN_MS = 6 * 60 * 1000;
const STALE_REFUND_MS = 2 * 60 * 1000;

async function cancelExpiredOrders() {
  try {
    const cutoff = new Date(Date.now() - SIX_MIN_MS);
    const staleRefundCutoff = new Date(Date.now() - STALE_REFUND_MS);

    const expired = await db
      .select()
      .from(ordersTable)
      .where(
        and(
          isNull(ordersTable.smsCode),
          or(
            and(
              inArray(ordersTable.status, ["PENDING", "RECEIVED", "TIMEOUT", "BANNED"]),
              lt(ordersTable.createdAt, cutoff),
            ),
            and(
              inArray(ordersTable.status, ["REFUNDING"]),
              lt(ordersTable.updatedAt, staleRefundCutoff),
            ),
          ),
        ),
      );

    if (expired.length === 0) return;

    console.log(`[Scheduler] ${expired.length} commande(s) expirée(s) à annuler`);

    for (const order of expired) {
      try {
        const result = await refundOrder(order.id);
        if (result.status === "refunded") {
          console.log(`[Scheduler] Commande ${order.id} annulée chez 5SIM + remboursement user ${order.userId}`);
        } else if (result.status === "retry") {
          console.warn(`[Scheduler] Commande ${order.id}: remboursement à réessayer — ${result.reason}`);
        }
      } catch (error) {
        console.error(`[Scheduler] Commande ${order.id}: échec du remboursement`, error);
      }
    }
  } catch (err) {
    console.error("[Scheduler] Erreur auto-cancel:", err);
  }
}

export function scheduleAutoCancel() {
  // Run immediately on startup, then every 60 seconds
  cancelExpiredOrders();
  setInterval(cancelExpiredOrders, 60_000);
  console.log("[Scheduler] Auto-cancel des commandes expirées activé (toutes les 60s)");
}
