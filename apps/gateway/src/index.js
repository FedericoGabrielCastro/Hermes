import express from "express";
import cors from "cors";
import morgan from "morgan";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "hermes-gateway",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (_req, res) => {
  res.json({
    name: "Hermes API Gateway",
    message: "Gateway online. Webhook and routing layers coming next.",
    docs: "/health",
  });
});

app.listen(PORT, () => {
  console.log(`Hermes gateway listening on http://localhost:${PORT}`);
});
