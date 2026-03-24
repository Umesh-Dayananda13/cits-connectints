import { Router } from 'express'
import {
  deleteCloudinaryAsset,
  signCloudinaryUpload,
} from '../controllers/cloudinaryController.js'
import config from '../config/env.js'
import { createRateLimitMiddleware } from '../lib/rateLimit.js'
import { requireAdminAuth } from '../middleware/requireAdminAuth.js'

// Cloudinary route group.
// Mounted in app.js at /api, producing:
// - POST /api/cloudinary/sign-upload
// - POST /api/cloudinary/delete
const router = Router()
const adminRateLimit = createRateLimitMiddleware({
  keyPrefix: 'admin-cloudinary',
  maxRequests: config.rateLimit.adminMaxRequests,
  message: 'Too many admin media requests. Please try again shortly.',
  windowMs: config.rateLimit.adminWindowMs,
})

router.post('/cloudinary/sign-upload', adminRateLimit, requireAdminAuth, signCloudinaryUpload)
router.post('/cloudinary/delete', adminRateLimit, requireAdminAuth, deleteCloudinaryAsset)

export default router
