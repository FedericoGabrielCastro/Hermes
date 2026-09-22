import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { config } from "../config.js";

function storePath() {
  return path.join(config.dataDir, "webhooks.json");
}

export function ensureDataDir() {
  mkdirSync(config.dataDir, { recursive: true });
}

export function loadPersistedState() {
  ensureDataDir();
  const file = storePath();
  if (!existsSync(file)) {
    return { subscriptions: [], events: [], deadLetters: [] };
  }

  try {
    const raw = readFileSync(file, "utf8");
    const parsed = JSON.parse(raw);
    return {
      subscriptions: Array.isArray(parsed.subscriptions) ? parsed.subscriptions : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
      deadLetters: Array.isArray(parsed.deadLetters) ? parsed.deadLetters : [],
    };
  } catch (err) {
    console.error("[gateway] failed to load persisted webhook state:", err.message);
    return { subscriptions: [], events: [], deadLetters: [] };
  }
}

export function persistState({ subscriptions, events, deadLetters }) {
  ensureDataDir();
  const payload = {
    version: 2,
    updatedAt: new Date().toISOString(),
    subscriptions,
    events,
    deadLetters,
  };
  writeFileSync(storePath(), JSON.stringify(payload, null, 2), "utf8");
}
