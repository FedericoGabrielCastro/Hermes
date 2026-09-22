import express from "express";
import cors from "cors";
import morgan from "morgan";
import { config } from "./config.js";
import { requestId } from "./middleware/requestId.js";
import { rateLimit } from "./middleware/rateLimit.js";
import { auditMiddleware } from "./middleware/audit.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import healthRoutes from "./routes/health.js";
import v1Routes from "./routes/v1/index.js";
import { bump } from "./services/metrics.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(requestId);
  app.use(cors());
  app.use(auditMiddleware);
  app.use((req, _res, next) => {
    bump("requests");
    next();
  });
  app.use(
    morgan((tokens, req, res) =>
      [
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        `${tokens["response-time"](req, res)} ms`,
        `rid=${req.requestId || "-"}`,
      ].join(" "),
    ),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(rateLimit(config.rateLimit));

  app.use(healthRoutes);
  app.use("/api/v1", v1Routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
