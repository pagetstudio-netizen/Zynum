import { Router } from "express";
import { db, usersTable, ordersTable, transactionsTable, adminSettingsTable, adminMessagesTable, paymentProvidersTable, faqArticlesTable, socialLinksTable, countryOverridesTable } from "@workspace/db";
import { invalidateFiveSimKeyCache } from "../lib/fivesim.js";
import { eq, desc, count, sum, and, gte, lte, like, or, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { requireAdmin } from "../middlewares/adminMiddleware.js";
import { hashPassword } from "../lib/auth.js";
import { invalidateCommissionCache } from "../lib/commission.js";
import { sendBroadcastEmail } from "../lib/email.js";

const router = Router();
const auth = [requireAuth, requireAdmin];

/* ─── STATS ─────────────────────────────────────────────────────────── */
router.get("/v1/admin/stats", ...auth, async (req, res): Promise<void> => {
  const { from, to } = req.query as Record<string, string>;
  const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const toDate = to ? new Date(to) : new Date();

  const [totalUsers] = await db.select({ c: count() }).from(usersTable);
  const [activeUsers] = await db.select({ c: count() }).from(usersTable).where(eq(usersTable.isBanned, false));
  const [bannedUsers] = await db.select({ c: count() }).from(usersTable).where(eq(usersTable.isBanned, true));
  const [totalOrders] = await db.select({ c: count() }).from(ordersTable);
  const [completedOrders] = await db.select({ c: count() }).from(ordersTable).where(eq(ordersTable.status, "RECEIVED"));
  const [totalRevUsd] = await db.select({ s: sum(ordersTable.priceUsd) }).from(ordersTable).where(eq(ordersTable.status, "RECEIVED"));
  const [totalRevFcfa] = await db.select({ s: sum(ordersTable.priceFcfa) }).from(ordersTable).where(eq(ordersTable.status, "RECEIVED"));
  const [totalBalances] = await db.select({ s: sum(usersTable.balanceUsd) }).from(usersTable);
  const [totalTransactions] = await db.select({ c: count() }).from(transactionsTable);
  const [totalRechargeUsd] = await db.select({ s: sum(transactionsTable.amountUsd) }).from(transactionsTable).where(and(eq(transactionsTable.status, "completed"), eq(transactionsTable.type, "recharge")));

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const yearStart = new Date(); yearStart.setMonth(0, 1); yearStart.setHours(0, 0, 0, 0);

  const [ordersToday] = await db.select({ c: count(), s: sum(ordersTable.priceUsd) }).from(ordersTable).where(and(eq(ordersTable.status, "RECEIVED"), gte(ordersTable.createdAt, todayStart)));
  const [ordersMonth] = await db.select({ c: count(), s: sum(ordersTable.priceUsd) }).from(ordersTable).where(and(eq(ordersTable.status, "RECEIVED"), gte(ordersTable.createdAt, monthStart)));
  const [ordersYear] = await db.select({ c: count(), s: sum(ordersTable.priceUsd) }).from(ordersTable).where(and(eq(ordersTable.status, "RECEIVED"), gte(ordersTable.createdAt, yearStart)));

  const [newUsersToday] = await db.select({ c: count() }).from(usersTable).where(gte(usersTable.createdAt, todayStart));
  const [newUsersMonth] = await db.select({ c: count() }).from(usersTable).where(gte(usersTable.createdAt, monthStart));

  const [ordersRange] = await db.select({ c: count(), s: sum(ordersTable.priceUsd) }).from(ordersTable).where(and(eq(ordersTable.status, "RECEIVED"), gte(ordersTable.createdAt, fromDate), lte(ordersTable.createdAt, toDate)));

  const topServices = await db.select({ service: ordersTable.serviceName, c: count() }).from(ordersTable).groupBy(ordersTable.serviceName).orderBy(desc(count())).limit(5);
  const topCountries = await db.select({ country: ordersTable.countryName, c: count() }).from(ordersTable).groupBy(ordersTable.countryName).orderBy(desc(count())).limit(5);

  res.json({
    users: { total: totalUsers.c, active: activeUsers.c, banned: bannedUsers.c, newToday: newUsersToday.c, newMonth: newUsersMonth.c },
    orders: { total: totalOrders.c, completed: completedOrders.c, today: { count: ordersToday.c, revenueUsd: ordersToday.s || 0 }, month: { count: ordersMonth.c, revenueUsd: ordersMonth.s || 0 }, year: { count: ordersYear.c, revenueUsd: ordersYear.s || 0 }, range: { count: ordersRange.c, revenueUsd: ordersRange.s || 0 } },
    revenue: { totalUsd: totalRevUsd.s || 0, totalFcfa: totalRevFcfa.s || 0, totalRechargeUsd: totalRechargeUsd.s || 0 },
    balances: { totalUsd: totalBalances.s || 0 },
    transactions: { total: totalTransactions.c },
    topServices,
    topCountries,
  });
});

/* ─── USERS ──────────────────────────────────────────────────────────── */
router.get("/v1/admin/users", ...auth, async (req, res): Promise<void> => {
  const { q, page = "1", limit = "20" } = req.query as Record<string, string>;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, balanceUsd: usersTable.balanceUsd, isAdmin: usersTable.isAdmin, isBanned: usersTable.isBanned, createdAt: usersTable.createdAt }).from(usersTable);

  if (q) {
    query = query.where(or(like(usersTable.name, `%${q}%`), like(usersTable.email, `%${q}%`)));
  }

  const users = await query.orderBy(desc(usersTable.createdAt)).limit(parseInt(limit)).offset(offset);
  const [{ c }] = await db.select({ c: count() }).from(usersTable);

  res.json({ users, total: c, page: parseInt(page), limit: parseInt(limit) });
});

router.get("/v1/admin/users/:id", ...auth, async (req, res): Promise<void> => {
  const userId = parseInt(req.params.id);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const orders = await db.select().from(ordersTable).where(eq(ordersTable.userId, userId)).orderBy(desc(ordersTable.createdAt)).limit(50);
  const txs = await db.select().from(transactionsTable).where(eq(transactionsTable.userId, userId)).orderBy(desc(transactionsTable.createdAt)).limit(50);

  res.json({ user: { ...user, passwordHash: undefined }, orders, transactions: txs });
});

router.patch("/v1/admin/users/:id", ...auth, async (req: any, res): Promise<void> => {
  const userId = parseInt(req.params.id);
  const { name, email, password, balanceUsd, isAdmin, isBanned } = req.body;

  // Fetch current user to compute balance delta
  const [current] = await db.select({ balanceUsd: usersTable.balanceUsd }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!current) { res.status(404).json({ error: "User not found" }); return; }

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email;
  if (password !== undefined) updates.passwordHash = hashPassword(password);
  if (balanceUsd !== undefined) updates.balanceUsd = parseFloat(balanceUsd);
  if (isAdmin !== undefined) updates.isAdmin = isAdmin;
  if (isBanned !== undefined) updates.isBanned = isBanned;

  const [updated] = await db.update(usersTable).set(updates as any).where(eq(usersTable.id, userId)).returning();
  if (!updated) { res.status(404).json({ error: "User not found" }); return; }

  // Record a transaction when balance is manually adjusted
  if (balanceUsd !== undefined) {
    const newBalance = parseFloat(balanceUsd);
    const delta = newBalance - (current.balanceUsd ?? 0);
    if (Math.abs(delta) > 0.001) {
      const FCFA_RATE = 620;
      await db.insert(transactionsTable).values({
        userId,
        type: delta >= 0 ? "recharge" : "debit",
        amountUsd: Math.abs(delta),
        amountFcfa: Math.abs(delta) * FCFA_RATE,
        method: "admin",
        provider: "admin_adjustment",
        status: "completed",
        reference: `ADM-${Date.now()}`,
        metadata: JSON.stringify({ adminId: req.userId, note: "Ajustement manuel du solde" }),
      });
    }
  }

  res.json({ success: true, user: { ...updated, passwordHash: undefined } });
});

router.delete("/v1/admin/users/:id", ...auth, async (req, res): Promise<void> => {
  const userId = parseInt(req.params.id);
  await db.delete(usersTable).where(eq(usersTable.id, userId));
  res.json({ success: true });
});

/* ─── ORDERS ─────────────────────────────────────────────────────────── */
router.get("/v1/admin/orders", ...auth, async (req, res): Promise<void> => {
  const { q, page = "1", limit = "20", status } = req.query as Record<string, string>;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const orders = await db.select({
    id: ordersTable.id,
    userId: ordersTable.userId,
    phone: ordersTable.phone,
    service: ordersTable.serviceName,
    country: ordersTable.countryName,
    status: ordersTable.status,
    priceUsd: ordersTable.priceUsd,
    priceFcfa: ordersTable.priceFcfa,
    createdAt: ordersTable.createdAt,
    userName: usersTable.name,
    userEmail: usersTable.email,
  }).from(ordersTable).leftJoin(usersTable, eq(ordersTable.userId, usersTable.id)).orderBy(desc(ordersTable.createdAt)).limit(parseInt(limit)).offset(offset);

  const [{ c }] = await db.select({ c: count() }).from(ordersTable);
  res.json({ orders, total: c, page: parseInt(page), limit: parseInt(limit) });
});

/* ─── TRANSACTIONS ───────────────────────────────────────────────────── */
router.get("/v1/admin/transactions", ...auth, async (req, res): Promise<void> => {
  const { page = "1", limit = "20", q, status, type } = req.query as Record<string, string>;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const conditions = [];
  if (status) conditions.push(eq(transactionsTable.status, status));
  if (type)   conditions.push(eq(transactionsTable.type, type));
  if (q) {
    conditions.push(or(
      like(usersTable.email, `%${q}%`),
      like(usersTable.name, `%${q}%`),
      like(transactionsTable.reference, `%${q}%`),
    ));
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const txs = await db.select({
    id: transactionsTable.id,
    userId: transactionsTable.userId,
    type: transactionsTable.type,
    amountUsd: transactionsTable.amountUsd,
    amountFcfa: transactionsTable.amountFcfa,
    method: transactionsTable.method,
    provider: transactionsTable.provider,
    status: transactionsTable.status,
    reference: transactionsTable.reference,
    metadata: transactionsTable.metadata,
    createdAt: transactionsTable.createdAt,
    userName: usersTable.name,
    userEmail: usersTable.email,
  })
    .from(transactionsTable)
    .leftJoin(usersTable, eq(transactionsTable.userId, usersTable.id))
    .where(where)
    .orderBy(desc(transactionsTable.createdAt))
    .limit(parseInt(limit))
    .offset(offset);

  const [{ c }] = await db.select({ c: count() }).from(transactionsTable)
    .leftJoin(usersTable, eq(transactionsTable.userId, usersTable.id))
    .where(where);

  // Total revenue for filtered set
  const [rev] = await db.select({ s: sum(transactionsTable.amountUsd) }).from(transactionsTable)
    .leftJoin(usersTable, eq(transactionsTable.userId, usersTable.id))
    .where(where);

  res.json({ transactions: txs, total: c, page: parseInt(page), limit: parseInt(limit), totalRevenue: rev.s ?? 0 });
});

// Admin: manually create a transaction (offline deposit, credit, debit)
router.post("/v1/admin/transactions", ...auth, async (req: any, res): Promise<void> => {
  const { userId, type, amountUsd, method, provider, status, reference, note } = req.body;
  if (!userId || !amountUsd || !method) {
    res.status(400).json({ error: "userId, amountUsd, method required" }); return;
  }

  const FCFA_RATE = 620;
  const amount = parseFloat(amountUsd);

  // Update user balance
  const [user] = await db.select({ balanceUsd: usersTable.balanceUsd }).from(usersTable).where(eq(usersTable.id, parseInt(userId))).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const delta = (type === "debit") ? -amount : amount;
  await db.update(usersTable).set({ balanceUsd: (user.balanceUsd ?? 0) + delta }).where(eq(usersTable.id, parseInt(userId)));

  const [tx] = await db.insert(transactionsTable).values({
    userId: parseInt(userId),
    type: type || "recharge",
    amountUsd: amount,
    amountFcfa: amount * FCFA_RATE,
    method: method || "admin",
    provider: provider || "manual",
    status: status || "completed",
    reference: reference || `ADM-${Date.now()}`,
    metadata: JSON.stringify({ adminId: req.userId, note: note || "Dépôt manuel" }),
  }).returning();

  res.json({ success: true, transaction: tx });
});

/* ─── PUBLIC: Active popup notifications (no auth) ───────────────────── */
router.get("/v1/popup-notifications", async (req, res): Promise<void> => {
  const msgs = await db.select().from(adminMessagesTable)
    .where(and(eq(adminMessagesTable.type, "popup"), eq(adminMessagesTable.isActive, true)))
    .orderBy(desc(adminMessagesTable.sentAt))
    .limit(5);
  res.json({ notifications: msgs });
});

/* ─── MESSAGES ───────────────────────────────────────────────────────── */
router.get("/v1/admin/messages", ...auth, async (req, res): Promise<void> => {
  const msgs = await db.select().from(adminMessagesTable).orderBy(desc(adminMessagesTable.sentAt)).limit(100);
  res.json({ messages: msgs });
});

router.post("/v1/admin/messages", ...auth, async (req: any, res): Promise<void> => {
  const { type, target, subject, content, color, linkUrl, linkLabel, imageUrl, isActive } = req.body;
  if (!content) { res.status(400).json({ error: "Content required" }); return; }

  const [msg] = await db.insert(adminMessagesTable).values({
    senderId: req.userId,
    type: type || "popup",
    target: target || "all",
    subject,
    content,
    color: color || "blue",
    linkUrl: linkUrl || null,
    linkLabel: linkLabel || null,
    imageUrl: imageUrl || null,
    isActive: isActive !== false,
  }).returning();
  res.json({ success: true, message: msg });
});

router.patch("/v1/admin/messages/:id", ...auth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const { subject, content, color, linkUrl, linkLabel, imageUrl, isActive } = req.body;
  const updates: Record<string, unknown> = {};
  if (subject   !== undefined) updates.subject   = subject;
  if (content   !== undefined) updates.content   = content;
  if (color     !== undefined) updates.color     = color;
  if (linkUrl   !== undefined) updates.linkUrl   = linkUrl;
  if (linkLabel !== undefined) updates.linkLabel = linkLabel;
  if (imageUrl  !== undefined) updates.imageUrl  = imageUrl;
  if (isActive  !== undefined) updates.isActive  = isActive;
  const [msg] = await db.update(adminMessagesTable).set(updates as any).where(eq(adminMessagesTable.id, id)).returning();
  if (!msg) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true, message: msg });
});

router.delete("/v1/admin/messages/:id", ...auth, async (req, res): Promise<void> => {
  await db.delete(adminMessagesTable).where(eq(adminMessagesTable.id, parseInt(req.params.id)));
  res.json({ success: true });
});

/* ─── SETTINGS ───────────────────────────────────────────────────────── */
router.get("/v1/admin/settings", ...auth, async (req, res): Promise<void> => {
  const settings = await db.select().from(adminSettingsTable);
  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;
  res.json({ settings: map });
});

router.post("/v1/admin/settings", ...auth, async (req, res): Promise<void> => {
  const { key, value } = req.body;
  if (!key || value === undefined) { res.status(400).json({ error: "key and value required" }); return; }

  await db.insert(adminSettingsTable).values({ key, value }).onConflictDoUpdate({ target: adminSettingsTable.key, set: { value } });
  if (key === "commission_type" || key === "commission_value") invalidateCommissionCache();
  if (key === "fivesim_api_key") invalidateFiveSimKeyCache();
  res.json({ success: true });
});

router.post("/v1/admin/settings/bulk", ...auth, async (req, res): Promise<void> => {
  const { settings } = req.body as { settings: Record<string, string> };
  if (!settings || typeof settings !== "object") { res.status(400).json({ error: "settings object required" }); return; }

  for (const [key, value] of Object.entries(settings)) {
    await db.insert(adminSettingsTable).values({ key, value }).onConflictDoUpdate({ target: adminSettingsTable.key, set: { value } });
  }
  invalidateCommissionCache();
  if ("fivesim_api_key" in settings) invalidateFiveSimKeyCache();
  res.json({ success: true });
});

/* ─── PUBLIC SETTINGS ────────────────────────────────────────────────── */
router.get("/v1/settings", async (req, res): Promise<void> => {
  const settings = await db.select().from(adminSettingsTable);
  const map: Record<string, string> = {};
  const publicKeys = ["platform_name", "support_email", "support_telegram", "support_whatsapp", "maintenance_mode", "maintenance_buy", "commission_type", "commission_value", "currency_rate"];
  for (const s of settings) {
    if (publicKeys.includes(s.key)) map[s.key] = s.value;
  }
  res.json({ settings: map });
});

/* ─── PAYMENT PROVIDERS ──────────────────────────────────────────────── */
router.get("/v1/admin/payment-providers", ...auth, async (req, res): Promise<void> => {
  const providers = await db.select().from(paymentProvidersTable).orderBy(paymentProvidersTable.category, paymentProvidersTable.name);
  res.json({ providers });
});

router.post("/v1/admin/payment-providers", ...auth, async (req, res): Promise<void> => {
  const { category, name, slug, isActive, isSelected, config } = req.body;
  const [p] = await db.insert(paymentProvidersTable).values({ category, name, slug, isActive: isActive ?? false, isSelected: isSelected ?? false, config }).returning();
  res.json({ success: true, provider: p });
});

router.patch("/v1/admin/payment-providers/:id", ...auth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const { isActive, isSelected, config, name } = req.body;
  const updates: Record<string, unknown> = {};
  if (isActive !== undefined) updates.isActive = isActive;
  if (isSelected !== undefined) updates.isSelected = isSelected;
  if (config !== undefined) updates.config = config;
  if (name !== undefined) updates.name = name;
  const [p] = await db.update(paymentProvidersTable).set(updates as any).where(eq(paymentProvidersTable.id, id)).returning();
  res.json({ success: true, provider: p });
});

router.delete("/v1/admin/payment-providers/:id", ...auth, async (req, res): Promise<void> => {
  await db.delete(paymentProvidersTable).where(eq(paymentProvidersTable.id, parseInt(req.params.id)));
  res.json({ success: true });
});

/* ─── FAQ / ARTICLES ─────────────────────────────────────────────────── */
router.get("/v1/admin/faq", ...auth, async (req, res): Promise<void> => {
  const articles = await db.select().from(faqArticlesTable).orderBy(faqArticlesTable.sortOrder, faqArticlesTable.createdAt);
  res.json({ articles });
});

router.post("/v1/admin/faq", ...auth, async (req, res): Promise<void> => {
  const { type, category, question, answer, lang, isActive, sortOrder } = req.body;
  const [a] = await db.insert(faqArticlesTable).values({ type: type || "faq", category, question, answer, lang: lang || "fr", isActive: isActive ?? true, sortOrder: sortOrder ?? 0 }).returning();
  res.json({ success: true, article: a });
});

router.patch("/v1/admin/faq/:id", ...auth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const { type, category, question, answer, lang, isActive, sortOrder } = req.body;
  const updates: Record<string, unknown> = {};
  if (type !== undefined) updates.type = type;
  if (category !== undefined) updates.category = category;
  if (question !== undefined) updates.question = question;
  if (answer !== undefined) updates.answer = answer;
  if (lang !== undefined) updates.lang = lang;
  if (isActive !== undefined) updates.isActive = isActive;
  if (sortOrder !== undefined) updates.sortOrder = sortOrder;
  const [a] = await db.update(faqArticlesTable).set(updates as any).where(eq(faqArticlesTable.id, id)).returning();
  res.json({ success: true, article: a });
});

router.delete("/v1/admin/faq/:id", ...auth, async (req, res): Promise<void> => {
  await db.delete(faqArticlesTable).where(eq(faqArticlesTable.id, parseInt(req.params.id)));
  res.json({ success: true });
});

/* ─── SOCIAL LINKS ───────────────────────────────────────────────────── */
router.get("/v1/admin/social-links", ...auth, async (req, res): Promise<void> => {
  const links = await db.select().from(socialLinksTable).orderBy(socialLinksTable.sortOrder);
  res.json({ links });
});

router.post("/v1/admin/social-links", ...auth, async (req, res): Promise<void> => {
  const { platform, url, icon, isActive, sortOrder } = req.body;
  const [l] = await db.insert(socialLinksTable).values({ platform, url, icon, isActive: isActive ?? true, sortOrder: sortOrder ?? 0 }).returning();
  res.json({ success: true, link: l });
});

router.patch("/v1/admin/social-links/:id", ...auth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const updates: Record<string, unknown> = {};
  const { platform, url, icon, isActive, sortOrder } = req.body;
  if (platform !== undefined) updates.platform = platform;
  if (url !== undefined) updates.url = url;
  if (icon !== undefined) updates.icon = icon;
  if (isActive !== undefined) updates.isActive = isActive;
  if (sortOrder !== undefined) updates.sortOrder = sortOrder;
  const [l] = await db.update(socialLinksTable).set(updates as any).where(eq(socialLinksTable.id, id)).returning();
  res.json({ success: true, link: l });
});

router.delete("/v1/admin/social-links/:id", ...auth, async (req, res): Promise<void> => {
  await db.delete(socialLinksTable).where(eq(socialLinksTable.id, parseInt(req.params.id)));
  res.json({ success: true });
});

/* ─── COUNTRY OVERRIDES ──────────────────────────────────────────────── */

// Admin: get ALL 5SIM countries merged with overrides (for management)
router.get("/v1/admin/countries/all", ...auth, async (req, res): Promise<void> => {
  try {
    const { getCountriesForService } = await import("../lib/fivesim.js");
    const service = typeof req.query.service === "string" ? req.query.service : "telegram";
    const [countries, overrides] = await Promise.all([
      getCountriesForService(service),
      db.select().from(countryOverridesTable),
    ]);

    const overrideMap = new Map(overrides.map((o) => [o.countrySlug, o]));

    const merged = countries.map((c) => {
      const ov = overrideMap.get(c.code);
      return {
        code: c.code,
        name: c.name,
        flag: c.flag,
        priceUsd: c.priceUsd,
        available: c.available,
        override: ov ?? null,
        isDisabled: ov?.isDisabled ?? false,
        priceMultiplier: ov?.priceMultiplier ?? 1.0,
        overrideId: ov?.id ?? null,
      };
    });

    merged.sort((a, b) => a.name.localeCompare(b.name));
    res.json({ countries: merged, total: merged.length, disabled: merged.filter((c) => c.isDisabled).length });
  } catch (e) {
    res.status(500).json({ error: "Failed to load countries" });
  }
});

// Admin: list only overrides
router.get("/v1/admin/countries", ...auth, async (req, res): Promise<void> => {
  const overrides = await db.select().from(countryOverridesTable).orderBy(countryOverridesTable.countryName);
  res.json({ overrides });
});

// Admin: upsert override for a country (by slug)
router.post("/v1/admin/countries", ...auth, async (req, res): Promise<void> => {
  const { countrySlug, countryName, isDisabled, priceMultiplier } = req.body;
  const [c] = await db.insert(countryOverridesTable)
    .values({ countrySlug, countryName, isDisabled: isDisabled ?? false, priceMultiplier: priceMultiplier ?? 1.0 })
    .onConflictDoUpdate({
      target: countryOverridesTable.countrySlug,
      set: { isDisabled: isDisabled ?? false, priceMultiplier: priceMultiplier ?? 1.0, countryName },
    })
    .returning();
  res.json({ success: true, override: c });
});

// Admin: update override fields (toggle disable, set multiplier)
router.patch("/v1/admin/countries/by-slug/:slug", ...auth, async (req, res): Promise<void> => {
  const slug = req.params.slug;
  const { isDisabled, priceMultiplier, countryName } = req.body;

  const existing = await db.select().from(countryOverridesTable)
    .where(eq(countryOverridesTable.countrySlug, slug))
    .then((r) => r[0]);

  if (existing) {
    const updates: Record<string, unknown> = {};
    if (isDisabled !== undefined) updates.isDisabled = isDisabled;
    if (priceMultiplier !== undefined) updates.priceMultiplier = priceMultiplier;
    if (countryName !== undefined) updates.countryName = countryName;
    const [c] = await db.update(countryOverridesTable).set(updates as any)
      .where(eq(countryOverridesTable.countrySlug, slug)).returning();
    res.json({ success: true, override: c });
  } else {
    const [c] = await db.insert(countryOverridesTable)
      .values({
        countrySlug: slug,
        countryName: countryName ?? slug,
        isDisabled: isDisabled ?? false,
        priceMultiplier: priceMultiplier ?? 1.0,
      })
      .returning();
    res.json({ success: true, override: c });
  }
});

router.patch("/v1/admin/countries/:id", ...auth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const { isDisabled, priceMultiplier } = req.body;
  const updates: Record<string, unknown> = {};
  if (isDisabled !== undefined) updates.isDisabled = isDisabled;
  if (priceMultiplier !== undefined) updates.priceMultiplier = priceMultiplier;
  const [c] = await db.update(countryOverridesTable).set(updates as any).where(eq(countryOverridesTable.id, id)).returning();
  res.json({ success: true, override: c });
});

/* ─── EMAIL BROADCAST ──────────────────────────────────────────────── */
router.post("/v1/admin/send-broadcast-email", ...auth, async (req, res): Promise<void> => {
  const { subject, message } = req.body;
  if (!subject || !message) {
    res.status(400).json({ error: "Validation error", message: "Sujet et message requis" });
    return;
  }

  const users = await db
    .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email })
    .from(usersTable)
    .where(and(eq(usersTable.isBanned, false), eq(usersTable.emailVerified, true)));

  let sent = 0;
  let failed = 0;
  for (const user of users) {
    try {
      await sendBroadcastEmail({ to: user.email, name: user.name, subject, message });
      sent++;
    } catch (err) {
      console.error(`Broadcast to ${user.email} failed:`, err);
      failed++;
    }
  }

  res.json({ success: true, sent, failed, total: users.length });
});

/* ─── ADMIN: Réinitialiser ses propres statistiques ─────────────────────── */
router.post("/v1/admin/reset-my-stats", ...auth, async (req: any, res): Promise<void> => {
  try {
    const adminId = req.userId as number;

    // Vérifier que l'utilisateur est bien admin
    const [admin] = await db.select({ id: usersTable.id, isAdmin: usersTable.isAdmin })
      .from(usersTable).where(eq(usersTable.id, adminId)).limit(1);
    if (!admin?.isAdmin) { res.status(403).json({ error: "Accès refusé" }); return; }

    // Remettre le solde à 0
    await db.update(usersTable).set({ balanceUsd: 0 }).where(eq(usersTable.id, adminId));

    // Supprimer les transactions personnelles de l'admin
    const deleted = await db.delete(transactionsTable)
      .where(eq(transactionsTable.userId, adminId))
      .returning({ id: transactionsTable.id });

    // Supprimer les commandes personnelles de l'admin
    const deletedOrders = await db.delete(ordersTable)
      .where(eq(ordersTable.userId, adminId))
      .returning({ id: ordersTable.id });

    res.json({
      success: true,
      message: "Statistiques réinitialisées",
      deletedTransactions: deleted.length,
      deletedOrders: deletedOrders.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur";
    res.status(500).json({ error: message });
  }
});

export default router;
