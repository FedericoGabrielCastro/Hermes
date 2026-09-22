import { Router } from "express";
import { config } from "../../config.js";
import { listRoutes, getUpstream } from "../../services/routeRegistry.js";
import { proxyRequest } from "../../services/proxy.js";
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
    upstreams: Object.fromEntries(
      Object.entries(config.upstreams).map(([name, upstream]) => [
        name,
        { baseUrl: upstream.baseUrl, timeoutMs: upstream.timeoutMs },
      ]),
    ),
    timestamp: new Date().toISOString(),
  });
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
