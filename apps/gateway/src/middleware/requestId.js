import { randomUUID } from "node:crypto";

/** Attach a correlation id to every request/response. */
export function requestId(req, res, next) {
  const id = req.headers["x-request-id"] || randomUUID();
  req.requestId = id;
  res.setHeader("X-Request-Id", id);
  next();
}
