import { Router } from "express";
import { config } from "../../config.js";
import {
  createSubscription,
  listSubscriptions,
  getSubscription,
  deleteSubscription,
  createEvent,
  listEvents,
  getEvent,
  matchingSubscriptions,
} from "../../services/webhookStore.js";
import { deliverEvent } from "../../services/webhookDelivery.js";
import { verifySignature } from "../../services/webhookSignature.js";

const router = Router();

router.post("/subscriptions", (req, res, next) => {
  try {
    const subscription = createSubscription(req.body || {});
    res.status(201).json(subscription);
  } catch (err) {
    next(err);
  }
});

router.get("/subscriptions", (_req, res) => {
  const items = listSubscriptions();
  res.json({ count: items.length, subscriptions: items });
});

router.get("/subscriptions/:id", (req, res) => {
  const subscription = getSubscription(req.params.id);
  if (!subscription) {
    return res.status(404).json({
      error: "Not Found",
      message: "Subscription not found",
      requestId: req.requestId,
    });
  }
  res.json(subscription);
});

router.delete("/subscriptions/:id", (req, res) => {
  const removed = deleteSubscription(req.params.id);
  if (!removed) {
    return res.status(404).json({
      error: "Not Found",
      message: "Subscription not found",
      requestId: req.requestId,
    });
  }
  res.status(204).send();
});

router.get("/events", (req, res) => {
  const limit = Number(req.query.limit) || 50;
  const items = listEvents({ limit });
  res.json({ count: items.length, events: items });
});

router.get("/events/:id", (req, res) => {
  const event = getEvent(req.params.id);
  if (!event) {
    return res.status(404).json({
      error: "Not Found",
      message: "Event not found",
      requestId: req.requestId,
    });
  }
  res.json(event);
});

router.post("/events/:id/replay", async (req, res, next) => {
  try {
    const event = getEvent(req.params.id);
    if (!event) {
      return res.status(404).json({
        error: "Not Found",
        message: "Event not found",
        requestId: req.requestId,
      });
    }

    const targets = matchingSubscriptions({
      source: event.source,
      type: event.type,
    });
    const result = await deliverEvent(event, targets);
    res.json({ eventId: event.id, ...result });
  } catch (err) {
    next(err);
  }
});

/**
 * Ingest an inbound webhook for a named source and fan-out to subscribers.
 * Optional HMAC: set WEBHOOK_INGEST_SECRET and send X-Hermes-Signature.
 */
router.post("/ingest/:source", async (req, res, next) => {
  try {
    const source = req.params.source;
    const type =
      req.get("x-event-type") ||
      req.body?.type ||
      `${source}.event`;

    const ingestSecret = config.webhooks.ingestSecret;
    if (ingestSecret) {
      const ok = verifySignature(
        ingestSecret,
        req.body,
        req.get("x-hermes-signature"),
      );
      if (!ok) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Invalid webhook signature",
          requestId: req.requestId,
        });
      }
    }

    const event = createEvent({
      source,
      type,
      payload: req.body ?? {},
      requestId: req.requestId,
      headers: req.headers,
    });

    const targets = matchingSubscriptions({ source, type });
    const result = await deliverEvent(event, targets);

    res.status(202).json({
      accepted: true,
      eventId: event.id,
      matchedSubscriptions: targets.length,
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
