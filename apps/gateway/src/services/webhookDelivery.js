import { config } from "../config.js";
import { buildSignatureHeader } from "./webhookSignature.js";
import { updateEvent } from "./webhookStore.js";

/**
 * Deliver an event to matching subscriptions and record each attempt.
 */
export async function deliverEvent(event, subscriptions) {
  const results = [];

  for (const sub of subscriptions) {
    const attempt = await deliverOnce(event, sub);
    results.push(attempt);
  }

  const failed = results.filter((r) => !r.ok).length;
  const status =
    results.length === 0 ? "stored" : failed === 0 ? "delivered" : failed === results.length ? "failed" : "partial";

  updateEvent(event.id, {
    status,
    deliveries: [...(event.deliveries || []), ...results],
  });

  return { status, deliveries: results };
}

async function deliverOnce(event, subscription) {
  const body = {
    id: event.id,
    source: event.source,
    type: event.type,
    payload: event.payload,
    createdAt: event.createdAt,
  };

  const headers = {
    "content-type": "application/json",
    "user-agent": "Hermes-Gateway/0.1",
    "x-hermes-event-id": event.id,
    "x-hermes-event-type": event.type,
    "x-request-id": event.requestId || "",
  };

  if (subscription.secret) {
    headers["x-hermes-signature"] = buildSignatureHeader(subscription.secret, body);
  }

  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    config.webhooks.deliveryTimeoutMs,
  );

  try {
    const response = await fetch(subscription.url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const attempt = {
      subscriptionId: subscription.id,
      url: subscription.url,
      ok: response.ok,
      statusCode: response.status,
      durationMs: Date.now() - started,
      at: new Date().toISOString(),
    };

    if (!response.ok) {
      attempt.error = `Upstream responded with ${response.status}`;
    }

    return attempt;
  } catch (err) {
    return {
      subscriptionId: subscription.id,
      url: subscription.url,
      ok: false,
      statusCode: 0,
      durationMs: Date.now() - started,
      at: new Date().toISOString(),
      error: err.name === "AbortError" ? "Delivery timed out" : err.message,
    };
  } finally {
    clearTimeout(timer);
  }
}
