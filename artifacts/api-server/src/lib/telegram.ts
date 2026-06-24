import { db, usersTable, ordersTable, transactionsTable, adminSettingsTable } from "@workspace/db";
import { eq, and, gte, lt, sum, count, sql } from "drizzle-orm";

const TELEGRAM_API = () => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN ?? ""}`;

function pad(n: number): string { return String(n).padStart(2, "0"); }
function fmtDate(d: Date): string {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fmtNum(n: number): string { return n.toLocaleString("fr-FR"); }

// ─── Chat ID resolution ───────────────────────────────────────────────────────

export async function getChatId(): Promise<string | null> {
  try {
    const [row] = await db
      .select({ value: adminSettingsTable.value })
      .from(adminSettingsTable)
      .where(eq(adminSettingsTable.key, "telegram_chat_id"))
      .limit(1);
    if (row?.value) return row.value;
  } catch {}
  return process.env.TELEGRAM_CHAT_ID ?? null;
}

export async function saveChatId(chatId: string): Promise<void> {
  await db
    .insert(adminSettingsTable)
    .values({ key: "telegram_chat_id", value: chatId })
    .onConflictDoUpdate({ target: adminSettingsTable.key, set: { value: chatId } });
}

// ─── Core send ────────────────────────────────────────────────────────────────

export async function sendMessage(chatId: string, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN ?? "";
  if (!token || !chatId) return false;
  try {
    const res = await fetch(`${TELEGRAM_API()}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    const data = await res.json() as { ok: boolean; description?: string };
    if (!data.ok) console.error("[Telegram] sendMessage error:", data.description);
    return data.ok;
  } catch (err) {
    console.error("[Telegram] sendMessage fetch error:", err);
    return false;
  }
}

export async function sendMessageWithButtons(
  chatId: string,
  text: string,
  inlineKeyboard: { text: string; callback_data: string }[][]
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN ?? "";
  if (!token || !chatId) return false;
  try {
    const res = await fetch(`${TELEGRAM_API()}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id:      chatId,
        text,
        parse_mode:   "HTML",
        reply_markup: { inline_keyboard: inlineKeyboard },
      }),
    });
    const data = await res.json() as { ok: boolean; description?: string };
    if (!data.ok) console.error("[Telegram] sendMessageWithButtons error:", data.description);
    return data.ok;
  } catch (err) {
    console.error("[Telegram] sendMessageWithButtons fetch error:", err);
    return false;
  }
}

export async function answerCallbackQuery(callbackQueryId: string, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN ?? "";
  if (!token) return;
  try {
    await fetch(`${TELEGRAM_API()}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text, show_alert: true }),
    });
  } catch {}
}

export async function editMessageText(chatId: string, messageId: number, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN ?? "";
  if (!token) return;
  try {
    await fetch(`${TELEGRAM_API()}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, parse_mode: "HTML" }),
    });
  } catch {}
}

// ─── Debit handler (called from webhook callback_query) ───────────────────────

export async function handleDebitCallback(opts: {
  callbackQueryId: string;
  chatId: string;
  messageId: number;
  userId: number;
  amountUsd: number;
  amountFcfa: number;
  adminName: string;
}): Promise<void> {
  const { callbackQueryId, chatId, messageId, userId, amountUsd, amountFcfa, adminName } = opts;

  try {
    const [user] = await db
      .select({ id: usersTable.id, name: usersTable.name, balanceUsd: usersTable.balanceUsd })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) {
      await answerCallbackQuery(callbackQueryId, `❌ Utilisateur #${userId} introuvable.`);
      return;
    }

    if (user.balanceUsd < amountUsd) {
      await answerCallbackQuery(
        callbackQueryId,
        `❌ Solde insuffisant. Solde actuel: ${fmtNum(Math.round(user.balanceUsd * 620))} FCFA`
      );
      return;
    }

    await db.update(usersTable)
      .set({ balanceUsd: sql`${usersTable.balanceUsd} - ${amountUsd}` })
      .where(eq(usersTable.id, userId));

    await db.insert(transactionsTable).values({
      userId,
      type:      "debit",
      amountUsd: -amountUsd,
      amountFcfa: -amountFcfa,
      method:    "admin_telegram",
      provider:  "admin",
      status:    "completed",
      reference: `DEBIT-TG-${Date.now()}`,
      metadata:  JSON.stringify({ source: "telegram_admin_debit", adminName }),
    });

    const newBalanceFcfa = Math.round((user.balanceUsd - amountUsd) * 620);

    await answerCallbackQuery(
      callbackQueryId,
      `✅ ${fmtNum(amountFcfa)} FCFA débité du compte de ${user.name}. Nouveau solde: ${fmtNum(newBalanceFcfa)} FCFA`
    );

    const now = fmtDate(new Date());
    await editMessageText(
      chatId,
      messageId,
      [
        `💰 <b>DÉPÔT REÇU</b>`,
        ``,
        `👤 Utilisateur: <b>${user.name}</b> (#${userId})`,
        `💵 Montant: <b>${fmtNum(amountFcfa)} XOF</b>`,
        `📅 Date: ${now}`,
        ``,
        `🔴 <b>DÉBITÉ</b> par ${adminName} — Nouveau solde: ${fmtNum(newBalanceFcfa)} FCFA`,
      ].join("\n")
    );

    console.log(`[Telegram debit] Débité $${amountUsd.toFixed(4)} (${amountFcfa} FCFA) de l'user #${userId} par ${adminName}`);
  } catch (err) {
    console.error("[Telegram debit] Error:", err);
    await answerCallbackQuery(callbackQueryId, `❌ Erreur lors du débit. Réessayez.`);
  }
}

// ─── Bot updates / detect ─────────────────────────────────────────────────────

export async function detectGroupChats(): Promise<{ chatId: string | null; chats: { id: string; type: string; title: string }[] }> {
  const token = process.env.TELEGRAM_BOT_TOKEN ?? "";
  if (!token) return { chatId: null, chats: [] };
  try {
    const res = await fetch(`${TELEGRAM_API()}/getUpdates?limit=50`);
    const data = await res.json() as { ok: boolean; result: any[] };
    if (!data.ok) return { chatId: null, chats: [] };
    const seen = new Set<string>();
    const chats: { id: string; type: string; title: string }[] = [];
    for (const u of data.result) {
      const c = u.message?.chat ?? u.channel_post?.chat;
      if (!c) continue;
      const id = String(c.id);
      if (seen.has(id)) continue;
      seen.add(id);
      const nameParts = `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim();
      const title = c.title ?? (nameParts || c.username || id);
      chats.push({ id, type: c.type, title: String(title) });
    }
    return { chatId: chats[0]?.id ?? null, chats };
  } catch (err) {
    console.error("[Telegram] detectGroupChats error:", err);
    return { chatId: null, chats: [] };
  }
}

export async function getBotInfo(): Promise<{ ok: boolean; username?: string; firstName?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN ?? "";
  if (!token) return { ok: false };
  try {
    const res = await fetch(`${TELEGRAM_API()}/getMe`);
    const data = await res.json() as { ok: boolean; result?: { username: string; first_name: string } };
    if (data.ok && data.result) return { ok: true, username: data.result.username, firstName: data.result.first_name };
    return { ok: false };
  } catch {
    return { ok: false };
  }
}

// ─── Notification helpers ─────────────────────────────────────────────────────

export async function notifyCryptoPending(opts: {
  userId: number | string;
  userName: string;
  amountUsd: number;
  amountFcfa: number;
  reference: string;
  trackId: string;
}): Promise<void> {
  const chatId = await getChatId();
  if (!chatId) return;
  const now = fmtDate(new Date());
  const text = [
    `₿ <b>TENTATIVE PAIEMENT CRYPTO</b>`,
    ``,
    `👤 Utilisateur: <b>${opts.userName}</b> (#${opts.userId})`,
    `💵 Montant: <b>${fmtNum(opts.amountFcfa)} XOF</b> ($${opts.amountUsd.toFixed(2)})`,
    `🔖 Référence: <code>${opts.reference}</code>`,
    `🔑 TrackID OxaPay: <code>${opts.trackId}</code>`,
    `📅 Date: ${now}`,
    ``,
    `⏳ <i>En attente de confirmation blockchain…</i>`,
  ].join("\n");
  await sendMessage(chatId, text).catch(() => {});
}

export async function notifyDeposit(opts: {
  userId: number;
  userName: string;
  amountFcfa: number;
  amountUsd: number;
  reference: string;
  method: string;
  operator?: string;
  phone?: string;
}): Promise<void> {
  const chatId = await getChatId();
  if (!chatId) return;
  const now = fmtDate(new Date());
  const lines = [
    `💰 <b>DÉPÔT REÇU</b>`,
    ``,
    `👤 Utilisateur: <b>${opts.userName}</b> (#${opts.userId})`,
    `💵 Montant: <b>${fmtNum(opts.amountFcfa)} XOF</b>`,
  ];
  if (opts.phone)    lines.push(`📱 Téléphone: ${opts.phone}`);
  if (opts.operator) lines.push(`🏦 Opérateur: ${opts.operator}`);
  lines.push(`🔖 Référence: <code>${opts.reference}</code>`);
  lines.push(`📅 Date: ${now}`);

  const callbackData = `debit:${opts.userId}:${opts.amountUsd.toFixed(6)}:${opts.amountFcfa}`;

  await sendMessageWithButtons(chatId, lines.join("\n"), [
    [{ text: `🔴 Débiter ${fmtNum(opts.amountFcfa)} FCFA`, callback_data: callbackData }],
  ]).catch(() => {});
}

export async function notifyPurchase(opts: {
  userId: number;
  userName: string;
  orderId: string;
  serviceName: string;
  countryName: string;
  phone: string;
  priceFcfa: number;
  priceUsd: number;
}): Promise<void> {
  const chatId = await getChatId();
  if (!chatId) return;
  const now = fmtDate(new Date());
  const text = [
    `📲 <b>ACHAT DE NUMÉRO</b>`,
    ``,
    `👤 Utilisateur: <b>${opts.userName}</b> (#${opts.userId})`,
    `🌐 Service: <b>${opts.serviceName}</b>`,
    `🌍 Pays: ${opts.countryName}`,
    `📞 Numéro: <code>${opts.phone}</code>`,
    `💵 Prix: <b>${fmtNum(opts.priceFcfa)} FCFA</b> ($${opts.priceUsd.toFixed(2)})`,
    `🔖 Commande: #${opts.orderId}`,
    `📅 Date: ${now}`,
  ].join("\n");
  await sendMessage(chatId, text).catch(() => {});
}

export async function notifyAffiliateWithdrawal(opts: {
  withdrawalId: number;
  userName: string;
  userEmail: string;
  amountUsd: number;
  phone: string;
  country: string;
}): Promise<void> {
  const chatId = await getChatId();
  if (!chatId) return;
  const now = fmtDate(new Date());
  const text = [
    `💸 <b>RETRAIT AFFILIÉ — NOUVELLE DEMANDE</b>`,
    ``,
    `🔖 Référence: <b>#${opts.withdrawalId}</b>`,
    `👤 Utilisateur: <b>${opts.userName}</b>`,
    `📧 Email: ${opts.userEmail}`,
    `💵 Montant: <b>$${opts.amountUsd.toFixed(2)}</b>`,
    `📱 Numéro de réception: <code>${opts.phone}</code>`,
    `🌍 Pays: ${opts.country}`,
    `📅 Date: ${now}`,
    ``,
    `⚙️ Traitez cette demande dans le panneau admin → Affiliations`,
  ].join("\n");
  await sendMessage(chatId, text).catch(() => {});
}

export async function notifyContact(opts: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  const chatId = await getChatId();
  if (!chatId) return;
  const now  = fmtDate(new Date());
  const preview = opts.message.length > 200 ? opts.message.slice(0, 200) + "…" : opts.message;
  const text = [
    `✉️ <b>NOUVEAU MESSAGE DE CONTACT</b>`,
    ``,
    `👤 Nom: <b>${opts.name}</b>`,
    `📧 Email: <code>${opts.email}</code>`,
    `📌 Sujet: <b>${opts.subject}</b>`,
    ``,
    `💬 Message:`,
    preview,
    ``,
    `📅 Date: ${now}`,
    ``,
    `⚙️ Consultez ce message dans le panneau admin → Contact`,
  ].join("\n");
  await sendMessage(chatId, text).catch(() => {});
}

// ─── Daily report ─────────────────────────────────────────────────────────────

export async function sendDailyReport(): Promise<void> {
  const chatId = await getChatId();
  if (!chatId) return;
  const now      = new Date();
  // Le rapport s'exécute à minuit : on bilan la journée qui vient de se terminer (hier)
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());       // aujourd'hui 00:00
  const dayEnd   = dayStart;                                                          // = minuit = fin de hier
  const yesterday = new Date(dayStart.getTime() - 24 * 60 * 60 * 1000);             // hier 00:00

  try {
    const [usersRow] = await db.select({ total: count() }).from(usersTable);
    const usersCount = Number(usersRow?.total ?? 0);

    const [depRow] = await db
      .select({ totalFcfa: sum(transactionsTable.amountFcfa), totalCount: count() })
      .from(transactionsTable)
      .where(and(
        eq(transactionsTable.type, "recharge"),
        eq(transactionsTable.status, "completed"),
        gte(transactionsTable.createdAt, yesterday),
        lt(transactionsTable.createdAt, dayEnd),
      ));
    const depFcfa  = Number(depRow?.totalFcfa  ?? 0);
    const depCount = Number(depRow?.totalCount ?? 0);

    const [buyRow] = await db
      .select({ totalFcfa: sum(ordersTable.priceFcfa), totalCount: count() })
      .from(ordersTable)
      .where(and(
        gte(ordersTable.createdAt, yesterday),
        lt(ordersTable.createdAt, dayEnd),
      ));
    const buyFcfa  = Number(buyRow?.totalFcfa  ?? 0);
    const buyCount = Number(buyRow?.totalCount ?? 0);

    const [balRow] = await db.select({ totalUsd: sum(usersTable.balanceUsd) }).from(usersTable);
    const platformFcfa = Math.round(Number(balRow?.totalUsd ?? 0) * 620);

    const totalFcfa  = depFcfa + buyFcfa;
    const totalCount = depCount + buyCount;
    const commFcfa   = Math.round(buyFcfa * 0.15);

    // Affiche la date de hier (le jour du bilan)
    const dateStr = `${pad(yesterday.getDate())}/${pad(yesterday.getMonth() + 1)}/${yesterday.getFullYear()}`;
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const text = [
      `📊 <b>RAPPORT QUOTIDIEN - ${dateStr}</b>`,
      ``,
      `👥 Utilisateurs: ${fmtNum(usersCount)}`,
      ``,
      `💰 Volume dépôts: ${fmtNum(depFcfa)} FCFA`,
      `🛒 Volume achats: ${fmtNum(buyFcfa)} FCFA`,
      ``,
      `📈 Total transactions: ${fmtNum(totalCount)}`,
      `Volume total: ${fmtNum(totalFcfa)} FCFA`,
      ``,
      `💼 Commissions: ${fmtNum(commFcfa)} FCFA`,
      `🏦 Solde plateforme: ${fmtNum(platformFcfa)} FCFA`,
      ``,
      `🕐 Généré le: ${dateStr} à ${timeStr}`,
    ].join("\n");

    await sendMessage(chatId, text);
  } catch (err) {
    console.error("[Telegram] sendDailyReport error:", err);
  }
}

// ─── Cron scheduler ───────────────────────────────────────────────────────────

export function scheduleDailyReport(): void {
  function msUntilMidnight(): number {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return midnight.getTime() - now.getTime();
  }
  function scheduleNext() {
    const ms = msUntilMidnight();
    console.log(`[Telegram] Rapport quotidien planifié dans ${Math.round(ms / 60000)} min`);
    setTimeout(async () => {
      await sendDailyReport();
      scheduleNext();
    }, ms);
  }
  scheduleNext();
}
