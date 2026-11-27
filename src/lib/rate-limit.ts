interface RateRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateRecord>();

export function checkRateLimit(
  identifier: string,
  limit: number = 30,
  windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number; reset: number } {
  const now = Date.now();

  if (rateLimitMap.size > 100) {
    rateLimitMap.forEach((value, key) => {
      if (now > value.resetTime) {
        rateLimitMap.delete(key);
      }
    });
  }

  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true, remaining: limit - 1, reset: now + windowMs };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0, reset: record.resetTime };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: limit - record.count,
    reset: record.resetTime,
  };
}
