import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { getProfile } from "../lib/fivesim.js";

const router: IRouter = Router();

const LOW_BALANCE_THRESHOLD = 5;
const DEMO_MODE = process.env.DEMO_MODE === "true";

router.get("/v1/balance", requireAuth, async (_req, res): Promise<void> => {
  // In demo mode return a fake balance so the frontend buy button is not blocked
  if (DEMO_MODE) {
    res.json({ balance: 99.99, currency: "USD", lowBalanceThreshold: LOW_BALANCE_THRESHOLD, isLow: false, demo: true });
    return;
  }

  try {
    const profile = await getProfile();
    const balance = profile.balance;
    const isLow = balance < LOW_BALANCE_THRESHOLD;

    if (isLow) {
      console.warn(`[ZyNum] LOW BALANCE ALERT: 5SIM balance is $${balance} (threshold: $${LOW_BALANCE_THRESHOLD})`);
    }

    res.json({
      balance,
      currency: "USD",
      lowBalanceThreshold: LOW_BALANCE_THRESHOLD,
      isLow,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur lors de la récupération du solde";
    res.status(500).json({ error: "Balance error", message });
  }
});

export default router;
