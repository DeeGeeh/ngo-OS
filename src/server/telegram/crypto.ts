import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const algorithm = "aes-256-gcm";

function keyFromHex(key: string) {
  const value = Buffer.from(key, "hex");
  if (value.length !== 32) throw new Error("Telegram session encryption key must be 32 bytes.");
  return value;
}

export function encryptTelegramSecret(value: string, key: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(algorithm, keyFromHex(key), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decryptTelegramSecret(value: string, key: string) {
  const [ivValue, tagValue, encryptedValue] = value.split(".");
  if (!ivValue || !tagValue || !encryptedValue) throw new Error("Invalid Telegram secret.");
  const decipher = createDecipheriv(algorithm, keyFromHex(key), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
