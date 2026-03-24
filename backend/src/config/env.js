import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Backend environment loader.
// Used by app.js, server.js, and backend controllers.
// It always loads backend/.env directly so the backend works no matter where npm was started from.

const currentFilePath = fileURLToPath(import.meta.url)
const currentDirPath = path.dirname(currentFilePath)
const envFilePath = path.resolve(currentDirPath, '../../.env')

// Always load backend/.env from the backend package itself so the server works
// whether it is started from /backend or from the repo root.
dotenv.config({ path: envFilePath })

const readTrimmedEnv = (key, fallback = '') => (process.env[key] || fallback).trim()
const readListEnv = (key, fallback = '') => (
  readTrimmedEnv(key, fallback)
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
)

const cloudinaryConfig = {
  apiKey: readTrimmedEnv('CLOUDINARY_API_KEY'),
  apiSecret: readTrimmedEnv('CLOUDINARY_API_SECRET'),
  cloudName: readTrimmedEnv('CLOUDINARY_CLOUD_NAME'),
  // This is the base folder prefix used for all admin uploads in Cloudinary.
  // Example final folders: cits-admin/courses, cits-admin/leadership.
  uploadFolder: readTrimmedEnv('CLOUDINARY_UPLOAD_FOLDER', 'cits-admin'),
}

const missingCloudinaryConfig = Object.entries(cloudinaryConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key)

const firebaseConfig = {
  // Used by Firestore REST (client-token path and server-token fallback path).
  // Service account values are optional for normal request flows, but required
  // for webhook-first writes where no browser token exists.
  serviceAccountEmail: readTrimmedEnv('FIREBASE_SERVICE_ACCOUNT_EMAIL'),
  serviceAccountPrivateKey: readTrimmedEnv('FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY').replace(/\\n/g, '\n'),
  projectId: readTrimmedEnv('FIREBASE_PROJECT_ID'),
  databaseId: readTrimmedEnv('FIRESTORE_DATABASE_ID', '(default)'),
}

// Core Firebase backend config required for ID-token verification and Firestore
// REST URL construction. Service-account values are optional and handled
// separately so existing admin/content flows keep working without them.
const missingFirebaseCoreConfig = [
  !firebaseConfig.projectId ? 'FIREBASE_PROJECT_ID' : '',
  !firebaseConfig.databaseId ? 'FIRESTORE_DATABASE_ID' : '',
].filter(Boolean)

const config = {
  adminEmails: readListEnv('ADMIN_EMAILS'),
  cloudinary: cloudinaryConfig,
  cloudinaryConfigIssue: missingCloudinaryConfig.length
    ? `Missing Cloudinary config: ${missingCloudinaryConfig.join(', ')}`
    : '',
  isCloudinaryConfigured: missingCloudinaryConfig.length === 0,
  firebase: firebaseConfig,
  firebaseConfigIssue: missingFirebaseCoreConfig.length
    ? `Missing Firebase backend config: ${missingFirebaseCoreConfig.join(', ')}`
    : '',
  isFirebaseConfigured: missingFirebaseCoreConfig.length === 0,
  firebaseServiceAccountIssue: [
    !firebaseConfig.serviceAccountEmail ? 'FIREBASE_SERVICE_ACCOUNT_EMAIL' : '',
    !firebaseConfig.serviceAccountPrivateKey ? 'FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY' : '',
  ]
    .filter(Boolean)
    .join(', '),
  firestoreDocumentPath: 'siteContent/main',
  frontendOrigins: readListEnv('FRONTEND_ORIGIN', 'http://localhost:5173'),
  port: Number(readTrimmedEnv('PORT', '5000')),
  rateLimit: {
    adminWindowMs: Number(readTrimmedEnv('ADMIN_RATE_LIMIT_WINDOW_MS', '60000')),
    adminMaxRequests: Number(readTrimmedEnv('ADMIN_RATE_LIMIT_MAX_REQUESTS', '60')),
    contactWindowMs: Number(readTrimmedEnv('CONTACT_RATE_LIMIT_WINDOW_MS', '60000')),
    contactMaxRequests: Number(readTrimmedEnv('CONTACT_RATE_LIMIT_MAX_REQUESTS', '10')),
  },
  stripe: {
    secretKey: readTrimmedEnv('STRIPE_SECRET_KEY'),
    publishableKey: readTrimmedEnv('STRIPE_PUBLISHABLE_KEY'),
    webhookSecret: readTrimmedEnv('STRIPE_WEBHOOK_SECRET'),
  },
}

export default config
