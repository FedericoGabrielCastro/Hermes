import { createHmac, timingSafeEqual } from "node:crypto";

export function signPayload(secret, body) {
  const payload = typeof body === "string" ? body : JSON.stringify(body);
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function buildSignatureHeader(secret, body) {
  return `sha256=${signPayload(secret, body)}`;
}

/** Verify optional inbound HMAC signature (X-Hermes-Signature: sha256=...). */
export function verifySignature(secret, rawBody, headerValue) {
  if (!secret) return true;
  if (!headerValue || typeof headerValue !== "string") return false;

  const expected = buildSignatureHeader(secret, rawBody);
  const provided = headerValue.trim();

  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
