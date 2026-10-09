import { createHash } from 'node:crypto';

// Bounded, single-process limiter. Multi-instance hosting must share this state at the gateway.
export function rateLimit({ limit, windowMs, key = (req) => req.ip, now = Date.now, maxKeys = 10000 }) {
  const buckets = new Map();
  return (req, res, next) => {
    const time = now();
    for (const [name, bucket] of buckets) if (bucket.until <= time) buckets.delete(name);
    const name = createHash('sha256').update(String(key(req))).digest('hex');
    if (!buckets.has(name)) {
      if (buckets.size >= maxKeys) return res.status(503).json({ error: 'Authentication is busy. Please try again shortly.' });
      buckets.set(name, { count: 0, until: time + windowMs });
    }
    const bucket = buckets.get(name);
    if (++bucket.count > limit) {
      res.set('Retry-After', String(Math.ceil((bucket.until - time) / 1000)));
      return res.status(429).json({ error: 'Too many attempts. Please wait before trying again.' });
    }
    next();
  };
}
