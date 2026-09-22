import { Router } from "express";
import { config } from "../../config.js";
import { listRoutes, getUpstream } from "../../services/routeRegistry.js";
import { proxyRequest } from "../../services/proxy.js";
import { getMetrics } from "../../services/metrics.js";
import { listAudit } from "../../services/auditLog.js";
import { buildOpenApi } from "../../services/openapi.js";
import webhookRoutes from "./webhooks.js";

const router = Router();

router.use("/webhooks", webhookRoutes);

router.get("/status", (_req, res) => {
  res.json({
    status: "online",
    service: config.serviceName,
    version: config.version,
    uptimeSeconds: Math.floor(process.uptime()),
    rateLimit: config.rateLimit,
    ingestRateLimit: config.ingestRateLimit,
    webhooks: {
      maxAttempts: config.webhooks.maxAttempts,
      retryBaseMs: config.webhooks.retryBaseMs,
      deliveryTimeoutMs: config.webhooks.deliveryTimeoutMs,
      maxDeadLetters: config.webhooks.maxDeadLetters,
      persistence: true,
      deadLetterQueue: true,
    },
    upstreams: Object.fromEntries(
      Object.entries(config.upstreams).map(([name, upstream]) => [
        name,
        { baseUrl: upstream.baseUrl, timeoutMs: upstream.timeoutMs },
      ]),
    ),
    docs: {
      openapi: "/api/v1/openapi.json",
      console: "http://localhost:3000/console",
    },
    timestamp: new Date().toISOString(),
  });
});

router.get("/metrics", (_req, res) => {
  res.json(getMetrics());
});

router.get("/audit", (req, res) => {
  const limit = Number(req.query.limit) || 50;
  const items = listAudit({ limit });
  res.json({ count: items.length, entries: items });
});

router.get("/openapi.json", (_req, res) => {
  res.json(buildOpenApi());
});

router.get("/routes", (_req, res) => {
  res.json({
    count: listRoutes().length,
    routes: listRoutes(),
  });
});

router.all("/proxy/echo", proxyEcho);
router.all("/proxy/echo/*", proxyEcho);

async function proxyEcho(req, res, next) {
  try {
    const upstream = getUpstream("echo");
    if (!upstream) {
      return res.status(503).json({
        error: "Service Unavailable",
        message: "Echo upstream is not configured",
        requestId: req.requestId,
      });
    }

    await proxyRequest(req, res, {
      baseUrl: upstream.baseUrl,
      timeoutMs: upstream.timeoutMs,
      stripPrefix: "/api/v1/proxy/echo",
    });
  } catch (err) {
    next(err);
  }
}
export default router;
