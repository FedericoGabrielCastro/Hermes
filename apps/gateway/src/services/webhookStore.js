import { randomUUID } from "node:crypto";

const MAX_EVENTS = 200;
const subscriptions = new Map();
const events = [];

function now() {
  return new Date().toISOString();
}

export function createSubscription({ url, events: eventTypes = ["*"], secret, source }) {
  if (!url || typeof url !== "string") {
    const err = new Error("url is required");
    err.status = 400;
    throw err;
  }

  try {
    // Validate absolute URL
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
  return subscriptions.delete(id);
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
  if (events.length > MAX_EVENTS) events.length = MAX_EVENTS;
  return event;
}

export function listEvents({ limit = 50 } = {}) {
  return events.slice(0, Math.min(limit, MAX_EVENTS));
}

export function getEvent(id) {
  return events.find((event) => event.id === id) || null;
}

export function updateEvent(id, patch) {
  const event = getEvent(id);
  if (!event) return null;
  Object.assign(event, patch);
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
