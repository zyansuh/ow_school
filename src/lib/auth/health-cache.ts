/** Discord 외부 API 프로브 결과 단기 캐시 — /api/health 반복 호출 지연 완화 */

type CacheEntry<T> = { value: T; expiresAt: number };

const store = globalThis as typeof globalThis & {
  __owSchoolHealthCache?: Map<string, CacheEntry<unknown>>;
};

function cacheMap() {
  if (!store.__owSchoolHealthCache) store.__owSchoolHealthCache = new Map();
  return store.__owSchoolHealthCache;
}

export async function withTtlCache<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const map = cacheMap();
  const hit = map.get(key) as CacheEntry<T> | undefined;
  if (hit && hit.expiresAt > Date.now()) return hit.value;

  const value = await fn();
  map.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}
