import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHmac,
} from "crypto";

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error("ENCRYPTION_KEY 환경변수가 설정되지 않았습니다");
  return Buffer.from(raw, "base64");
}

function getHmacSecret(): string {
  const raw = process.env.SEARCH_HASH_SECRET;
  if (!raw) throw new Error("SEARCH_HASH_SECRET 환경변수가 설정되지 않았습니다");
  return raw;
}

export function validateCryptoEnv(): void {
  getKey();
  getHmacSecret();
}

export function encrypt(plain: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decrypt(ciphertext: string): string {
  const key = getKey();
  const buf = Buffer.from(ciphertext, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(enc) + decipher.final("utf8");
}

export function hashForSearch(value: string): string {
  return createHmac("sha256", getHmacSecret()).update(value).digest("hex");
}
