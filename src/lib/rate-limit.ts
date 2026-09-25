// In-memory sliding window rate limiter
interface RateLimitRecord {
  timestamps: number[];
}

const cache = new Map<string, RateLimitRecord>();

// Clean up old entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of cache.entries()) {
      record.timestamps = record.timestamps.filter((t) => now - t < 60000);
      if (record.timestamps.length === 0) {
        cache.delete(key);
      }
    }
  }, 300000);
}

export function checkRateLimit(
  identifier: string,
  limit: number = 30, // 30 requests
  windowMs: number = 60000 // per 1 minute
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const record = cache.get(identifier) || { timestamps: [] };

  // Remove timestamps outside window
  record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

  if (record.timestamps.length >= limit) {
    const oldestTimestamp = record.timestamps[0];
    const resetMs = windowMs - (now - oldestTimestamp);
    return { allowed: false, remaining: 0, resetMs: Math.max(0, resetMs) };
  }

  record.timestamps.push(now);
  cache.set(identifier, record);

  return {
    allowed: true,
    remaining: limit - record.timestamps.length,
    resetMs: windowMs,
  };
}
