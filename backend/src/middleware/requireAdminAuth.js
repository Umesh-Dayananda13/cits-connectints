import config from '../config/env.js'
import {
  isAllowedAdminEmail,
  parseBearerToken,
  verifyFirebaseIdToken,
} from '../lib/firebaseAuth.js'

export async function requireAdminAuth(req, res, next) {
  if (!config.adminEmails.length) {
    res.status(500).json({
      ok: false,
      error: 'ADMIN_EMAILS is not configured on the backend.',
    })
    return
  }

  try {
    const idToken = parseBearerToken(req.headers.authorization)
    const tokenPayload = await verifyFirebaseIdToken(idToken)
    const email = tokenPayload.email?.trim().toLowerCase()

    if (!email || !isAllowedAdminEmail(email)) {
      res.status(403).json({
        ok: false,
        error: 'Admin access denied.',
      })
      return
    }

    req.adminAuth = {
      email,
      idToken,
      tokenPayload,
      uid: tokenPayload.user_id || tokenPayload.sub,
    }

    next()
  } catch (error) {
    res.status(error.statusCode || 401).json({
      ok: false,
      error: error.message || 'Admin authorization failed.',
    })
  }
}
