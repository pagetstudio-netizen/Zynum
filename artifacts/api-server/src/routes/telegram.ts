import { Router, type IRouter, type Request, type Response } from "express";
import { isIP } from "node:net";
import { db, ipBlocksTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { requireAdmin } from "../middlewares/adminMiddleware.js";
import {
  sendMessage, detectGroupChats, saveChatId, getChatId,
  getBotInfo, sendDailyReport, handleDebitCallback, answerCallbackQuery,
  isAuthorizedAdminGroupMessage, notifyAdminSecurityAction,
} from "../lib/telegram.js";
import { blockIp, recordSecurityEvent } from "../middlewares/securityMiddleware.js";

const router: IRouter = Router();

function telegramAdminLabel(from: any): string {
  if (from?.username) return `@${from.username}`;
  return `${from?.first_name ?? ""} ${from?.last_name ?? ""}`.trim() || "Administrateur Telegram";
}

function parseTelegramCommand(rawText: string): { command: string; args: string } {
  const match = rawText.trim().match(/^\/([a-z_]+)(?:@[a-z0-9_]+)?(?:\s+([\s\S]*))?$/i);
  return {
    command: (match?.[1] ?? "").toLowerCase(),
    args: match?.[2]?.trim() ?? "",
  };
}

function parseUserId(args: string): number | null {
  const value = Number.parseInt(args.split(/\s+/, 1)[0] ?? "", 10);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

const GROUP_ADMIN_COMMANDS = new Set([
  "ban", "bannir", "unban", "debannir",
  "blockip", "bloquerip", "unblockip", "debloquerip",
]);

// ─── Webhook (bot commands + callback_query) ──────────────────────────────────

router.post("/v1/telegram/webhook", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body ?? {};

    // ── Inline button callback (bouton Débiter) ────────────────────────────────
    const cbq = body.callback_query;
    if (cbq) {
      res.json({ ok: true });

      const callbackQueryId = String(cbq.id ?? "");
      const data            = String(cbq.data ?? "");
      const chatId          = String(cbq.message?.chat?.id ?? "");
      const messageId       = Number(cbq.message?.message_id ?? 0);
      const adminName       = String(
        cbq.from?.username
          ? `@${cbq.from.username}`
          : `${cbq.from?.first_name ?? ""} ${cbq.from?.last_name ?? ""}`.trim() || "Admin"
      );

      if (data.startsWith("debit:")) {
        const parts = data.split(":");
        const userId     = parseInt(parts[1] ?? "0", 10);
        const amountUsd  = parseFloat(parts[2] ?? "0");
        const amountFcfa = parseInt(parts[3] ?? "0", 10);

        if (!userId || !amountUsd) {
          await answerCallbackQuery(callbackQueryId, "❌ Données invalides.");
          return;
        }

        await handleDebitCallback({
          callbackQueryId,
          chatId,
          messageId,
          userId,
          amountUsd,
          amountFcfa,
          adminName,
        });
      } else {
        await answerCallbackQuery(callbackQueryId, "Action inconnue.");
      }

      return;
    }

    // ── Message texte ──────────────────────────────────────────────────────────
    const msg  = body.message ?? body.channel_post;
    if (!msg) { res.json({ ok: true }); return; }

    const chatId = String(msg.chat?.id ?? "");
    const rawText = String(msg.text ?? "").trim();
    const text = rawText.toLowerCase();
    const { command, args } = parseTelegramCommand(rawText);

    if (GROUP_ADMIN_COMMANDS.has(command)) {
      const isAuthorized = await isAuthorizedAdminGroupMessage(
        chatId,
        String(msg.chat?.type ?? ""),
        Number(msg.from?.id ?? 0) || null,
      );
      if (!isAuthorized) {
        if (msg.chat?.type === "group" || msg.chat?.type === "supergroup") {
          await sendMessage(chatId, "⛔ Cette commande est réservée aux administrateurs du groupe configuré.");
        }
        res.json({ ok: true });
        return;
      }

      const adminName = telegramAdminLabel(msg.from);

      if (command === "ban" || command === "bannir" || command === "unban" || command === "debannir") {
        const userId = parseUserId(args);
        if (!userId) {
          await sendMessage(chatId, `⚠️ Utilisation: /${command} <id_utilisateur>`);
          res.json({ ok: true });
          return;
        }

        const [user] = await db
          .select({
            id: usersTable.id,
            name: usersTable.name,
            email: usersTable.email,
            isAdmin: usersTable.isAdmin,
            isBanned: usersTable.isBanned,
          })
          .from(usersTable)
          .where(eq(usersTable.id, userId))
          .limit(1);

        if (!user) {
          await sendMessage(chatId, `❌ Utilisateur #${userId} introuvable.`);
          res.json({ ok: true });
          return;
        }
        if (user.isAdmin) {
          await sendMessage(chatId, "⛔ Un compte administrateur ne peut pas être banni depuis Telegram.");
          res.json({ ok: true });
          return;
        }

        const shouldBan = command === "ban" || command === "bannir";
        if (user.isBanned === shouldBan) {
          await sendMessage(chatId, `ℹ️ Le compte de ${user.name} est déjà ${shouldBan ? "banni" : "actif"}.`);
          res.json({ ok: true });
          return;
        }

        await db.update(usersTable).set({ isBanned: shouldBan }).where(eq(usersTable.id, user.id));
        await recordSecurityEvent({
          eventType: shouldBan ? "user_banned_telegram" : "user_unbanned_telegram",
          severity: shouldBan ? "high" : "info",
          ip: "telegram",
          userId: user.id,
          email: user.email,
          method: "TELEGRAM",
          path: `/${command}`,
          statusCode: 200,
          details: `${shouldBan ? "Bannissement" : "Débannissement"} par ${adminName}`,
          notify: false,
        });
        await notifyAdminSecurityAction({
          adminName,
          action: shouldBan ? "BANNISSEMENT D'UTILISATEUR" : "DÉBANNISSEMENT D'UTILISATEUR",
          target: `${user.name} (#${user.id})`,
          details: [
            `Email: ${user.email}`,
            `Nouveau statut: ${shouldBan ? "banni" : "actif"}`,
            "Origine: commande Telegram dans le groupe administrateur",
          ],
        });
        await sendMessage(chatId, `✅ ${user.name} (#${user.id}) est maintenant ${shouldBan ? "banni" : "actif"}.`);
        res.json({ ok: true });
        return;
      }

      const ip = args.split(/\s+/, 1)[0] ?? "";
      if (!ip || isIP(ip) === 0) {
        await sendMessage(chatId, `⚠️ Utilisation: /${command} <adresse_ip> [motif]`);
        res.json({ ok: true });
        return;
      }

      if (command === "blockip" || command === "bloquerip") {
        const reason = args.slice(ip.length).trim() || "Blocage demandé depuis Telegram";
        const blockedUntil = await blockIp(ip, reason);
        await recordSecurityEvent({
          eventType: "ip_blocked_telegram",
          severity: "high",
          ip,
          method: "TELEGRAM",
          path: `/${command}`,
          statusCode: 200,
          details: `Blocage par ${adminName}: ${reason}`,
          notify: false,
        });
        await notifyAdminSecurityAction({
          adminName,
          action: "BLOCAGE D'ADRESSE IP",
          target: ip,
          details: [
            `Motif: ${reason}`,
            `Bloquée jusqu'au: ${blockedUntil.toISOString()}`,
            "Origine: commande Telegram dans le groupe administrateur",
          ],
        });
        await sendMessage(chatId, `✅ Adresse IP ${ip} bloquée jusqu'au ${blockedUntil.toISOString()}.`);
        res.json({ ok: true });
        return;
      }

      await db.delete(ipBlocksTable).where(eq(ipBlocksTable.ip, ip));
      await recordSecurityEvent({
        eventType: "ip_unblocked_telegram",
        severity: "info",
        ip,
        method: "TELEGRAM",
        path: `/${command}`,
        statusCode: 200,
        details: `Déblocage par ${adminName}`,
        notify: false,
      });
      await notifyAdminSecurityAction({
        adminName,
        action: "DÉBLOCAGE D'ADRESSE IP",
        target: ip,
        details: [
          "L'adresse IP peut de nouveau accéder à la plateforme.",
          "Origine: commande Telegram dans le groupe administrateur",
        ],
      });
      await sendMessage(chatId, `✅ Adresse IP ${ip} débloquée.`);
      res.json({ ok: true });
      return;
    }

    if (text.startsWith("/start")) {
      await sendMessage(chatId, [
        `👋 <b>Bienvenue sur ZyNum Bot !</b>`,
        ``,
        `Je vous enverrai des notifications en temps réel pour :`,
        `• 💰 Dépôts reçus`,
        `• 📲 Achats de numéros virtuels`,
        `• 📊 Rapports quotidiens`,
        ``,
        `Tapez /aide pour voir toutes les commandes.`,
      ].join("\n"));
    } else if (text.startsWith("/aide") || text.startsWith("/help")) {
      await sendMessage(chatId, [
        `📋 <b>Commandes disponibles</b>`,
        ``,
        `/start — Message de bienvenue`,
        `/aide — Afficher cette aide`,
        `/stat — Statistiques du jour`,
        `/rapport — Envoyer le rapport maintenant`,
        `/chatid — Afficher l'ID de ce chat`,
        `/ping — Tester la connexion`,
        ``,
        `<b>Commandes de sécurité — groupe admin uniquement</b>`,
        `/ban &lt;id&gt; — Bannir un utilisateur`,
        `/unban &lt;id&gt; — Débannir un utilisateur`,
        `/blockip &lt;ip&gt; [motif] — Bloquer une adresse IP`,
        `/unblockip &lt;ip&gt; — Débloquer une adresse IP`,
      ].join("\n"));
    } else if (text.startsWith("/chatid")) {
      await sendMessage(chatId, `🆔 <b>Chat ID :</b> <code>${chatId}</code>\n\nCopiez cet ID et collez-le dans la section Telegram du panneau admin.`);
    } else if (text.startsWith("/ping")) {
      await sendMessage(chatId, `🏓 <b>Pong !</b> ZyNum Bot est opérationnel ✅`);
    } else if (text.startsWith("/stat")) {
      await sendDailyReport();
    } else if (text.startsWith("/rapport")) {
      await sendDailyReport();
      await sendMessage(chatId, `✅ Rapport envoyé dans le groupe configuré.`);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("[Telegram webhook] Error:", err);
    res.json({ ok: true });
  }
});

// ─── Admin: get bot info ──────────────────────────────────────────────────────

router.get("/v1/admin/telegram/info", requireAuth, requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  const hasToken = !!process.env.TELEGRAM_BOT_TOKEN;
  const botInfo  = hasToken ? await getBotInfo() : { ok: false };
  const chatId   = await getChatId();
  res.json({ hasToken, botInfo, chatId });
});

// ─── Admin: detect group chats from getUpdates ────────────────────────────────

router.get("/v1/admin/telegram/detect", requireAuth, requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await detectGroupChats();
    res.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur";
    res.status(500).json({ success: false, message });
  }
});

// ─── Admin: save chat ID ──────────────────────────────────────────────────────

router.post("/v1/admin/telegram/chat-id", requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { chatId } = req.body ?? {};
    if (!chatId) { res.status(400).json({ error: "chatId requis" }); return; }
    await saveChatId(String(chatId));
    res.json({ success: true, chatId: String(chatId) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur";
    res.status(500).json({ success: false, message });
  }
});

// ─── Admin: send test message ─────────────────────────────────────────────────

router.post("/v1/admin/telegram/test", requireAuth, requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const chatId = await getChatId();
    if (!chatId) { res.status(400).json({ error: "Aucun Chat ID configuré" }); return; }
    const ok = await sendMessage(chatId, `✅ <b>Test ZyNum Bot</b>\n\nConnexion opérationnelle ! Les notifications sont actives.`);
    res.json({ success: ok, chatId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur";
    res.status(500).json({ success: false, message });
  }
});

// ─── Admin: send daily report now ────────────────────────────────────────────

router.post("/v1/admin/telegram/report", requireAuth, requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const chatId = await getChatId();
    if (!chatId) { res.status(400).json({ error: "Aucun Chat ID configuré" }); return; }
    await sendDailyReport();
    res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur";
    res.status(500).json({ success: false, message });
  }
});

export default router;
