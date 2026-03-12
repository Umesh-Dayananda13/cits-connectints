import { createHash } from 'crypto'
import config from '../config/env.js'

// Cloudinary media controller.
// Used by routes/cloudinaryRoutes.js, mounted in app.js under /api.
// Frontend/src/services/siteContent.js calls these endpoints for admin uploads and deletions.

const buildCloudinarySignature = (params, apiSecret) => {
  const serializedParams = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('&')

  return createHash('sha1')
    .update(`${serializedParams}${apiSecret}`)
    .digest('hex')
}

const sanitizeFolderSegment = (value) => (
  value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
)

// The frontend sends logical folders like "courses" or "placed-students/person".
// This helper turns them into final Cloudinary folders under the configured base prefix.
const buildFolderPath = (value) => {
  const cleanedPath = (value || '')
    .split('/')
    .map((segment) => sanitizeFolderSegment(segment))
    .filter(Boolean)
    .join('/')

  return cleanedPath
    ? `${config.cloudinary.uploadFolder}/${cleanedPath}`
    : config.cloudinary.uploadFolder
}

export function signCloudinaryUpload(req, res) {
  // Used by the admin panel before each direct browser-to-Cloudinary upload.
  // The frontend calls /api/cloudinary/sign-upload, receives signed params,
  // then uploads the selected file directly to Cloudinary.
  if (!config.isCloudinaryConfigured) {
    return res.status(500).json({
      ok: false,
      error: config.cloudinaryConfigIssue || 'Cloudinary is not configured.',
    })
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const folder = buildFolderPath(req.body?.folder)
  const signature = buildCloudinarySignature(
    { folder, timestamp },
    config.cloudinary.apiSecret,
  )

  return res.json({
    ok: true,
    data: {
      apiKey: config.cloudinary.apiKey,
      cloudName: config.cloudinary.cloudName,
      folder,
      signature,
      timestamp,
    },
  })
}

export async function deleteCloudinaryAsset(req, res) {
  // Used when an admin replaces or deletes an image-backed item so the old
  // Cloudinary asset does not remain orphaned.
  if (!config.isCloudinaryConfigured) {
    return res.status(500).json({
      ok: false,
      error: config.cloudinaryConfigIssue || 'Cloudinary is not configured.',
    })
  }

  const publicId = req.body?.publicId?.trim()
  if (!publicId) {
    return res.status(400).json({
      ok: false,
      error: 'publicId is required',
    })
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const invalidate = 'true'
  const signature = buildCloudinarySignature(
    { invalidate, public_id: publicId, timestamp },
    config.cloudinary.apiSecret,
  )

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloudinary.cloudName}/image/destroy`,
      {
        body: new URLSearchParams({
          api_key: config.cloudinary.apiKey,
          invalidate,
          public_id: publicId,
          signature,
          timestamp: String(timestamp),
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
      },
    )

    const payload = await response.json()

    if (!response.ok) {
      return res.status(502).json({
        ok: false,
        error: payload?.error?.message || 'Cloudinary delete failed.',
      })
    }

    return res.json({
      ok: true,
      result: payload?.result || 'ok',
    })
  } catch (error) {
    return res.status(502).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Cloudinary delete failed.',
    })
  }
}
