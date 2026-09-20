import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { dataDir } from "./db";

type CryptoGlobal = typeof globalThis & { __sfsecret?: Buffer };
const g = globalThis as CryptoGlobal;

/**
 * The key that encrypts stored secrets (Tebex private key). It is generated on first run and kept
 * in the data volume, so nobody has to configure an environment variable. APP_SECRET may override it.
 */
function secretKey(): Buffer {
  if (g.__sfsecret) return g.__sfsecret;
  let raw = process.env.APP_SECRET || "";
  if (!raw) {
    const file = path.join(dataDir(), "app.secret");
    if (fs.existsSync(file)) raw = fs.readFileSync(file, "utf8").trim();
    if (!raw) {
      raw = crypto.randomBytes(48).toString("hex");
      fs.writeFileSync(file, raw, { mode: 0o600 });
    }
  }
  g.__sfsecret = crypto.createHash("sha256").update(raw).digest();
  return g.__sfsecret;
}

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", secretKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), enc.toString("base64")].join(":");
}

export function decryptSecret(payload: string): string {
  if (!payload) return "";
  const [v, iv, tag, data] = payload.split(":");
  if (v !== "v1" || !iv || !tag || !data) return "";
  try {
    const d = crypto.createDecipheriv("aes-256-gcm", secretKey(), Buffer.from(iv, "base64"));
    d.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([d.update(Buffer.from(data, "base64")), d.final()]).toString("utf8");
  } catch {
    return "";
  }
}

export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

/** Constant-time HMAC used for the signed demo-cart cookie. */
export function sign(value: string): string {
  return crypto.createHmac("sha256", secretKey()).update(value).digest("base64url");
}
