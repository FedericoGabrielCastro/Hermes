import { randomUUID } from "node:crypto";
import { config } from "../config.js";
import { loadPersistedState, persistState } from "./persistence.js";
import { bump } from "./metrics.js";

const subscriptions = new Map();
const events = [];
const deadLetters = [];

function now() {
  return new Date().toISOString();
}

function maxEvents() {
  return config.webhooks.maxEvents;
}

function maxDeadLetters() {
  return config.webhooks.maxDeadLetters;
}

export function initStore() {
  const state = loadPersistedState();
  subscriptions.clear();
  events.length = 0;
  deadLetters.length = 0;

  for (const sub of state.subscriptions) {
    subscriptions.set(sub.id, sub);
  }
  for (const event of state.events.slice(0, maxEvents())) {
    events.push(event);
  }
  for (const item of state.deadLetters.slice(0, maxDeadLetters())) {
    deadLetters.push(item);
  }

  console.log(
    `[gateway] loaded ${subscriptions.size} subscriptions, ${events.length} events, ${deadLetters.length} dead letters`,
  );
}

function save() {
  persistState({
    subscriptions: [...subscriptions.values()],
    events: events.slice(0, maxEvents()),
    deadLetters: deadLetters.slice(0, maxDeadLetters()),
  });
}

export function createSubscription({ url, events: eventTypes = ["*"], secret, source }) {
  if (!url || typeof url !== "string") {
    const err = new Error("url is required");
    err.status = 400;
    throw err;
  }

  try {
    // eslint-disable-next-line no-new
    new URL(url);
  } catch {
    const err = new Error("url must be a valid absolute URL");
    err.status = 400;
    throw err;
  }

  const subscription = {
    id: randomUUID(),
    url,
    events: Array.isArray(eventTypes) && eventTypes.length ? eventTypes : ["*"],
    secret: secret || null,
    source: source || "*",
    active: true,
    createdAt: now(),
    updatedAt: now(),
  };

  subscriptions.set(subscription.id, subscription);
  bump("subscriptionsCreated");
  save();
  return sanitizeSubscription(subscription);
}

export function updateSubscription(id, patch = {}) {
  const sub = subscriptions.get(id);
  if (!sub) return null;

  if (patch.url !== undefined) {
    try {
      // eslint-disable-next-line no-new
      new URL(patch.url);
      sub.url = patch.url;
    } catch {
      const err = new Error("url must be a valid absolute URL");
      err.status = 400;
      throw err;
    }
  }

  if (patch.events !== undefined) {
    sub.events =
      Array.isArray(patch.events) && patch.events.length ? patch.events : ["*"];
  }
  if (patch.source !== undefined) sub.source = patch.source || "*";
  if (patch.secret !== undefined) sub.secret = patch.secret || null;
  if (patch.active !== undefined) sub.active = Boolean(patch.active);
  sub.updatedAt = now();

  bump("subscriptionsUpdated");
  save();
  return sanitizeSubscription(sub);
}

export function listSubscriptions() {
  return [...subscriptions.values()].map(sanitizeSubscription);
}

export function getSubscription(id) {
  const sub = subscriptions.get(id);
  return sub ? sanitizeSubscription(sub) : null;
}

export function getSubscriptionRaw(id) {
  return subscriptions.get(id) || null;
}

export function deleteSubscription(id) {
  const removed = subscriptions.delete(id);
  if (removed) {
    bump("subscriptionsDeleted");
    save();
  }
  return removed;
}

export function createEvent({ source, type, payload, requestId, headers = {} }) {
  const event = {
    id: randomUUID(),
    source,
    type: type || "webhook.received",
    payload: payload ?? {},
    headers: pickSafeHeaders(headers),
    requestId: requestId || null,
    status: "received",
    deliveries: [],
    createdAt: now(),
  };

  events.unshift(event);
  if (events.length > maxEvents()) events.length = maxEvents();
  bump("ingestAccepted");
  save();
  return event;
}

export function listEvents({ limit = 50 } = {}) {
  return events.slice(0, Math.min(limit, maxEvents()));
}

export function getEvent(id) {
  return events.find((event) => event.id === id) || null;
}

export function updateEvent(id, patch) {
  const event = getEvent(id);
  if (!event) return null;
  Object.assign(event, patch);
  save();
  return event;
}

export function appendDelivery(eventId, attempt) {
  const event = getEvent(eventId);
  if (!event) return null;
  event.deliveries = [...(event.deliveries || []), attempt];
  event.status = deriveStatus(event.deliveries);
  save();
  return event;
}

export function matchingSubscriptions({ source, type }) {
  return [...subscriptions.values()].filter((sub) => {
    if (!sub.active) return false;
    const sourceOk = sub.source === "*" || sub.source === source;
    const typeOk = sub.events.includes("*") || sub.events.includes(type);
    return sourceOk && typeOk;
  });
}

export function addDeadLetter({
  eventId,
  subscriptionId,
  url,
  source,
  type,
  error,
  attempts,
  payload,
}) {
  const entry = {
    id: randomUUID(),
    eventId,
    subscriptionId,
    url,
    source,
    type,
    error: error || "Delivery exhausted",
    attempts: attempts || config.webhooks.maxAttempts,
    payload: payload ?? {},
    createdAt: now(),
  };
  deadLetters.unshift(entry);
  if (deadLetters.length > maxDeadLetters()) {
    deadLetters.length = maxDeadLetters();
  }
  bump("deadLetters");
  save();
  return entry;
}

export function listDeadLetters({ limit = 50 } = {}) {
  return deadLetters.slice(0, Math.min(limit, maxDeadLetters()));
}

export function getDeadLetter(id) {
  return deadLetters.find((item) => item.id === id) || null;
}

export function deleteDeadLetter(id) {
  const index = deadLetters.findIndex((item) => item.id === id);
  if (index === -1) return false;
  deadLetters.splice(index, 1);
  save();
  return true;
}

export function deriveStatus(deliveries) {
  if (!deliveries.length) return "stored";
  const concrete = deliveries.filter((d) => !d.retryScheduled);
  if (!concrete.length) return "retrying";
  const failed = concrete.filter((d) => !d.ok).length;
  const ok = concrete.filter((d) => d.ok).length;
  if (ok > 0 && failed === 0) return "delivered";
  if (ok > 0 && failed > 0) return "partial";
  if (deliveries.some((d) => d.retryScheduled)) return "retrying";
  return "failed";
}

function sanitizeSubscription(sub) {
  return {
    id: sub.id,
    url: sub.url,
    events: sub.events,
    source: sub.source,
    active: sub.active,
    hasSecret: Boolean(sub.secret),
    createdAt: sub.createdAt,
    updatedAt: sub.updatedAt,
  };
}

function pickSafeHeaders(headers) {
  const allow = [
    "content-type",
    "user-agent",
    "x-request-id",
    "x-event-type",
    "x-hermes-signature",
  ];
  const out = {};
  for (const key of allow) {
    if (headers[key]) out[key] = headers[key];
  }
  return out;
}
