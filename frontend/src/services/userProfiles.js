import { auth } from '../firebase'

// Shared API origin resolution for profile endpoints.
// Current use: local dev (localhost:5000) or deployed backend via VITE_API_BASE_URL.
// Future production change: move this into a central API client when more modules share it.
const localApiBaseUrl = 'http://localhost:5000'
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? localApiBaseUrl : '')

const buildApiUrl = (path) => `${apiBaseUrl}${path}`

// Adds Firebase ID token to secure profile APIs.
// Current use: both member profile save and admin user list read.
// Future production change: refresh/retry token here if server starts returning 401.
async function getAuthHeaders(headers = {}) {
  if (!auth?.currentUser) {
    throw new Error('Your session has expired. Sign in again.')
  }

  const idToken = await auth.currentUser.getIdToken()
  return {
    ...headers,
    Authorization: `Bearer ${idToken}`,
  }
}

// Small JSON request wrapper so profile endpoints share one error path.
// Future production change: replace with a generic API utility shared across services.
async function requestJson(path, options = {}) {
  try {
    const headers = await getAuthHeaders(options.headers || {})
    const response = await fetch(buildApiUrl(path), {
      ...options,
      headers,
    })
    const payload = await response.json().catch(() => ({}))

    if (!response.ok || payload?.ok === false) {
      throw new Error(payload?.error || `Request failed with status ${response.status}.`)
    }

    return payload
  } catch (error) {
    console.error(`API Error at ${path}:`, error)
    throw error
  }
}

// Saves create-account profile details for admin visibility.
// Backend resolves/validates the signed-in identity before writing Firestore.
export async function saveUserProfile({ email, name, phone }) {
  const payload = await requestJson('/api/user-profile', {
    body: JSON.stringify({ email, name, phone }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  return payload?.data || null
}

// Admin-only list of registered user profiles shown in /admin -> Users.
export async function getAdminUsers({ limit = 200 } = {}) {
  const query = new URLSearchParams({
    limit: String(limit),
  })
  const payload = await requestJson(`/api/admin/users?${query.toString()}`)
  return Array.isArray(payload?.data) ? payload.data : []
}
