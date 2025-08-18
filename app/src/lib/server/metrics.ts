type Metrics = {
  runs: number;
  lastRunAt: string | null;
  lastProcessed: number;
  totalProcessed: number;
  failures: number;
  lastFailureAt: string | null;
  lastFailureError?: string | null;
};

const metrics: Metrics = {
  runs: 0,
  lastRunAt: null,
  lastProcessed: 0,
  totalProcessed: 0,
  failures: 0,
  lastFailureAt: null,
  lastFailureError: null
};

export function recordRun(processed: number) {
  metrics.runs += 1;
  metrics.lastRunAt = new Date().toISOString();
  metrics.lastProcessed = processed;
  metrics.totalProcessed += processed;
}

export function recordFailure(err: unknown) {
  metrics.failures += 1;
  metrics.lastFailureAt = new Date().toISOString();
  metrics.lastFailureError = String(err);
}

export function getMetrics() {
  return { ...metrics } as Metrics;
}
