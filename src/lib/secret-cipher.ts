import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

export type Encrypted = { iv: string; authTag: string; data: string };

function getKey(): Buffer {
  const raw = process.env.SETTINGS_ENCRYPTION_KEY;
  if (!raw) throw new Error("SETTINGS_ENCRYPTION_KEY is not set");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("SETTINGS_ENCRYPTION_KEY must decode to 32 bytes (generate with `openssl rand -base64 32`)");
  return key;
}

export function encrypt(plaintext: string): Encrypted {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const data = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return {
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    data: data.toString("base64"),
  };
}

export function decrypt(enc: Encrypted): string {
  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(enc.iv, "base64"));
  decipher.setAuthTag(Buffer.from(enc.authTag, "base64"));
  const data = Buffer.concat([decipher.update(Buffer.from(enc.data, "base64")), decipher.final()]);
  return data.toString("utf8");
}
