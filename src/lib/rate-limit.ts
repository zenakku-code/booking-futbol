const ipCache = new Map<string, { count: number, lastReset: number }>();

/**
 * Basic in-memory rate limiter for serverless functions.
 * Note: In a distributed environment (Vercel), this cache is per-instance,
 * so it's not a strict global limit but effective against single-source spam attacks.
 */
export function rateLimit(ip: string, limit: number = 10, windowMs: number = 60000): boolean {
    // Cleanup old entries periodically (lazy cleanup mechanism could be added here)
    if (ipCache.size > 10000) ipCache.clear(); // Safety valve to prevent memory leaks

    const now = Date.now();
    const record = ipCache.get(ip) || { count: 0, lastReset: now };

    if (now - record.lastReset > windowMs) {
        record.count = 0;
        record.lastReset = now;
    }

    record.count++;
    ipCache.set(ip, record);

    return record.count <= limit;
}
