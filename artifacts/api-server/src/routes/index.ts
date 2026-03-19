import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import servicesRouter from "./services.js";
import numbersRouter from "./numbers.js";
import balanceRouter from "./balance.js";
import developerRouter from "./developer.js";
import adminRouter from "./admin.js";
import contactRouter from "./contact.js";
import paxityRouter from "./paxity.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(servicesRouter);
router.use(numbersRouter);
router.use(balanceRouter);
router.use(developerRouter);
router.use(adminRouter);
router.use(contactRouter);
router.use(paxityRouter);

export default router;
