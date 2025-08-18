export async function retryAsync<T>(
  fn: () => Promise<T>,
  attempts = 3,
  delayMs = 200,
  factor = 2
): Promise<T> {
  const cb = await import('$lib/server/circuitBreaker');
  if (cb.isOpen()) {
    throw new Error('circuit_open');
  }

  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fn();
      cb.recordSuccess();
      return res;
    } catch (err) {
      lastErr = err;
      cb.recordFailure(err);
      if (i < attempts - 1) {
        const wait = delayMs * Math.pow(factor, i);
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  }
  throw lastErr;
}
