import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtempSync } from "node:fs";

const dataDir = mkdtempSync(path.join(os.tmpdir(), "hermes-store-"));
process.env.HERMES_DATA_DIR = dataDir;

const {
  initStore,
  createSubscription,
  listSubscriptions,
  deleteSubscription,
  createEvent,
  listEvents,
  matchingSubscriptions,
  deriveStatus,
} = await import("../src/services/webhookStore.js");

describe("webhookStore persistence", () => {
  before(() => {
    initStore();
  });

  it("creates and lists subscriptions", () => {
    const sub = createSubscription({
      url: "https://example.com/hooks",
      source: "shop",
      events: ["order.created"],
    });
    assert.ok(sub.id);
    assert.equal(sub.hasSecret, false);
    assert.equal(listSubscriptions().some((item) => item.id === sub.id), true);
    assert.equal(deleteSubscription(sub.id), true);
  });

  it("matches subscriptions by source and event type", () => {
    createSubscription({
      url: "https://example.com/a",
      source: "shop",
      events: ["order.created"],
    });
    createSubscription({
      url: "https://example.com/b",
      source: "*",
      events: ["*"],
    });

    const matched = matchingSubscriptions({
      source: "shop",
      type: "order.created",
    });
    assert.ok(matched.length >= 2);
  });

  it("stores ingest events", () => {
    const event = createEvent({
      source: "shop",
      type: "order.created",
      payload: { orderId: "1" },
    });
    assert.ok(event.id);
    assert.equal(listEvents({ limit: 5 })[0].id, event.id);
  });

  it("derives delivery status", () => {
    assert.equal(deriveStatus([]), "stored");
    assert.equal(deriveStatus([{ ok: true }]), "delivered");
    assert.equal(deriveStatus([{ ok: false }]), "failed");
    assert.equal(deriveStatus([{ ok: true }, { ok: false }]), "partial");
  });
});
