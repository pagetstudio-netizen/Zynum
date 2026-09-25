import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/authMiddleware.js";
import { generateApiKey } from "../lib/auth.js";
import { normalizeWebhookUrl } from "../lib/webhooks.js";

const router: IRouter = Router();

router.get("/v1/developer/apikey", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);

  if (!user) {
    res.status(401).json({ error: "Unauthorized", message: "Utilisateur introuvable" });
    return;
  }

  if (!user.apiKey) {
    const newKey = generateApiKey();
    await db.update(usersTable).set({ apiKey: newKey }).where(eq(usersTable.id, user.id));
    res.json({ apiKey: newKey, createdAt: user.createdAt.toISOString() });
    return;
  }

  res.json({ apiKey: user.apiKey, createdAt: user.createdAt.toISOString() });
});

router.post("/v1/developer/apikey", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const newKey = generateApiKey();

  const [user] = await db
    .update(usersTable)
    .set({ apiKey: newKey })
    .where(eq(usersTable.id, req.userId!))
    .returning();

  res.json({ apiKey: newKey, createdAt: user.createdAt.toISOString() });
});

router.get("/v1/developer/webhook", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const [user] = await db
    .select({ webhookUrl: usersTable.webhookUrl })
    .from(usersTable)
    .where(eq(usersTable.id, req.userId!))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Unauthorized", message: "Utilisateur introuvable" });
    return;
  }

  res.json({
    webhookUrl: user.webhookUrl,
    events: ["order.created", "order.updated"],
  });
});

router.put("/v1/developer/webhook", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  if (!req.body || typeof req.body !== "object" || !Object.hasOwn(req.body, "url")) {
    res.status(400).json({ error: "Validation error", message: "Le champ url est requis (ou null pour désactiver le webhook)." });
    return;
  }
  const { url } = req.body as { url?: unknown };
  let webhookUrl: string | null = null;

  if (url !== null && url !== "") {
    try {
      webhookUrl = normalizeWebhookUrl(url);
    } catch (error) {
      res.status(400).json({
        error: "Validation error",
        message: error instanceof Error ? error.message : "URL de webhook invalide.",
      });
      return;
    }
  }

  const [user] = await db
    .update(usersTable)
    .set({ webhookUrl })
    .where(eq(usersTable.id, req.userId!))
    .returning({ webhookUrl: usersTable.webhookUrl });

  if (!user) {
    res.status(401).json({ error: "Unauthorized", message: "Utilisateur introuvable" });
    return;
  }

  res.json({ webhookUrl: user.webhookUrl, events: ["order.created", "order.updated"] });
});

export default router;
