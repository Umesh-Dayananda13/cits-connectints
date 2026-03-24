import { Router } from 'express'
import {
  getSiteContent,
  saveSiteContent,
} from '../controllers/siteContentController.js'
import { requireAdminAuth } from '../middleware/requireAdminAuth.js'
import { createRateLimitMiddleware } from '../lib/rateLimit.js'
import config from '../config/env.js'

const router = Router()
const adminRateLimit = createRateLimitMiddleware({
  keyPrefix: 'admin-site-content',
  maxRequests: config.rateLimit.adminMaxRequests,
  message: 'Too many admin content requests. Please try again shortly.',
  windowMs: config.rateLimit.adminWindowMs,
})

router.get('/site-content', adminRateLimit, requireAdminAuth, getSiteContent)
router.put('/site-content', adminRateLimit, requireAdminAuth, saveSiteContent)

export default router
