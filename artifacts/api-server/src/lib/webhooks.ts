import { createHmac, randomUUID } from "node:crypto";
import { lookup } from "node:dns/promises";
import type { LookupAddress } from "node:dns";
import type { LookupFunction } from "node:net";
import { isIP } from "node:net";
import { request as httpsRequest } from "node:https";
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

export class WebhookTestError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = "WebhookTestError";
  }
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

async function resolvePublicWebhookTarget(endpoint: string): Promise<LookupAddress> {
  const hostname = new URL(endpoint).hostname.replace(/^\[|\]$/g, "");
  let addresses: LookupAddress[];
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new Error("Le domaine du webhook ne peut pas être résolu.");
  }
  if (addresses.length === 0 || addresses.some(({ address }) => !isPublicAddress(address))) {
    throw new Error("Le webhook doit pointer vers une adresse IP publique.");
  }
  return addresses[0];
}

function postWebhook(
  endpoint: string,
  target: LookupAddress,
  body: string,
  headers: Record<string, string>,
): Promise<number> {
  const url = new URL(endpoint);
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const pinnedLookup: LookupFunction = (_host, options, callback) => {
    if (options.all) {
      callback(null, [{ address: target.address, family: target.family }]);
    } else {
      callback(null, target.address, target.family);
    }
  };

  return new Promise((resolve, reject) => {
    const request = httpsRequest({
      protocol: url.protocol,
      hostname,
      port: url.port || 443,
      servername: hostname,
      method: "POST",
      path: `${url.pathname}${url.search}`,
      headers,
      lookup: pinnedLookup,
      signal: AbortSignal.timeout(10_000),
    }, (response) => {
      const status = response.statusCode ?? 0;
      response.resume();
      response.once("end", () => resolve(status));
      response.once("error", reject);
    });

    request.once("error", reject);
    request.end(body);
  });
}

export async function sendWebhookTest(userId: number): Promise<{ ok: true; statusCode: number }> {
  const [user] = await db
    .select({ apiKey: usersTable.apiKey, webhookUrl: usersTable.webhookUrl })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) throw new WebhookTestError("Utilisateur introuvable.", 401);
  if (!user.webhookUrl) throw new WebhookTestError("Enregistrez une URL de webhook avant de la tester.", 400);
  if (!user.apiKey) throw new WebhookTestError("Aucune clé API n’est disponible pour signer le test.", 400);

  const endpoint = normalizeWebhookUrl(user.webhookUrl);
  const target = await resolvePublicWebhookTarget(endpoint);
  const deliveryId = `test-${randomUUID()}`;
  const body = JSON.stringify({
    type: "webhook.test",
    test: true,
    createdAt: new Date().toISOString(),
    data: {
      message: "Test de connexion ZyNum. Aucun SMS ni aucune commande réelle ne sont inclus.",
    },
  });
  const signature = createHmac("sha256", user.apiKey).update(body).digest("hex");
  const statusCode = await postWebhook(endpoint, target, body, {
    "Content-Type": "application/json",
    "X-ZyNum-Event": "webhook.test",
    "X-ZyNum-Delivery": deliveryId,
    "X-ZyNum-Signature": `sha256=${signature}`,
    "X-ZyNum-Test": "true",
  });

  if (statusCode < 200 || statusCode >= 300) {
    throw new WebhookTestError(`Le serveur webhook a répondu HTTP ${statusCode}.`, 502);
  }

  return { ok: true, statusCode };
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
    const target = await resolvePublicWebhookTarget(delivery.endpointUrl);
    const body = JSON.stringify(delivery.payload);
    const signature = createHmac("sha256", user.apiKey).update(body).digest("hex");
    responseStatus = await postWebhook(delivery.endpointUrl, target, body, {
      "Content-Type": "application/json",
      "X-ZyNum-Event": delivery.event,
      "X-ZyNum-Delivery": String(delivery.id),
      "X-ZyNum-Signature": `sha256=${signature}`,
    });
    if (responseStatus >= 200 && responseStatus < 300) {
      await setDeliveryResult(delivery.id, {
        status: "delivered",
        deliveredAt: new Date(),
        responseStatus,
        lastError: null,
      });
      return;
    }

    retryable = responseStatus === 408 || responseStatus === 425 || responseStatus === 429 || responseStatus >= 500;
    errorMessage = `Le serveur webhook a répondu HTTP ${responseStatus}.`;
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