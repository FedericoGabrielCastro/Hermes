const startedAt = Date.now();

const counters = {
  requests: 0,
  ingestAccepted: 0,
  deliveriesOk: 0,
  deliveriesFailed: 0,
  retriesScheduled: 0,
  subscriptionsCreated: 0,
  subscriptionsUpdated: 0,
  subscriptionsDeleted: 0,
  deadLetters: 0,
};

export function bump(name, by = 1) {
  if (counters[name] !== undefined) counters[name] += by;
}

export function getMetrics() {
  return {
    service: "hermes-gateway",
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    counters: { ...counters },
    timestamp: new Date().toISOString(),
  };
}
