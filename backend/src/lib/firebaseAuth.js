import { createVerify, X509Certificate } from 'crypto'
import config from '../config/env.js'

const secureTokenCertsUrl = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
const certCache = {
  certsByKid: null,
  expiresAtMs: 0,
}

const createAuthError = (message, statusCode = 401) => {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

const decodeBase64Url = (value) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const paddingLength = (4 - (normalized.length % 4)) % 4
  return Buffer.from(`${normalized}${'='.repeat(paddingLength)}`, 'base64')
}

const decodeJsonSegment = (value, errorLabel) => {
  try {
    return JSON.parse(decodeBase64Url(value).toString('utf8'))
  } catch {
    throw createAuthError(`Firebase token ${errorLabel} is invalid.`)
  }
}

const getCacheMaxAgeSeconds = (headerValue) => {
  const match = headerValue?.match(/max-age=(\d+)/i)
  return match ? Number(match[1]) : 3600
}

async function loadSecureTokenCerts(fetchImpl = fetch) {
  const nowMs = Date.now()
  if (certCache.certsByKid && certCache.expiresAtMs > nowMs) {
    return certCache.certsByKid
  }

  const response = await fetchImpl(secureTokenCertsUrl)
  if (!response.ok) {
    throw createAuthError('Could not load Firebase signing certificates.', 503)
  }

  const certsByKid = await response.json()
  certCache.certsByKid = certsByKid
  certCache.expiresAtMs = nowMs + (getCacheMaxAgeSeconds(response.headers.get('cache-control')) * 1000)
  return certsByKid
}

const verifyJwtSignature = (signedValue, signatureSegment, certificate) => {
  const verifier = createVerify('RSA-SHA256')
  verifier.update(signedValue)
  verifier.end()

  const publicKey = new X509Certificate(certificate).publicKey
  return verifier.verify(publicKey, decodeBase64Url(signatureSegment))
}

export const isAllowedAdminEmail = (email) => (
  Boolean(email) && config.adminEmails.includes(email.trim().toLowerCase())
)

export const parseBearerToken = (authorizationHeader) => {
  const [scheme, token] = (authorizationHeader || '').split(' ')
  if (scheme !== 'Bearer' || !token) {
    throw createAuthError('Missing admin authorization token.')
  }

  return token
}

export async function verifyFirebaseIdToken(idToken, { fetchImpl = fetch, nowMs = Date.now() } = {}) {
  if (!config.isFirebaseConfigured) {
    throw createAuthError(config.firebaseConfigIssue || 'Firebase backend config is missing.', 500)
  }

  const tokenParts = (idToken || '').split('.')
  if (tokenParts.length !== 3) {
    throw createAuthError('Firebase token format is invalid.')
  }

  const [headerSegment, payloadSegment, signatureSegment] = tokenParts
  const header = decodeJsonSegment(headerSegment, 'header')
  const payload = decodeJsonSegment(payloadSegment, 'payload')

  if (header.alg !== 'RS256' || !header.kid) {
    throw createAuthError('Firebase token header is invalid.')
  }

  const certsByKid = await loadSecureTokenCerts(fetchImpl)
  const certificate = certsByKid[header.kid]
  if (!certificate) {
    throw createAuthError('Firebase token signing key is not trusted.')
  }

  const signedValue = `${headerSegment}.${payloadSegment}`
  if (!verifyJwtSignature(signedValue, signatureSegment, certificate)) {
    throw createAuthError('Firebase token signature is invalid.')
  }

  const expectedAudience = config.firebase.projectId
  const expectedIssuer = `https://securetoken.google.com/${expectedAudience}`
  const nowSeconds = Math.floor(nowMs / 1000)

  if (payload.aud !== expectedAudience || payload.iss !== expectedIssuer) {
    throw createAuthError('Firebase token was issued for a different project.')
  }

  if (!payload.sub || typeof payload.sub !== 'string' || payload.sub.length > 128) {
    throw createAuthError('Firebase token subject is invalid.')
  }

  if (!payload.iat || !payload.exp || nowSeconds >= Number(payload.exp)) {
    throw createAuthError('Firebase token has expired.')
  }

  if (Number(payload.iat) > nowSeconds + 300) {
    throw createAuthError('Firebase token issued-at time is invalid.')
  }

  return payload
}
