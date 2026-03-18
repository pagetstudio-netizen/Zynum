import { Router, type IRouter } from "express";
import { getAvailableServices, getCountriesForService } from "../lib/fivesim.js";
import { GetCountriesQueryParams } from "@workspace/api-zod";

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
  const countries = await getCountriesForService(service);
  res.json({ countries });
});

export default router;
