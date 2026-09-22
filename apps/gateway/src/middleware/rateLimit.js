/**
 * Simple in-memory sliding-window rate limiter.
 * Suitable for local/dev gateway traffic; replace with Redis in production.
 */
export function rateLimit({ windowMs, max }) {
  const hits = new Map();

  function prune(now) {
    for (const [key, entry] of hits) {
      if (now - entry.start >= windowMs) hits.delete(key);
    }
  }

  return function rateLimitMiddleware(req, res, next) {
    const now = Date.now();
    prune(now);

    const key = req.ip || req.socket?.remoteAddress || "unknown";
    let entry = hits.get(key);

    if (!entry || now - entry.start >= windowMs) {
      entry = { start: now, count: 0 };
      hits.set(key, entry);
    }

    entry.count += 1;
    const remaining = Math.max(0, max - entry.count);

    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader(
      "X-RateLimit-Reset",
      String(Math.ceil((entry.start + windowMs) / 1000)),
    );

    if (entry.count > max) {
      return res.status(429).json({
        error: "Too Many Requests",
        message: "Rate limit exceeded. Try again shortly.",
        requestId: req.requestId,
      });
    }

    next();
  };
}
