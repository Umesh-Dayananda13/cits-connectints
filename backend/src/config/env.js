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

const config = {
  cloudinary: cloudinaryConfig,
  cloudinaryConfigIssue: missingCloudinaryConfig.length
    ? `Missing Cloudinary config: ${missingCloudinaryConfig.join(', ')}`
    : '',
  isCloudinaryConfigured: missingCloudinaryConfig.length === 0,
  port: Number(readTrimmedEnv('PORT', '5000')),
  frontendOrigin: readTrimmedEnv('FRONTEND_ORIGIN', 'http://localhost:5173'),
}

export default config
