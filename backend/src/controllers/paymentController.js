import Stripe from 'stripe'
import config from '../config/env.js'
import {
  listFirestoreDocuments,
  runFirestoreCollectionGroupQuery,
  setFirestoreDocument,
} from '../lib/firestoreRest.js'
import { getFirestoreAccessToken } from '../lib/googleAccessToken.js'

// Shared Stripe SDK client for all payment handlers in this controller.
const stripe = config.stripe.secretKey ? new Stripe(config.stripe.secretKey) : null

const getRequestIdToken = (req) => (
  req?.headers?.authorization?.replace(/^Bearer\s+/i, '') || ''
)

function ensureStripeConfigured(res) {
  if (stripe) return true

  res.status(500).json({
    ok: false,
    error: 'Stripe secret key is not configured on the backend.',
  })
  return false
}

// Normalizes Stripe session payload into the same shape returned by Firestore
// purchase documents so the admin UI can render from either source.
const mapStripeSessionToPurchase = (session) => {
  const purchasedAtIso = session?.created
    ? new Date(session.created * 1000).toISOString()
    : new Date().toISOString()
  const normalizedCurrency = String(session?.currency || 'usd').toUpperCase()
  const amountTotal = Number(session?.amount_total)

  return {
    amount: Number.isFinite(amountTotal) ? amountTotal / 100 : 0,
    courseId: session?.metadata?.courseId || '',
    courseTitle: session?.metadata?.courseTitle || 'CITS Course',
    currency: normalizedCurrency,
    paymentStatus: session?.payment_status || 'unknown',
    purchasedAtIso,
    source: 'stripe',
    stripeSessionId: session?.id || '',
    userEmail: session?.customer_details?.email || session?.customer_email || '',
    userId: session?.metadata?.userId || session?.customer_details?.email || session?.customer_email || '',
  }
}

// Fallback source for admin payments when Firestore cannot be queried (for
// example: missing index or rules mismatch). Keeps admin reporting functional.
async function listAdminPurchasesFromStripe(limit) {
  const sessionList = await stripe.checkout.sessions.list({
    limit,
  })

  return (sessionList.data || [])
    .filter((session) => session?.mode === 'payment')
    .filter((session) => session?.payment_status === 'paid')
    .map((session) => mapStripeSessionToPurchase(session))
}

const buildPurchaseRecord = ({ session, sessionId, userId, courseId }) => ({
  amount: Number(session.amount_total || 0) / 100, // Convert from cents
  courseId,
  courseTitle: session.metadata?.courseTitle || 'CITS Course',
  currency: session.currency.toUpperCase(),
  paymentStatus: 'completed',
  purchasedAtIso: new Date().toISOString(),
  stripeSessionId: sessionId,
  userEmail: session.customer_email || session.customer_details?.email || '',
  userId,
})

async function writePurchaseRecord({ courseId, purchaseRecord, req, userId }) {
  const idToken = getRequestIdToken(req)
  const authOptions = idToken
    ? { idToken }
    : { accessToken: await getFirestoreAccessToken() }

  const userPurchasePath = `users/${userId}/purchases/${courseId}`
  await setFirestoreDocument({
    ...authOptions,
    data: purchaseRecord,
    documentPath: userPurchasePath,
  })
}

// Create checkout session for course purchase
export async function createCheckoutSession(req, res) {
  try {
    if (!ensureStripeConfigured(res)) return

    const { courseId, courseTitle, courseFee, userEmail, userId } = req.body

    if (!courseId || !courseFee || !userEmail) {
      return res.status(400).json({
        ok: false,
        error: 'courseId, courseFee, and userEmail are required.',
      })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: courseTitle || 'CITS Course',
              description: `Complete access to ${courseTitle}`,
            },
            // courseFee arrives in dollars from frontend; Stripe expects cents.
            unit_amount: Math.round(courseFee * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/home?payment=success&sessionId={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/home?payment=cancelled`,
      customer_email: userEmail,
      metadata: {
        // Metadata lets verifyPayment work even if the frontend sends only sessionId.
        courseId,
        userId: userId || userEmail,
        courseTitle,
      },
    })

    res.json({
      ok: true,
      data: {
        sessionId: session.id,
        clientSecret: session.client_secret,
      },
    })
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message || 'Failed to create checkout session.',
    })
  }
}

// Verify payment and record purchase
export async function verifyPayment(req, res) {
  try {
    if (!ensureStripeConfigured(res)) return

    const { sessionId, userId, courseId } = req.body

    if (!sessionId) {
      return res.status(400).json({
        ok: false,
        error: 'sessionId is required.',
      })
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        ok: false,
        error: 'Payment not completed.',
      })
    }

    // Request values win. Metadata is fallback. Customer email is last-resort fallback.
    const resolvedUserId = userId || session.metadata?.userId || session.customer_email
    const resolvedCourseId = courseId || session.metadata?.courseId

    if (!resolvedUserId || !resolvedCourseId) {
      return res.status(400).json({
        ok: false,
        error: 'Could not resolve purchase userId or courseId from request/session.',
      })
    }

    const purchaseRecord = buildPurchaseRecord({
      courseId: resolvedCourseId,
      session,
      sessionId,
      userId: resolvedUserId,
    })

    // Save to user-scoped Firestore path: users/{userId}/purchases/{courseId}.
    await writePurchaseRecord({
      courseId: resolvedCourseId,
      purchaseRecord,
      req,
      userId: resolvedUserId,
    })

    res.json({
      ok: true,
      data: {
        message: 'Payment verified and recorded successfully.',
        purchase: purchaseRecord,
      },
    })
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message || 'Failed to verify payment.',
    })
  }
}

// Get user purchases
export async function getUserPurchases(req, res) {
  try {
    if (!config.isFirebaseConfigured) {
      return res.status(500).json({
        ok: false,
        error: config.firebaseConfigIssue || 'Firebase backend config is missing.',
      })
    }

    const { userId } = req.params
    const idToken = getRequestIdToken(req)

    if (!userId) {
      return res.status(400).json({
        ok: false,
        error: 'userId is required.',
      })
    }

    if (!idToken) {
      return res.status(401).json({
        ok: false,
        error: 'Missing user authorization token.',
      })
    }

    const purchasesPath = `users/${userId}/purchases`
    const purchases = await listFirestoreDocuments({
      collectionPath: purchasesPath,
      idToken,
    })
    // Keep frontend lookup O(1) by returning an object keyed by courseId.
    const purchasesByCourseId = purchases.reduce((result, purchase) => {
      if (!purchase?.id) return result

      result[purchase.id] = purchase
      return result
    }, {})

    res.json({
      ok: true,
      data: purchasesByCourseId,
    })
  } catch (error) {
    console.error('User purchases read failed', error)
    res.status(500).json({
      ok: false,
      error: error.message || 'Failed to fetch purchases.',
    })
  }
}

// Admin-only: list recent payments across all users.
export async function getAdminPurchases(req, res) {
  try {
    if (!ensureStripeConfigured(res)) return

    const requestedLimit = Number(req.query.limit || 100)
    const safeLimit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(Math.floor(requestedLimit), 1), 500)
      : 100

    // Try service-account query first so admin reporting works regardless of
    // Firestore end-user rules. Fall back to admin token if service account
    // credentials are not configured yet.
    let firestoreAuth = { idToken: req.adminAuth.idToken }
    try {
      const accessToken = await getFirestoreAccessToken()
      firestoreAuth = { accessToken }
    } catch {
      firestoreAuth = { idToken: req.adminAuth.idToken }
    }

    // Primary source for admin reporting: Firestore collection-group query.
    let purchases = []
    try {
      purchases = await runFirestoreCollectionGroupQuery({
        collectionId: 'purchases',
        ...firestoreAuth,
        limit: safeLimit,
        orderByField: 'purchasedAtIso',
        orderDirection: 'DESCENDING',
      })
    } catch (error) {
      const errorMessage = String(error?.message || '').toLowerCase()
      const mightNeedIndex = errorMessage.includes('index')

      // Firestore collection-group ordering can require a composite index.
      // If missing, retry without orderBy and sort locally.
      if (mightNeedIndex) {
        try {
          purchases = await runFirestoreCollectionGroupQuery({
            collectionId: 'purchases',
            ...firestoreAuth,
            limit: 500,
            orderByField: '',
          })
        } catch {
          purchases = []
        }
      } else {
        purchases = []
      }
    }

    // If Firestore returns nothing or fails, fall back to Stripe sessions so
    // admins still see paid-user information.
    if (purchases.length === 0) {
      purchases = await listAdminPurchasesFromStripe(safeLimit)
    }

    const sortedPurchases = purchases
      .slice()
      .sort((a, b) => {
        const aTime = new Date(a?.purchasedAtIso || 0).getTime()
        const bTime = new Date(b?.purchasedAtIso || 0).getTime()
        const safeATime = Number.isFinite(aTime) ? aTime : 0
        const safeBTime = Number.isFinite(bTime) ? bTime : 0

        return safeBTime - safeATime
      })
      .slice(0, safeLimit)

    res.json({
      ok: true,
      data: sortedPurchases,
    })
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message || 'Failed to fetch admin purchases.',
    })
  }
}

// Webhook to handle Stripe events
export async function handleStripeWebhook(req, res) {
  if (!stripe) {
    res.status(500).send('Stripe secret key is not configured on the backend.')
    return
  }

  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.stripe.webhookSecret
    )
  } catch (error) {
    res.status(400).send(`Webhook signature verification failed: ${error.message}`)
    return
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const resolvedUserId = session.metadata?.userId || session.customer_email || session.customer_details?.email
        const resolvedCourseId = session.metadata?.courseId

        if (!resolvedUserId || !resolvedCourseId) {
          console.warn('Webhook skipped due to missing userId/courseId metadata.', {
            sessionId: session.id,
          })
          break
        }

        const purchaseRecord = buildPurchaseRecord({
          courseId: resolvedCourseId,
          session,
          sessionId: session.id,
          userId: resolvedUserId,
        })
        await writePurchaseRecord({
          courseId: resolvedCourseId,
          purchaseRecord,
          req,
          userId: resolvedUserId,
        })
        console.log('Payment completed and recorded via webhook:', session.id)
        break
      }
      case 'charge.refunded': {
        const charge = event.data.object
        console.log('Payment refunded:', charge.id)
        // Handle refunds and remove course access if needed
        break
      }
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    res.json({ received: true })
  } catch (error) {
    res.status(500).send(`Webhook processing failed: ${error.message}`)
  }
}
