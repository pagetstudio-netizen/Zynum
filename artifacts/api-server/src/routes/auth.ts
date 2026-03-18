import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RegisterUserBody, LoginUserBody } from "@workspace/api-zod";
import { hashPassword, verifyPassword, createSession, deleteSession, getUserById, generateApiKey } from "../lib/auth.js";
import { requireAuth, type AuthRequest } from "../middlewares/authMiddleware.js";

const router: IRouter = Router();

router.post("/v1/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const { name, email, password, confirmPassword } = parsed.data;

  if (password !== confirmPassword) {
    res.status(400).json({ error: "Validation error", message: "Les mots de passe ne correspondent pas" });
    return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing) {
    res.status(409).json({ error: "Conflict", message: "Un compte avec cet email existe déjà" });
    return;
  }

  const passwordHash = hashPassword(password);
  const apiKey = generateApiKey();

  const [user] = await db.insert(usersTable).values({ name, email, passwordHash, apiKey }).returning();

  const token = await createSession(user.id);

  res.status(201).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
    token,
  });
});

router.post("/v1/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Unauthorized", message: "Email ou mot de passe incorrect" });
    return;
  }

  const valid = verifyPassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Unauthorized", message: "Email ou mot de passe incorrect" });
    return;
  }

  const token = await createSession(user.id);

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
    token,
  });
});

router.post("/v1/auth/logout", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const token = req.headers.authorization?.replace("Bearer ", "") ?? "";
  await deleteSession(token);
  res.json({ success: true, message: "Déconnecté avec succès" });
});

router.get("/v1/auth/me", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const user = await getUserById(req.userId!);
  if (!user) {
    res.status(401).json({ error: "Unauthorized", message: "Utilisateur introuvable" });
    return;
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  });
});

export default router;
