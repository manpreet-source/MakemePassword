interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

/** Default time-to-live for a cached GA4 report response. */
export const REPORT_CACHE_TTL_MS = 2 * 60 * 1000;

/**
 * A process-local cache so repeated dashboard refreshes within the TTL don't
 * re-query the Google Analytics Data API. Resets on cold start in serverless
 * deployments; that's an acceptable tradeoff for a low-traffic admin panel.
 */
export async function withReportCache<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<{ value: T; cached: boolean }> {
  const existing = store.get(key);
  if (existing && existing.expiresAt > Date.now()) {
    return { value: existing.value as T, cached: true };
  }
  const value = await load();
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  return { value, cached: false };
}

export function clearReportCache(): void {
  store.clear();
}
