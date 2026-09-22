import { config } from "../config.js";
import { buildSignatureHeader } from "./webhookSignature.js";
import {
  addDeadLetter,
  appendDelivery,
  getEvent,
  getSubscriptionRaw,
  updateEvent,
} from "./webhookStore.js";
import { bump } from "./metrics.js";

/**
 * Deliver an event to matching subscriptions, with background retries on failure.
 * Exhausted failures are written to the dead-letter queue.
 */
export async function deliverEvent(event, subscriptions) {
  const results = [];

  for (const sub of subscriptions) {
    const attempt = await deliverOnce(event, sub, 1);
    results.push(attempt);
    bump(attempt.ok ? "deliveriesOk" : "deliveriesFailed");

    if (!attempt.ok) {
      if (config.webhooks.maxAttempts > 1) {
        scheduleRetries(event.id, sub.id);
        results.push({
          subscriptionId: sub.id,
          url: sub.url,
          ok: false,
          statusCode: 0,
          durationMs: 0,
          at: new Date().toISOString(),
          attempt: 1,
          retryScheduled: true,
          error: `Retrying up to ${config.webhooks.maxAttempts} attempts`,
        });
        bump("retriesScheduled");
      } else {
        addDeadLetter({
          eventId: event.id,
          subscriptionId: sub.id,
          url: sub.url,
          source: event.source,
          type: event.type,
          error: attempt.error,
          attempts: 1,
          payload: event.payload,
        });
      }
    }
  }

  const concrete = results.filter((r) => !r.retryScheduled);
  const hasRetry = results.some((r) => r.retryScheduled);
  let status = "stored";
  if (concrete.length === 0) status = "stored";
  else if (concrete.every((r) => r.ok)) status = "delivered";
  else if (concrete.some((r) => r.ok)) status = "partial";
  else if (hasRetry) status = "retrying";
  else status = "failed";

  updateEvent(event.id, {
    status,
    deliveries: [...(event.deliveries || []), ...results],
  });

  const refreshed = getEvent(event.id);
  return {
    status: refreshed?.status || status,
    deliveries: refreshed?.deliveries || results,
    maxAttempts: config.webhooks.maxAttempts,
  };
}

function scheduleRetries(eventId, subscriptionId) {
  const maxAttempts = config.webhooks.maxAttempts;

  for (let attempt = 2; attempt <= maxAttempts; attempt += 1) {
    const delay = config.webhooks.retryBaseMs * 2 ** (attempt - 2);

    setTimeout(async () => {
      try {
        const event = getEvent(eventId);
        const sub = getSubscriptionRaw(subscriptionId);
        if (!event || !sub || !sub.active) return;

        const alreadyOk = (event.deliveries || []).some(
          (d) => d.subscriptionId === subscriptionId && d.ok,
        );
        if (alreadyOk) return;

        const result = await deliverOnce(event, sub, attempt);
        bump(result.ok ? "deliveriesOk" : "deliveriesFailed");
        appendDelivery(eventId, result);

        if (!result.ok && attempt >= maxAttempts) {
          addDeadLetter({
            eventId: event.id,
            subscriptionId: sub.id,
            url: sub.url,
            source: event.source,
            type: event.type,
            error: result.error,
            attempts: attempt,
            payload: event.payload,
          });
        }
      } catch (err) {
        console.error(`[gateway] retry failed for ${eventId}:`, err.message);
      }
    }, delay);
  }
}

async function deliverOnce(event, subscription, attempt) {
  const body = {
    id: event.id,
    source: event.source,
    type: event.type,
    payload: event.payload,
    createdAt: event.createdAt,
    attempt,
  };

  const headers = {
    "content-type": "application/json",
    "user-agent": `Hermes-Gateway/${config.version}`,
    "x-hermes-event-id": event.id,
    "x-hermes-event-type": event.type,
    "x-hermes-attempt": String(attempt),
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

    const record = {
      subscriptionId: subscription.id,
      url: subscription.url,
      ok: response.ok,
      statusCode: response.status,
      durationMs: Date.now() - started,
      at: new Date().toISOString(),
      attempt,
    };

    if (!response.ok) {
      record.error = `Upstream responded with ${response.status}`;
    }

    return record;
  } catch (err) {
    return {
      subscriptionId: subscription.id,
      url: subscription.url,
      ok: false,
      statusCode: 0,
      durationMs: Date.now() - started,
      at: new Date().toISOString(),
      attempt,
      error: err.name === "AbortError" ? "Delivery timed out" : err.message,
    };
  } finally {
    clearTimeout(timer);
  }
}
