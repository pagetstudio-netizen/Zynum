import type { Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { AuthRequest } from "./authMiddleware.js";
import { isOwnerAdmin } from "../lib/adminPolicy.js";
import { enforceAdminLocation, getClientIp, recordSecurityEvent } from "./securityMiddleware.js";

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId)).limit(1);
  if (!user || !isOwnerAdmin(user)) {
    res.status(403).json({ error: "Forbidden", message: "Admin access required" });
    return;
  }
  const location = await enforceAdminLocation(req, user);
  if (!location.allowed) {
    await recordSecurityEvent({
      eventType: "admin_country_blocked",
      severity: "critical",
      ip: getClientIp(req),
      geo: location.geo,
      userId: user.id,
      email: user.email,
      method: req.method,
      path: req.originalUrl,
      statusCode: 403,
      details: "Compte administrateur utilisé hors du Togo ou via un hébergeur/VPN",
      notify: true,
    });
    res.status(403).json({
      error: "ADMIN_COUNTRY_BLOCKED",
      message: "L'accès administrateur est disponible uniquement depuis le Togo.",
    });
    return;
  }
  next();
}
