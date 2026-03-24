import express, { Router } from 'express'
import {
  createCheckoutSession,
  getAdminPurchases,
  handleStripeWebhook,
  verifyPayment,
  getUserPurchases,
} from '../controllers/paymentController.js'
import { createRateLimitMiddleware } from '../lib/rateLimit.js'
import { requireAdminAuth } from '../middleware/requireAdminAuth.js'

const router = Router()

// Rate limiting for payment endpoints
const paymentRateLimit = createRateLimitMiddleware({
  keyPrefix: 'payment',
  maxRequests: 20,
  message: 'Too many payment requests. Please try again shortly.',
  windowMs: 60000,
})

// Public endpoints (no auth required for initial checkout)
router.post('/checkout-session', paymentRateLimit, createCheckoutSession)
router.post('/verify-payment', paymentRateLimit, verifyPayment)
router.get('/user-purchases/:userId', paymentRateLimit, getUserPurchases)

// Admin-only reporting endpoint for /admin -> Payments tab.
// Requires Firebase ID token + ADMIN_EMAILS allow-list via requireAdminAuth.
router.get('/admin/purchases', paymentRateLimit, requireAdminAuth, getAdminPurchases)

// Stripe webhook endpoint.
// NOTE: app-level JSON parser is skipped for this path so signature verification
// can use raw request bytes.
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook)

export default router
