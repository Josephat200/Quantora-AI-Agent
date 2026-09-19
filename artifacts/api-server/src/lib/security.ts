import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { settings } from "./settings";

type TokenPayload = { sub: string; email: string; name: string; exp: number };

const base64Url = (value: string | Buffer) =>
  Buffer.from(value).toString("base64").replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, encoded: string): boolean {
  const [salt, expected] = encoded.split(":");
  if (!salt || !expected) return false;
  const actual = scryptSync(password, salt, 64);
  const target = Buffer.from(expected, "hex");
  return target.length === actual.length && timingSafeEqual(actual, target);
}

export function createAccessToken(user: { id: string; email: string; fullName: string }): string {
  const header = base64Url(JSON.stringify({ alg: settings.jwtAlgorithm, typ: "JWT" }));
  const payload: TokenPayload = {
    sub: user.id,
    email: user.email,
    name: user.fullName,
    exp: Math.floor(Date.now() / 1000) + settings.accessTokenExpireMinutes * 60,
  };
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signature = base64Url(createHmac("sha256", settings.jwtSecret).update(`${header}.${encodedPayload}`).digest());
  return `${header}.${encodedPayload}.${signature}`;
}

export function decodeAccessToken(token: string): TokenPayload | null {
  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) return null;
  const expected = base64Url(createHmac("sha256", settings.jwtSecret).update(`${header}.${payload}`).digest());
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as TokenPayload;
    return decoded.exp > Math.floor(Date.now() / 1000) ? decoded : null;
  } catch {
    return null;
  }
}