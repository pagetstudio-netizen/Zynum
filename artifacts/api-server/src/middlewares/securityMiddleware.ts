import type { NextFunction, Request, Response } from "express";
import { db, ipBlocksTable, securityEventsTable, usersTable } from "@workspace/db";
import { and, eq, gt } from "drizzle-orm";
import { sendDirectEmail } from "../lib/email.js";
import { getUserById } from "../lib/auth.js";
import type { AuthRequest } from "./authMiddleware.js";

const OWNER_EMAIL = "pagetstudio@gmail.com";
const ADMIN_COUNTRY = "TG";
const BLOCK_DURATION_MS = 30 * 60 * 1000;
const GEO_CACHE_DURATION_MS = 15 * 60 * 1000;
const REQUEST_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 180;
const MAX_SECURITY_FAILURES = 5;

type GeoInfo = {
  countryCode: string | null;
  countryName: string | null;
  vpn: boolean;
  proxy: boolean;
  tor: boolean;
  hosting: boolean;
};

type AttemptState = {
  windowStartedAt: number;
  requestCount: number;
  failures: number;
  blockedUntil: number;
};

const geoCache = new Map<string, { expiresAt: number; value: GeoInfo | null }>();
const attemptCache = new Map<string, AttemptState>();
const notificationCache = new Map<string, number>();

function isPrivateIp(ip: string): boolean {
  return ip === "127.0.0.1"
    || ip === "::1"
    || ip.startsWith("10.")
    || ip.startsWith("192.168.")
    || /^172\.(1[6-9]|2\d|3[01])\./.test(ip);
}

export function getClientIp(req: Request): string {
  return req.ip?.replace(/^::ffff:/, "") || "unknown";
}

async function lookupGeo(ip: string): Promise<GeoInfo | null> {
  if (isPrivateIp(ip) || ip === "unknown") {
    return { countryCode: "LOCAL", countryName: "Local", vpn: false, proxy: false, tor: false, hosting: false };
  }

  const cached = geoCache.get(ip);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  try {
    const response = await fetch(
      `https://ipwho.is/${encodeURIComponent(ip)}?fields=success,country_code,country,security`,
      { signal: AbortSignal.timeout(2500) },
    );
    if (!response.ok) throw new Error(`geo status ${response.status}`);
    const data = await response.json() as {
      success?: boolean;
      country_code?: string;
      country?: string;
      security?: { vpn?: boolean; proxy?: boolean; tor?: boolean; hosting?: boolean };
    };
    const value = data.success === false ? null : {
      countryCode: data.country_code?.toUpperCase() ?? null,
      countryName: data.country ?? null,
      vpn: data.security?.vpn === true,
      proxy: data.security?.proxy === true,
      tor: data.security?.tor === true,
      hosting: data.security?.hosting === true,
    };
    geoCache.set(ip, { expiresAt: Date.now() + GEO_CACHE_DURATION_MS, value });
    return value;
  } catch (error) {
    console.warn("[Security] Geo lookup unavailable:", error instanceof Error ? error.message : "unknown error");
    geoCache.set(ip, { expiresAt: Date.now() + 60_000, value: null });
    return null;
  }
}

async function activeIpBlock(ip: string) {
  const [block] = await db
    .select()
    .from(ipBlocksTable)
    .where(and(eq(ipBlocksTable.ip, ip), gt(ipBlocksTable.blockedUntil, new Date())))
    .limit(1);
  return block;
}

async function notifyOwner(subject: string, message: string, cacheKey: string): Promise<void> {
  const now = Date.now();
  const lastSent = notificationCache.get(cacheKey) ?? 0;
  if (now - lastSent < 60_000) return;
  notificationCache.set(cacheKey, now);
  try {
    await sendDirectEmail({ to: OWNER_EMAIL, subject, message });
  } catch (error) {
    console.error("[Security] Owner notification failed:", error);
  }
}

export async function recordSecurityEvent(input: {
  eventType: string;
  severity?: string;
  ip: string;
  geo?: GeoInfo | null;
  userId?: number | null;
  email?: string | null;
  method?: string;
  path?: string;
  statusCode?: number;
  details?: string;
  notify?: boolean;
}): Promise<void> {
  try {
    await db.insert(securityEventsTable).values({
      eventType: input.eventType,
      severity: input.severity ?? "info",
      ip: input.ip,
      countryCode: input.geo?.countryCode ?? null,
      countryName: input.geo?.countryName ?? null,
      userId: input.userId ?? null,
      email: input.email ?? null,
      method: input.method ?? null,
      path: input.path ?? null,
      statusCode: input.statusCode ?? null,
      details: input.details ?? null,
    });
    if (input.notify) {
      await notifyOwner(
        `[ZyNum] Alerte sécurité: ${input.eventType}`,
        [
          `Événement: ${input.eventType}`,
          `IP: ${input.ip}`,
          `Pays: ${input.geo?.countryName ?? input.geo?.countryCode ?? "inconnu"}`,
          `Compte: ${input.email ?? "inconnu"}`,
          `Action: ${input.method ?? ""} ${input.path ?? ""}`,
          `Détails: ${input.details ?? "—"}`,
        ].join("\n"),
        `${input.eventType}:${input.ip}:${input.path ?? ""}`,
      );
    }
  } catch (error) {
    console.error("[Security] Could not record event:", error);
  }
}

export async function blockIp(ip: string, reason: string, createdByUserId?: number | null): Promise<Date> {
  const blockedUntil = new Date(Date.now() + BLOCK_DURATION_MS);
  await db.insert(ipBlocksTable)
    .values({ ip, reason, blockedUntil, createdByUserId: createdByUserId ?? null })
    .onConflictDoUpdate({
      target: ipBlocksTable.ip,
      set: { reason, blockedUntil, createdByUserId: createdByUserId ?? null },
    });
  const state = attemptCache.get(ip) ?? { windowStartedAt: Date.now(), requestCount: 0, failures: 0, blockedUntil: 0 };
  state.blockedUntil = blockedUntil.getTime();
  attemptCache.set(ip, state);
  return blockedUntil;
}

export async function adminLocationAllowed(req: Request): Promise<{ allowed: boolean; geo: GeoInfo | null }> {
  const ip = getClientIp(req);
  const geo = await lookupGeo(ip);
  if (!geo) return { allowed: false, geo: null };
  return {
    allowed: geo.countryCode === ADMIN_COUNTRY && !geo.vpn && !geo.proxy && !geo.tor && !geo.hosting,
    geo,
  };
}

export async function enforceAdminLocation(req: Request, user: { email?: string | null; isAdmin?: boolean | null }) {
  if (user.email?.trim().toLowerCase() !== OWNER_EMAIL || user.isAdmin !== true) {
    return { allowed: true, geo: null };
  }
  return adminLocationAllowed(req);
}

async function countSecurityFailure(req: Request, response: Response, geo: GeoInfo | null): Promise<void> {
  const ip = getClientIp(req);
  const now = Date.now();
  const previous = attemptCache.get(ip);
  const state = previous && now - previous.windowStartedAt < REQUEST_WINDOW_MS
    ? previous
    : { windowStartedAt: now, requestCount: 0, failures: 0, blockedUntil: 0 };
  state.failures += 1;
  if (state.failures >= MAX_SECURITY_FAILURES) {
    const blockedUntil = await blockIp(ip, "Trop de tentatives échouées", (req as AuthRequest).userId);
    await recordSecurityEvent({
      eventType: "ip_blocked",
      severity: "critical",
      ip,
      geo,
      userId: (req as AuthRequest).userId,
      method: req.method,
      path: req.originalUrl,
      statusCode: 429,
      details: `Blocage automatique jusqu'à ${blockedUntil.toISOString()}`,
      notify: true,
    });
  }
  attemptCache.set(ip, state);
}

function shouldAuditMutation(req: Request): boolean {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return false;
  const path = req.originalUrl.toLowerCase();
  return path.includes("/admin/")
    || path.includes("/balance")
    || path.includes("/recharge")
    || path.includes("/payments/")
    || path.includes("/buy")
    || path.includes("/withdraw");
}

export async function securityMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const path = req.originalUrl.toLowerCase();
  if (path.includes("/webhooks/") || path.endsWith("/health")) {
    next();
    return;
  }

  const ip = getClientIp(req);
  const existingBlock = await activeIpBlock(ip);
  if (existingBlock) {
    const retryAfter = Math.max(1, Math.ceil((existingBlock.blockedUntil.getTime() - Date.now()) / 1000));
    res.setHeader("Retry-After", String(retryAfter));
    res.status(429).json({
      error: "IP_BLOCKED",
      message: `Trop de tentatives. Veuillez réessayer dans ${Math.ceil(retryAfter / 60)} minute(s).`,
      retryAfterSeconds: retryAfter,
    });
    return;
  }

  const now = Date.now();
  const state = attemptCache.get(ip);
  if (state && now - state.windowStartedAt < REQUEST_WINDOW_MS && state.requestCount >= MAX_REQUESTS_PER_WINDOW) {
    await countSecurityFailure(req, res, null);
    res.status(429).json({
      error: "RATE_LIMITED",
      message: "Trop de requêtes. Veuillez réessayer plus tard.",
      retryAfterSeconds: Math.ceil((state.windowStartedAt + REQUEST_WINDOW_MS - now) / 1000),
    });
    return;
  }
  const requestState = state && now - state.windowStartedAt < REQUEST_WINDOW_MS
    ? state
    : { windowStartedAt: now, requestCount: 0, failures: state?.failures ?? 0, blockedUntil: 0 };
  requestState.requestCount += 1;
  attemptCache.set(ip, requestState);

  const geo = await lookupGeo(ip);
  if (geo && (geo.vpn || geo.proxy || geo.tor)) {
    await recordSecurityEvent({
      eventType: "vpn_blocked",
      severity: "high",
      ip,
      geo,
      method: req.method,
      path: req.originalUrl,
      statusCode: 403,
      details: "VPN, proxy ou Tor détecté",
      notify: false,
    });
    res.status(403).json({
      error: "VPN_BLOCKED",
      message: "Cette plateforme n'est pas disponible via un VPN ou un proxy.",
    });
    return;
  }

  res.on("finish", () => {
    void (async () => {
      const authRequest = req as AuthRequest;
      let user: Awaited<ReturnType<typeof getUserById>> = null;
      if (authRequest.userId) user = await getUserById(authRequest.userId);

      if ([401, 403, 429].includes(res.statusCode)) {
        await recordSecurityEvent({
          eventType: "security_failure",
          severity: res.statusCode === 429 ? "high" : "medium",
          ip,
          geo,
          userId: authRequest.userId,
          email: user?.email,
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          details: "Réponse de sécurité",
          notify: false,
        });
        await countSecurityFailure(req, res, geo);
      }

      if (res.statusCode >= 200 && res.statusCode < 300 && shouldAuditMutation(req)) {
        await recordSecurityEvent({
          eventType: req.originalUrl.toLowerCase().includes("/admin/") ? "admin_action" : "balance_action",
          severity: "info",
          ip,
          geo,
          userId: authRequest.userId,
          email: user?.email,
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          details: "Action sensible réussie",
          notify: true,
        });
      }
    })();
  });
  next();
}