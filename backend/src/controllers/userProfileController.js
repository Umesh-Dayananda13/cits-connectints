import {
  getFirestoreDocument,
  listFirestoreDocuments,
  setFirestoreDocument,
} from '../lib/firestoreRest.js'
import { getFirestoreAccessToken } from '../lib/googleAccessToken.js'

// Profile validation baseline for user records shown in admin.
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Keep formatting predictable before storing phone values.
const normalizePhone = (value) => value.trim().replace(/\s+/g, ' ')
const getPhoneDigitsCount = (value) => (value.match(/\d/g) || []).length

// Builds Firestore auth strategies in priority order.
// Current write/read path prefers request ID token, but can fall back to server access token.
// Future production change: switch to server token only if browser-token access is retired.
async function buildFirestoreAuthCandidates(idToken, { preferAccessToken = false } = {}) {
  const candidates = [{ idToken }]

  try {
    const accessToken = await getFirestoreAccessToken()
    if (preferAccessToken) {
      return [{ accessToken }, ...candidates]
    }

    return [...candidates, { accessToken }]
  } catch {
    return candidates
  }
}

// Executes a Firestore operation against multiple auth strategies until one succeeds.
// This keeps admin/user profile endpoints resilient across environments with different credentials.
async function tryWithFirestoreAuth(authCandidates, handler) {
  let lastError = null

  for (const authOptions of authCandidates) {
    try {
      return await handler(authOptions)
    } catch (error) {
      lastError = error
    }
  }

  throw lastError || new Error('Firestore request failed.')
}

const toSafeTimestamp = (value) => {
  const parsed = new Date(value || 0).getTime()
  return Number.isFinite(parsed) ? parsed : 0
}

// POST /api/user-profile
// Persists signup profile data into users/{uid} so admin can view registered users.
export async function saveUserProfile(req, res) {
  try {
    const inputName = String(req.body?.name || '').trim()
    const inputEmail = String(req.body?.email || '').trim().toLowerCase()
    const inputPhone = normalizePhone(String(req.body?.phone || ''))

    if (!inputName || !inputPhone) {
      res.status(400).json({
        ok: false,
        error: 'name and phone are required.',
      })
      return
    }

    if (getPhoneDigitsCount(inputPhone) < 7) {
      res.status(400).json({
        ok: false,
        error: 'Enter a valid phone number.',
      })
      return
    }

    const tokenEmail = String(req.userAuth?.email || '').trim().toLowerCase()
    const resolvedEmail = tokenEmail || inputEmail

    if (!resolvedEmail || !emailPattern.test(resolvedEmail)) {
      res.status(400).json({
        ok: false,
        error: 'Enter a valid email address.',
      })
      return
    }

    if (inputEmail && tokenEmail && inputEmail !== tokenEmail) {
      res.status(403).json({
        ok: false,
        error: 'Profile email does not match your signed-in account.',
      })
      return
    }

    const userId = req.userAuth.uid
    const nowIso = new Date().toISOString()
    const profileDocumentPath = `users/${userId}`
    const authCandidates = await buildFirestoreAuthCandidates(req.userAuth.idToken)

    // If this is an existing user, preserve original created timestamp.
    const existingProfile = await tryWithFirestoreAuth(authCandidates, (authOptions) => (
      getFirestoreDocument({
        ...authOptions,
        documentPath: profileDocumentPath,
      })
    )).catch(() => null)

    const profileRecord = {
      email: resolvedEmail,
      name: inputName,
      phone: inputPhone,
      profileCreatedAtIso: existingProfile?.profileCreatedAtIso || nowIso,
      profileUpdatedAtIso: nowIso,
      userId,
    }

    // PATCH write updates only passed fields and keeps the profile doc lightweight.
    await tryWithFirestoreAuth(authCandidates, (authOptions) => (
      setFirestoreDocument({
        ...authOptions,
        data: profileRecord,
        documentPath: profileDocumentPath,
      })
    ))

    res.status(201).json({
      ok: true,
      data: profileRecord,
    })
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error?.message || 'Failed to save user profile.',
    })
  }
}

// GET /api/admin/users
// Returns compact profile records used by frontend admin Users tab.
export async function getAdminUsers(req, res) {
  try {
    const requestedLimit = Number(req.query.limit || 200)
    const safeLimit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(Math.floor(requestedLimit), 1), 1000)
      : 200

    const authCandidates = await buildFirestoreAuthCandidates(req.adminAuth.idToken, {
      preferAccessToken: true,
    })

    // Top-level users collection stores one profile doc per uid.
    const users = await tryWithFirestoreAuth(authCandidates, (authOptions) => (
      listFirestoreDocuments({
        ...authOptions,
        collectionPath: 'users',
      })
    ))

    // Normalize for frontend table rendering and sort newest updates first.
    const normalizedUsers = users
      .map((userDocument) => ({
        email: userDocument?.email || '',
        id: userDocument?.id || '',
        name: userDocument?.name || '',
        phone: userDocument?.phone || '',
        profileCreatedAtIso: userDocument?.profileCreatedAtIso || userDocument?.createdAtIso || '',
        profileUpdatedAtIso: userDocument?.profileUpdatedAtIso || userDocument?.updatedAtIso || '',
        userId: userDocument?.userId || userDocument?.id || '',
      }))
      .filter((profile) => profile.name || profile.email || profile.phone)
      .sort((a, b) => (
        toSafeTimestamp(b.profileUpdatedAtIso || b.profileCreatedAtIso) -
        toSafeTimestamp(a.profileUpdatedAtIso || a.profileCreatedAtIso)
      ))
      .slice(0, safeLimit)

    res.json({
      ok: true,
      data: normalizedUsers,
    })
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error?.message || 'Failed to load user profiles.',
    })
  }
}
