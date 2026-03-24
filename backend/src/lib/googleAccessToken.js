import { createSign } from 'crypto'
import config from '../config/env.js'

const googleTokenEndpoint = 'https://oauth2.googleapis.com/token'
const firestoreScope = 'https://www.googleapis.com/auth/datastore'
const tokenCache = {
  accessToken: '',
  expiresAtMs: 0,
}

const base64UrlEncode = (value) => (
  Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
)

const toSignedJwt = ({ payload, privateKey }) => {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  }
  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const unsignedToken = `${encodedHeader}.${encodedPayload}`

  const signer = createSign('RSA-SHA256')
  signer.update(unsignedToken)
  signer.end()

  const signature = signer
    .sign(privateKey)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')

  return `${unsignedToken}.${signature}`
}

export async function getFirestoreAccessToken({ fetchImpl = fetch } = {}) {
  const nowMs = Date.now()
  if (tokenCache.accessToken && tokenCache.expiresAtMs > nowMs + 30_000) {
    return tokenCache.accessToken
  }

  const serviceAccountEmail = config.firebase.serviceAccountEmail
  const serviceAccountPrivateKey = config.firebase.serviceAccountPrivateKey

  if (!serviceAccountEmail || !serviceAccountPrivateKey) {
    const issueDetails = config.firebaseServiceAccountIssue
      ? ` Missing: ${config.firebaseServiceAccountIssue}.`
      : ''
    throw new Error(`Firebase service account credentials are not configured.${issueDetails}`)
  }

  const nowSeconds = Math.floor(nowMs / 1000)
  const jwtPayload = {
    aud: googleTokenEndpoint,
    exp: nowSeconds + 3600,
    iat: nowSeconds,
    iss: serviceAccountEmail,
    scope: firestoreScope,
    sub: serviceAccountEmail,
  }
  const assertion = toSignedJwt({
    payload: jwtPayload,
    privateKey: serviceAccountPrivateKey,
  })

  const response = await fetchImpl(googleTokenEndpoint, {
    body: new URLSearchParams({
      assertion,
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    }).toString(),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok || !payload?.access_token) {
    throw new Error(payload?.error_description || payload?.error || 'Could not obtain Google access token.')
  }

  tokenCache.accessToken = payload.access_token
  tokenCache.expiresAtMs = nowMs + (Number(payload.expires_in || 3600) * 1000)

  return tokenCache.accessToken
}
