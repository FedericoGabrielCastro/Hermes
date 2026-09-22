import { randomUUID } from "node:crypto";
import { config } from "../config.js";
import { loadPersistedState, persistState } from "./persistence.js";
import { bump } from "./metrics.js";

const subscriptions = new Map();
const events = [];

function now() {
  return new Date().toISOString();
}

function maxEvents() {
  return config.webhooks.maxEvents;
}

export function initStore() {
  const state = loadPersistedState();
  subscriptions.clear();
  events.length = 0;

  for (const sub of state.subscriptions) {
    subscriptions.set(sub.id, sub);
  }
  for (const event of state.events.slice(0, maxEvents())) {
    events.push(event);
  }

  console.log(
    `[gateway] loaded ${subscriptions.size} subscriptions and ${events.length} events from disk`,
  );
}

function save() {
  persistState({
    subscriptions: [...subscriptions.values()],
    events: events.slice(0, maxEvents()),
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

export function deriveStatus(deliveries) {
  if (!deliveries.length) return "stored";
  const failed = deliveries.filter((d) => !d.ok).length;
  const ok = deliveries.filter((d) => d.ok).length;
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
