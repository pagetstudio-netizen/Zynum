import { Router, type IRouter } from "express";
import { requireAuth, type AuthRequest } from "../middlewares/authMiddleware.js";
import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

const DEMO_MODE = process.env.DEMO_MODE === "true";
const DEMO_STARTER_USD = 10; // credits given on first demo check

router.get("/v1/balance", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  try {
    const [user] = await db
      .select({ balanceUsd: usersTable.balanceUsd })
      .from(usersTable)
      .where(eq(usersTable.id, req.userId!))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "Not found", message: "Utilisateur introuvable" });
      return;
    }

    let balance = user.balanceUsd;

    // In demo mode auto-credit the user so they can test purchases
    if (DEMO_MODE && balance === 0) {
      const [updated] = await db
        .update(usersTable)
        .set({ balanceUsd: DEMO_STARTER_USD })
        .where(eq(usersTable.id, req.userId!))
        .returning({ balanceUsd: usersTable.balanceUsd });
      balance = updated.balanceUsd;
    }

    res.json({
      balance,
      currency: "USD",
      demo: DEMO_MODE,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur lors de la récupération du solde";
    res.status(500).json({ error: "Balance error", message });
  }
});

export default router;
