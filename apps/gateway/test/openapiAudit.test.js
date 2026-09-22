import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildOpenApi } from "../src/services/openapi.js";
import { recordAudit, listAudit, clearAudit } from "../src/services/auditLog.js";

describe("openapi and audit", () => {
  it("builds an OpenAPI document with webhook paths", () => {
    const doc = buildOpenApi();
    assert.equal(doc.openapi, "3.0.3");
    assert.ok(doc.paths["/api/v1/webhooks/ingest/{source}"]);
    assert.ok(doc.paths["/api/v1/webhooks/dead-letters"]);
  });

  it("records audit entries with a max window", () => {
    clearAudit();
    recordAudit({ method: "GET", path: "/health", statusCode: 200, durationMs: 1 });
    recordAudit({ method: "POST", path: "/api/v1/webhooks/ingest/shop", statusCode: 202, durationMs: 12 });
    const entries = listAudit({ limit: 10 });
    assert.equal(entries.length, 2);
    assert.equal(entries[0].method, "POST");
  });
});
