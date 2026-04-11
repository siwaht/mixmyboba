/**
 * Simple in-memory rate limiter for API routes.
 * Not suitable for multi-instance deployments — use Redis-backed
 * rate limiting in production with multiple servers.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 5 * 60 * 1000)

export function rateLimit(
  key: string,
  { limit = 10, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {}
): { success: boolean; remaining: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: limit - 1 }
  }

  entry.count++
  if (entry.count > limit) {
    return { success: false, remaining: 0 }
  }

  return { success: true, remaining: limit - entry.count }
}

/**
 * Combined IP + user rate limit. Checks both keys and fails if either
 * is exceeded. Use this for authenticated endpoints where you want to
 * prevent both IP-based flooding and per-account abuse.
 */
export function rateLimitCombo(
  ip: string,
  userId: string | null,
  prefix: string,
  opts: { ipLimit?: number; userLimit?: number; windowMs?: number } = {}
): { success: boolean } {
  const { ipLimit = 10, userLimit = 20, windowMs = 60_000 } = opts

  const ipCheck = rateLimit(`${prefix}:ip:${ip}`, { limit: ipLimit, windowMs })
  if (!ipCheck.success) return { success: false }

  if (userId) {
    const userCheck = rateLimit(`${prefix}:user:${userId}`, { limit: userLimit, windowMs })
    if (!userCheck.success) return { success: false }
  }

  return { success: true }
}
