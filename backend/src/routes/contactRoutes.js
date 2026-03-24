import { Router } from 'express'
import { submitContact } from '../controllers/contactController.js'
import config from '../config/env.js'
import { createRateLimitMiddleware } from '../lib/rateLimit.js'

// Contact route group mounted in app.js at /api.
// Final endpoint: POST /api/contact
const router = Router()
const contactRateLimit = createRateLimitMiddleware({
  keyPrefix: 'contact',
  maxRequests: config.rateLimit.contactMaxRequests,
  message: 'Too many contact requests. Please wait before trying again.',
  windowMs: config.rateLimit.contactWindowMs,
})

router.post('/contact', contactRateLimit, submitContact)

export default router
