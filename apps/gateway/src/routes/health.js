import { Router } from "express";
import { config } from "../config.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: config.serviceName,
    version: config.version,
    timestamp: new Date().toISOString(),
  });
});

router.get("/", (_req, res) => {
  res.json({
    name: "Hermes API Gateway",
    version: config.version,
    message: "Gateway online. Use /api/v1 for versioned routes.",
    endpoints: {
      health: "/health",
      status: "/api/v1/status",
      routes: "/api/v1/routes",
      proxyEcho: "/api/v1/proxy/echo/*",
      webhooks: "/api/v1/webhooks",
    },
  });
});

export default router;
