import { loadStripe } from '@stripe/stripe-js'
import { auth } from '../firebase'

// Keep localhost fallback only for local development.
// In deployed environments, VITE_API_BASE_URL should point to the hosted backend.
const localApiBaseUrl = 'http://localhost:5000'
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? localApiBaseUrl : '')
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

let stripePromise = null

// Adds Firebase ID token when available so backend can authorize
// payment verification and admin/payment reads.
async function getAuthHeaders(headers = {}) {
  if (!auth?.currentUser) {
    return headers
  }

  const idToken = await auth.currentUser.getIdToken()
  return {
    ...headers,
    Authorization: `Bearer ${idToken}`,
  }
}

export const getStripe = async () => {
  // Singleton Stripe loader avoids re-initializing Stripe on every call.
  if (!stripePublishableKey) {
    throw new Error('Stripe publishable key is not configured.')
  }

  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey)
  }

  return stripePromise
}

export async function createCheckoutSession(courseData) {
  try {
    // Token is optional for checkout creation, but included when available.
    const headers = await getAuthHeaders({
      'Content-Type': 'application/json',
    })

    const response = await fetch(`${apiBaseUrl}/api/checkout-session`, {
      method: 'POST',
      headers,
      body: JSON.stringify(courseData),
    })
    const payload = await response.json().catch(() => ({}))

    if (!response.ok || payload?.ok === false) {
      throw new Error(payload?.error || 'Failed to create checkout session')
    }

    const { data } = payload
    return data.sessionId
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw error
  }
}

export async function redirectToCheckout(sessionId) {
  try {
    // Browser redirect controlled by Stripe.js.
    const stripe = await getStripe()
    const { error } = await stripe.redirectToCheckout({ sessionId })

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error redirecting to checkout:', error)
    throw error
  }
}

export async function verifyPayment({ sessionId, userId, courseId }) {
  try {
    // Backend can resolve missing identifiers from Stripe metadata;
    // we still send userId/courseId when known for deterministic writes.
    const headers = await getAuthHeaders({
      'Content-Type': 'application/json',
    })
    const body = { sessionId }

    if (userId) body.userId = userId
    if (courseId) body.courseId = courseId

    const response = await fetch(`${apiBaseUrl}/api/verify-payment`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
    const payload = await response.json().catch(() => ({}))

    if (!response.ok || payload?.ok === false) {
      throw new Error(payload?.error || 'Failed to verify payment')
    }

    return payload
  } catch (error) {
    console.error('Error verifying payment:', error)
    throw error
  }
}

export async function getUserPurchases(userId, { silent = false } = {}) {
  try {
    // Returns map keyed by courseId.
    const headers = await getAuthHeaders({
      'Content-Type': 'application/json',
    })

    const response = await fetch(`${apiBaseUrl}/api/user-purchases/${userId}`, {
      method: 'GET',
      headers,
    })
    const payload = await response.json().catch(() => ({}))

    if (!response.ok || payload?.ok === false) {
      throw new Error(payload?.error || 'Failed to fetch purchases')
    }

    const { data } = payload
    return data
  } catch (error) {
    if (!silent) {
      console.error('Error fetching user purchases:', error)
    }
    return {}
  }
}

export async function getAdminPurchases({ limit = 100 } = {}) {
  try {
    // Admin-only endpoint backing the /admin Payments tab.
    const headers = await getAuthHeaders({
      'Content-Type': 'application/json',
    })

    const query = new URLSearchParams({
      limit: String(limit),
    })

    const response = await fetch(`${apiBaseUrl}/api/admin/purchases?${query.toString()}`, {
      method: 'GET',
      headers,
    })
    const payload = await response.json().catch(() => ({}))

    if (!response.ok || payload?.ok === false) {
      throw new Error(payload?.error || 'Failed to fetch admin purchases')
    }

    const { data } = payload
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error fetching admin purchases:', error)
    throw error
  }
}
