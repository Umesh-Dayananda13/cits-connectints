const buckets = new Map()

const pruneExpiredEntries = (nowMs) => {
  for (const [key, entry] of buckets.entries()) {
    if (entry.resetAtMs <= nowMs) {
      buckets.delete(key)
    }
  }
}

export function createRateLimitMiddleware({
  keyPrefix,
  maxRequests,
  message,
  windowMs,
}) {
  return (req, res, next) => {
    const nowMs = Date.now()
    const key = `${keyPrefix}:${req.ip || 'unknown'}`

    pruneExpiredEntries(nowMs)

    const currentEntry = buckets.get(key)
    if (!currentEntry || currentEntry.resetAtMs <= nowMs) {
      buckets.set(key, {
        count: 1,
        resetAtMs: nowMs + windowMs,
      })
      next()
      return
    }

    currentEntry.count += 1
    buckets.set(key, currentEntry)

    if (currentEntry.count > maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((currentEntry.resetAtMs - nowMs) / 1000))
      res.setHeader('Retry-After', String(retryAfterSeconds))
      res.status(429).json({
        ok: false,
        error: message,
      })
      return
    }

    next()
  }
}
