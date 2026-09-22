/**
 * Per-source rate limiter for webhook ingest endpoints.
 */
export function ingestRateLimit({ windowMs, max }) {
  const hits = new Map();

  function prune(now) {
    for (const [key, entry] of hits) {
      if (now - entry.start >= windowMs) hits.delete(key);
    }
  }

  return function ingestRateLimitMiddleware(req, res, next) {
    const now = Date.now();
    prune(now);
    const source = req.params.source || "unknown";
    let entry = hits.get(source);

    if (!entry || now - entry.start >= windowMs) {
      entry = { start: now, count: 0 };
      hits.set(source, entry);
    }

    entry.count += 1;
    res.setHeader("X-Ingest-RateLimit-Limit", String(max));
    res.setHeader("X-Ingest-RateLimit-Remaining", String(Math.max(0, max - entry.count)));

    if (entry.count > max) {
      return res.status(429).json({
        error: "Too Many Requests",
        message: `Ingest rate limit exceeded for source "${source}"`,
        requestId: req.requestId,
      });
    }

    next();
  };
}
