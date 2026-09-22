import { createApp } from "./app.js";
import { config } from "./config.js";
import { initStore } from "./services/webhookStore.js";

initStore();

const app = createApp();

app.listen(config.port, () => {
  console.log(
    `Hermes gateway listening on http://localhost:${config.port} (v${config.version})`,
  );
  console.log(`[gateway] data dir: ${config.dataDir}`);
});
