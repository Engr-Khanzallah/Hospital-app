/**
 * Minimal in-memory rate limiter (no external dependency, free).
 *
 * LIMITATION: counters live in the memory of one server instance. On a serverless host such as
 * Vercel each warm instance keeps its own counters, so this is a best-effort brake against
 * abuse and accidental quota burn, not a hard global guarantee.
 */
export const createRateLimiter = ({
  name = 'default',
  windowMs,
  max,
  keyGenerator = (req) => req.ip || req.socket?.remoteAddress || 'unknown',
  message = 'Too many requests. Please try again later.'
}) => {
  const hits = new Map() // key -> { count, resetAt }

  const sweep = () => {
    const now = Date.now()
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key)
  }
  const timer = setInterval(sweep, Math.max(windowMs, 60_000))
  timer.unref?.()

  const middleware = (req, res, next) => {
    const now = Date.now()
    const key = `${name}:${keyGenerator(req)}`
    let entry = hits.get(key)
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs }
      hits.set(key, entry)
    }
    entry.count += 1

    const remaining = Math.max(0, max - entry.count)
    res.setHeader('RateLimit-Limit', String(max))
    res.setHeader('RateLimit-Remaining', String(remaining))
    res.setHeader('RateLimit-Reset', String(Math.ceil((entry.resetAt - now) / 1000)))

    if (entry.count > max) {
      const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000))
      res.setHeader('Retry-After', String(retryAfter))
      return res.status(429).json({ success: false, message, retryAfterSeconds: retryAfter })
    }
    next()
  }

  middleware.reset = () => hits.clear() // used by tests
  return middleware
}

const envInt = (name, fallback) => {
  const n = parseInt(process.env[name], 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

// Limiters are created lazily so env overrides are read at startup, not at import time of tests.
export const buildLimiters = () => ({
  login: createRateLimiter({
    name: 'login', windowMs: 15 * 60_000, max: envInt('RATE_LOGIN_MAX', 20),
    message: 'Too many login attempts. Please wait a few minutes and try again.'
  }),
  register: createRateLimiter({
    name: 'register', windowMs: 60 * 60_000, max: envInt('RATE_REGISTER_MAX', 10),
    message: 'Too many sign-up attempts from this network. Please try again later.'
  }),
  contact: createRateLimiter({
    name: 'contact', windowMs: 60 * 60_000, max: envInt('RATE_CONTACT_MAX', 8),
    message: 'Too many messages sent. Please try again later.'
  }),
  booking: createRateLimiter({
    name: 'booking', windowMs: 60 * 60_000, max: envInt('RATE_BOOKING_MAX', 30),
    keyGenerator: (req) => req.user?._id?.toString() || req.ip,
    message: 'Too many booking attempts. Please try again later.'
  }),
  aiPerUserMinute: createRateLimiter({
    name: 'ai-user-min', windowMs: 60_000, max: envInt('AI_USER_RPM', 6),
    keyGenerator: (req) => req.user?._id?.toString() || req.ip,
    message: 'You are sending messages too quickly. Please wait a moment.'
  }),
  aiPerUserDay: createRateLimiter({
    name: 'ai-user-day', windowMs: 24 * 60 * 60_000, max: envInt('AI_USER_DAILY', 60),
    keyGenerator: (req) => req.user?._id?.toString() || req.ip,
    message: 'You have reached today\'s limit for the AI assistant. Please try again tomorrow.'
  }),
  aiGlobalMinute: createRateLimiter({
    name: 'ai-global-min', windowMs: 60_000, max: envInt('AI_GLOBAL_RPM', 12),
    keyGenerator: () => 'all',
    message: 'The AI assistant is busy right now. Please try again in a minute.'
  })
})
