import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildSignatureHeader,
  signPayload,
  verifySignature,
} from "../src/services/webhookSignature.js";

describe("webhookSignature", () => {
  it("signs payloads deterministically", () => {
    const body = { hello: "world" };
    const a = signPayload("secret", body);
    const b = signPayload("secret", body);
    assert.equal(a, b);
    assert.match(a, /^[a-f0-9]{64}$/);
  });

  it("verifies matching HMAC headers", () => {
    const body = { id: "evt_1" };
    const header = buildSignatureHeader("top-secret", body);
    assert.equal(verifySignature("top-secret", body, header), true);
    assert.equal(verifySignature("top-secret", body, "sha256=deadbeef"), false);
    assert.equal(verifySignature("top-secret", body, null), false);
  });

  it("allows unsigned traffic when no secret is configured", () => {
    assert.equal(verifySignature(null, { a: 1 }, null), true);
  });
});
