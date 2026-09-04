import { randomBytes, createHash } from "crypto";

export const INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
