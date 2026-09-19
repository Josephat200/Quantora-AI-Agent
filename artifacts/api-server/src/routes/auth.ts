import { Router, type IRouter } from "express";
import { newId, users } from "../lib/stores";
import { createAccessToken, hashPassword, verifyPassword } from "../lib/security";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";

const router: IRouter = Router();
const publicUser = (user: { id: string; email: string; fullName: string; isActive: boolean }) => ({ id: user.id, email: user.email, full_name: user.fullName, is_active: user.isActive });

router.post("/v1/auth/register", (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const fullName = typeof req.body?.full_name === "string" ? req.body.full_name.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!email.includes("@") || fullName.length < 2 || password.length < 6) {
    res.status(422).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Provide a valid email, full name, and password of at least 6 characters." } });
    return;
  }
  if ([...users.values()].some((user) => user.email === email)) {
    res.status(409).json({ success: false, error: { code: "EMAIL_EXISTS", message: "An account with that email already exists." } });
    return;
  }
  const user = { id: newId(), email, fullName, hashedPassword: hashPassword(password), isActive: true };
  users.set(user.id, user);
  res.status(201).json({ access_token: createAccessToken(user), token_type: "bearer", user: publicUser(user) });
});

router.post("/v1/auth/login", (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const user = [...users.values()].find((candidate) => candidate.email === email);
  if (!user || !verifyPassword(password, user.hashedPassword)) {
    res.status(401).json({ success: false, error: { code: "INVALID_CREDENTIALS", message: "Email or password is incorrect." } });
    return;
  }
  res.json({ access_token: createAccessToken(user), token_type: "bearer", user: publicUser(user) });
});

router.get("/v1/auth/me", requireAuth, (req: AuthenticatedRequest, res) => {
  res.json(publicUser(req.user!));
});

export default router;