import { Router, type IRouter } from "express";
import { getAvailableServices, getCountriesForService, MIN_PRICE_FCFA } from "../lib/fivesim.js";
import { GetCountriesQueryParams } from "@workspace/api-zod";
import { db, countryOverridesTable } from "@workspace/db";
import { getCommissionMultiplier } from "../lib/commission.js";

const router: IRouter = Router();

router.get("/v1/services", async (_req, res): Promise<void> => {
  const services = await getAvailableServices();
  res.json({ services });
});

router.get("/v1/countries", async (req, res): Promise<void> => {
  const parsed = GetCountriesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const service = parsed.data.service ?? "telegram";
  const [countries, overrides, commissionMultiplier] = await Promise.all([
    getCountriesForService(service),
    db.select().from(countryOverridesTable),
    getCommissionMultiplier(),
  ]);

  const overrideMap = new Map(overrides.map((o) => [o.countrySlug, o]));

  const filtered = countries
    .filter((c) => {
      const ov = overrideMap.get(c.code);
      return !ov || !ov.isDisabled;
    })
    .map((c) => {
      const ov = overrideMap.get(c.code);
      const countryMultiplier = ov && ov.priceMultiplier !== 1.0 ? ov.priceMultiplier : 1.0;
      const totalMultiplier = countryMultiplier * commissionMultiplier;
      const finalPriceFcfa = Math.max(MIN_PRICE_FCFA, Math.round(c.priceFcfa * totalMultiplier));
      if (totalMultiplier === 1.0 && c.priceFcfa >= MIN_PRICE_FCFA) return c;
      return {
        ...c,
        priceUsd: Math.round(c.priceUsd * totalMultiplier * 100) / 100,
        priceFcfa: finalPriceFcfa,
      };
    });

  res.json({ countries: filtered });
});

export default router;
