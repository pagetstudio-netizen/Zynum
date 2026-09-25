import { createHmac } from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { db, webhookDeliveriesTable, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const MAX_ATTEMPTS = 12;
const MAX_RETRY_DELAY_MS = 6 * 60 * 60 * 1000;
const BATCH_SIZE = 10;
const PROCESSING_STALE_MS = 2 * 60 * 1000;

type ClaimedDelivery = typeof webhookDeliveriesTable.$inferSelect;

export function normalizeWebhookUrl(input: unknown): string {
  if (typeof input !== "string" || input.trim().length === 0) {
    throw new Error("Indiquez une URL HTTPS valide.");
  }
  if (input.length > 2048) throw new Error("L’URL ne peut pas dépasser 2048 caractères.");

  let parsed: URL;
  try {
    parsed = new URL(input.trim());
  } catch {
    throw new Error("L’URL du webhook est invalide.");
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    parsed.protocol !== "https:"
    || !hostname
    || parsed.username
    || parsed.password
    || parsed.hash
    || isIP(hostname)
    || /(?:^|\.)localhost$|(?:^|\.)local$|(?:^|\.)internal$|(?:^|\.)test$/.test(hostname)
  ) {
    throw new Error("Utilisez une URL HTTPS publique, sans identifiants ni fragment.");
  }

  return parsed.toString();
}

function isPublicAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) {
    const octets = address.split(".").map(Number);
    const [a, b, c] = octets;
    return !(
      a === 0 || a === 10 || a === 127 || a >= 224
      || (a === 100 && b >= 64 && b <= 127)
      || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && (b === 168 || (b === 0 && c === 0) || (b === 0 && c === 2)))
      || (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100)))
      || (a === 203 && b === 0 && c === 113)
    );
  }

  if (version === 6) {
    const normalized = address.toLowerCase();
    if (
      normalized.startsWith("::ffff:")
      || normalized === "::"
      || normalized === "::1"
      || normalized.startsWith("fc")
      || normalized.startsWith("fd")
      || /^fe[89ab]/.test(normalized)
      || normalized.startsWith("ff")
      || normalized.startsWith("2001:db8:")
    ) return false;

    const firstHextet = Number.parseInt(normalized.split(":")[0] || "0", 16);
    return firstHextet >= 0x2000 && firstHextet <= 0x3fff;
  }

  return false;
}

async function assertPublicWebhookTarget(endpoint: string): Promise<void> {
  const hostname = new URL(endpoint).hostname.replace(/^\[|\]$/g, "");
  let addresses: Array<{ address: string }>;
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new Error("Le domaine du webhook ne peut pas être résolu.");
  }
  if (addresses.length === 0 || addresses.some(({ address }) => !isPublicAddress(address))) {
    throw new Error("Le webhook doit pointer vers une adresse IP publique.");
  }
}

async function claimNextDelivery(): Promise<ClaimedDelivery | null> {
  const result = await db.execute(sql`
    UPDATE webhook_deliveries
    SET status = 'processing',
        attempts = attempts + 1,
        updated_at = now()
    WHERE id = (
      SELECT id
      FROM webhook_deliveries
      WHERE (
        (status = 'pending' AND next_attempt_at <= now())
        OR (status = 'processing' AND updated_at < now() - (${PROCESSING_STALE_MS} * interval '1 millisecond'))
      )
      ORDER BY next_attempt_at, id
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING
      id,
      user_id AS "userId",
      order_id AS "orderId",
      event,
      endpoint_url AS "endpointUrl",
      payload,
      status,
      attempts,
      next_attempt_at AS "nextAttemptAt",
      delivered_at AS "deliveredAt",
      response_status AS "responseStatus",
      last_error AS "lastError",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
  `);
  return (result.rows[0] as ClaimedDelivery | undefined) ?? null;
}

async function setDeliveryResult(
  id: number,
  values: Partial<typeof webhookDeliveriesTable.$inferInsert>,
): Promise<void> {
  await db.update(webhookDeliveriesTable).set({
    ...values,
    updatedAt: new Date(),
  }).where(eq(webhookDeliveriesTable.id, id));
}

function retryDelay(attempt: number): number {
  return Math.min(30_000 * 2 ** Math.max(0, attempt - 1), MAX_RETRY_DELAY_MS);
}

async function deliver(delivery: ClaimedDelivery): Promise<void> {
  const [user] = await db
    .select({ apiKey: usersTable.apiKey, webhookUrl: usersTable.webhookUrl })
    .from(usersTable)
    .where(eq(usersTable.id, delivery.userId))
    .limit(1);

  if (!user?.apiKey || user.webhookUrl !== delivery.endpointUrl) {
    await setDeliveryResult(delivery.id, {
      status: "failed",
      lastError: "Webhook désactivé, modifié ou clé API indisponible.",
    });
    return;
  }

  let retryable = true;
  let responseStatus: number | null = null;
  let errorMessage = "Échec temporaire de livraison.";

  try {
    await assertPublicWebhookTarget(delivery.endpointUrl);
    const body = JSON.stringify(delivery.payload);
    const signature = createHmac("sha256", user.apiKey).update(body).digest("hex");
    const response = await fetch(delivery.endpointUrl, {
      method: "POST",
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
      headers: {
        "Content-Type": "application/json",
        "X-ZyNum-Event": delivery.event,
        "X-ZyNum-Delivery": String(delivery.id),
        "X-ZyNum-Signature": `sha256=${signature}`,
      },
      body,
    });
    responseStatus = response.status;
    await response.body?.cancel().catch(() => {});
    if (response.ok) {
      await setDeliveryResult(delivery.id, {
        status: "delivered",
        deliveredAt: new Date(),
        responseStatus,
        lastError: null,
      });
      return;
    }

    retryable = response.status === 408 || response.status === 425 || response.status === 429 || response.status >= 500;
    errorMessage = `Le serveur webhook a répondu HTTP ${response.status}.`;
  } catch (error) {
    if (
      error instanceof Error
      && (error.message.includes("adresse IP publique") || error.message.includes("résolu"))
    ) {
      retryable = false;
    }
    errorMessage = error instanceof Error ? error.message.slice(0, 300) : errorMessage;
  }

  const terminal = !retryable || delivery.attempts >= MAX_ATTEMPTS;
  await setDeliveryResult(delivery.id, {
    status: terminal ? "failed" : "pending",
    nextAttemptAt: new Date(Date.now() + retryDelay(delivery.attempts)),
    responseStatus,
    lastError: errorMessage,
  });
}

let batchRunning = false;

export async function dispatchPendingWebhooks(): Promise<void> {
  if (batchRunning) return;
  batchRunning = true;
  try {
    for (let index = 0; index < BATCH_SIZE; index += 1) {
      const delivery = await claimNextDelivery();
      if (!delivery) break;
      await deliver(delivery).catch(async (error: unknown) => {
        const message = error instanceof Error ? error.message.slice(0, 300) : "Erreur de livraison inconnue.";
        await setDeliveryResult(delivery.id, {
          status: delivery.attempts >= MAX_ATTEMPTS ? "failed" : "pending",
          nextAttemptAt: new Date(Date.now() + retryDelay(delivery.attempts)),
          lastError: message,
        });
      });
    }
  } catch (error) {
    console.error("[Webhooks] Échec du traitement de la file:", error instanceof Error ? error.message : "erreur inconnue");
  } finally {
    batchRunning = false;
  }
}

export function scheduleWebhooks(): void {
  void dispatchPendingWebhooks();
  setInterval(() => void dispatchPendingWebhooks(), 5_000);
  console.log("[Webhooks] Livraison des événements de commande activée");
}