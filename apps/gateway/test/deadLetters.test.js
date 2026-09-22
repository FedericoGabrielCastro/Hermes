import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtempSync } from "node:fs";

const dataDir = mkdtempSync(path.join(os.tmpdir(), "hermes-dlq-"));
process.env.HERMES_DATA_DIR = dataDir;

const {
  initStore,
  createSubscription,
  updateSubscription,
  addDeadLetter,
  listDeadLetters,
  deleteDeadLetter,
} = await import("../src/services/webhookStore.js");

describe("subscriptions and dead letters", () => {
  before(() => initStore());

  it("updates subscription fields", () => {
    const created = createSubscription({
      url: "https://example.com/hooks",
      source: "shop",
      events: ["order.created"],
    });
    const updated = updateSubscription(created.id, {
      active: false,
      events: ["order.created", "order.cancelled"],
      url: "https://example.com/hooks-v2",
    });
    assert.equal(updated.active, false);
    assert.equal(updated.url, "https://example.com/hooks-v2");
    assert.deepEqual(updated.events, ["order.created", "order.cancelled"]);
  });

  it("stores and deletes dead letters", () => {
    const entry = addDeadLetter({
      eventId: "evt_1",
      subscriptionId: "sub_1",
      url: "https://example.com/hooks",
      source: "shop",
      type: "order.created",
      error: "Upstream responded with 500",
      attempts: 3,
      payload: { orderId: "1" },
    });
    assert.ok(entry.id);
    assert.equal(listDeadLetters({ limit: 5 })[0].id, entry.id);
    assert.equal(deleteDeadLetter(entry.id), true);
    assert.equal(
      listDeadLetters({ limit: 5 }).some((item) => item.id === entry.id),
      false,
    );
  });
});
