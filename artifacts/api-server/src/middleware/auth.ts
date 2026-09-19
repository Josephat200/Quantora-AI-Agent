import type { NextFunction, Request, Response } from "express";
import { decodeAccessToken } from "../lib/security";
import { users } from "../lib/stores";
import type { User } from "../types";

export type AuthenticatedRequest = Request & { user?: User };

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : "";
  const payload = token ? decodeAccessToken(token) : null;
  const user = payload ? users.get(payload.sub) : undefined;
  if (!user || !user.isActive) {
    res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "A valid bearer token is required." } });
    return;
  }
  req.user = user;
  next();
}