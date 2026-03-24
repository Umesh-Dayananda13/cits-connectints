import {
  parseBearerToken,
  verifyFirebaseIdToken,
} from '../lib/firebaseAuth.js'

// Verifies Firebase user token for non-admin authenticated user endpoints.
// Current use: protects POST /api/user-profile.
// Future production change: attach role/claims mapping here if user-level roles are introduced.
export async function requireUserAuth(req, res, next) {
  try {
    const idToken = parseBearerToken(req.headers.authorization)
    const tokenPayload = await verifyFirebaseIdToken(idToken)
    const email = tokenPayload.email?.trim().toLowerCase() || ''
    const uid = tokenPayload.user_id || tokenPayload.sub || ''

    if (!uid) {
      res.status(401).json({
        ok: false,
        error: 'User authorization failed.',
      })
      return
    }

    req.userAuth = {
      email,
      idToken,
      tokenPayload,
      uid,
    }

    next()
  } catch (error) {
    res.status(error.statusCode || 401).json({
      ok: false,
      error: error.message || 'User authorization failed.',
    })
  }
}
