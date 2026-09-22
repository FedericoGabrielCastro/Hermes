import { recordAudit } from "../services/auditLog.js";

/** Capture a compact audit entry after each response finishes. */
export function auditMiddleware(req, res, next) {
  const started = Date.now();

  res.on("finish", () => {
    recordAudit({
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: Date.now() - started,
      requestId: req.requestId || null,
      ip: req.ip || null,
    });
  });

  next();
}
