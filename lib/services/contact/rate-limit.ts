interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const ipMap = new Map<string, RateLimitEntry>();
const userMap = new Map<string, RateLimitEntry>();

const IP_LIMIT = 3;
const IP_WINDOW_MS = 10 * 60 * 1000; // 10분

const USER_LIMIT = 5;
const USER_WINDOW_MS = 60 * 60 * 1000; // 1시간

const MAX_MAP_SIZE = 1000;

function cleanup(map: Map<string, RateLimitEntry>) {
  if (map.size <= MAX_MAP_SIZE) return;
  const now = Date.now();
  for (const [key, entry] of map) {
    if (entry.resetAt <= now) map.delete(key);
  }
}

function check(
  map: Map<string, RateLimitEntry>,
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } {
  cleanup(map);
  const now = Date.now();
  const entry = map.get(key);

  if (!entry || entry.resetAt <= now) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.count >= limit) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  entry.count++;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function checkRateLimit(ip: string, userId?: string): {
  allowed: boolean;
  retryAfterSeconds: number;
} {
  const ipResult = check(ipMap, ip, IP_LIMIT, IP_WINDOW_MS);
  if (!ipResult.allowed) return ipResult;

  if (userId) {
    const userResult = check(userMap, userId, USER_LIMIT, USER_WINDOW_MS);
    if (!userResult.allowed) return userResult;
  }

  return { allowed: true, retryAfterSeconds: 0 };
}
