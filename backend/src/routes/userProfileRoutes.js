import { Router } from 'express'
import { createRateLimitMiddleware } from '../lib/rateLimit.js'
import config from '../config/env.js'
import { getAdminUsers, saveUserProfile } from '../controllers/userProfileController.js'
import { requireAdminAuth } from '../middleware/requireAdminAuth.js'
import { requireUserAuth } from '../middleware/requireUserAuth.js'

const router = Router()
// Member-facing profile write endpoint.
// Keeps abuse limits separate from admin reporting limits for safer scaling.
const profileRateLimit = createRateLimitMiddleware({
  keyPrefix: 'user-profile',
  maxRequests: 30,
  message: 'Too many profile requests. Please try again shortly.',
  windowMs: 60000,
})
// Admin user-list endpoint uses same configurable admin throttles as other admin APIs.
const adminUsersRateLimit = createRateLimitMiddleware({
  keyPrefix: 'admin-users',
  maxRequests: config.rateLimit.adminMaxRequests,
  message: 'Too many admin user requests. Please try again shortly.',
  windowMs: config.rateLimit.adminWindowMs,
})

// Saves signed-in user profile (name/email/phone) at users/{uid}.
router.post('/user-profile', profileRateLimit, requireUserAuth, saveUserProfile)
// Admin-only view for the Users tab in frontend AdminPanel.
router.get('/admin/users', adminUsersRateLimit, requireAdminAuth, getAdminUsers)

export default router
