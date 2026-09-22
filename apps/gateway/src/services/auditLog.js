import { config } from "../config.js";

const entries = [];

export function recordAudit(entry) {
  entries.unshift({
    ...entry,
    at: entry.at || new Date().toISOString(),
  });
  if (entries.length > config.audit.maxEntries) {
    entries.length = config.audit.maxEntries;
  }
}

export function listAudit({ limit = 50 } = {}) {
  return entries.slice(0, Math.min(limit, config.audit.maxEntries));
}

export function clearAudit() {
  entries.length = 0;
}
