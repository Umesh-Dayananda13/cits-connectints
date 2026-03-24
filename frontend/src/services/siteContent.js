import { doc, onSnapshot } from 'firebase/firestore'
import { defaultSiteContent, mergeSiteContent } from '../content/siteContent'
import { auth, db } from '../firebase'

const siteContentCollection = 'siteContent'
const siteContentDocument = 'main'

export function subscribeSiteContent(onChange, onError) {
  // Live subscription used by frontend/src/App.jsx so the public /home page and
  // chatbot react immediately when /admin saves new Firestore content.
  if (!db) {
    onChange(defaultSiteContent)
    return () => {}
  }

  const siteContentRef = doc(db, siteContentCollection, siteContentDocument)

  return onSnapshot(
    siteContentRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onChange(defaultSiteContent)
        return
      }

      onChange(mergeSiteContent(snapshot.data()))
    },
    (error) => {
      onError?.(error)
      onChange(defaultSiteContent)
    },
  )
}

export const siteContentDocPath = `${siteContentCollection}/${siteContentDocument}`

async function getAdminRequestHeaders(headers = {}) {
  if (!auth?.currentUser) {
    throw new Error('Your admin session has expired. Sign in again.')
  }

  const idToken = await auth.currentUser.getIdToken()
  return {
    ...headers,
    Authorization: `Bearer ${idToken}`,
  }
}

export async function loadSiteContentOnce() {
  // One-time fetch used by frontend/src/components/AdminPanel.jsx to preload the
  // editor with the latest saved content through the authenticated backend.
  const payload = await requestJson(buildApiUrl('/api/site-content'), {}, { authRequired: true })
  return mergeSiteContent(payload.data || {})
}

export async function saveSiteContent(content) {
  // Admin writes now go through the backend so browser-side routing is not the
  // only protection around content updates.
  await requestJson(buildApiUrl('/api/site-content'), {
    body: JSON.stringify(content),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'PUT',
  }, { authRequired: true })
}

const localApiBaseUrl = 'http://localhost:5000'
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? localApiBaseUrl : '')

const buildApiUrl = (path) => `${apiBaseUrl}${path}`

async function requestJson(url, options = {}, { authRequired = false } = {}) {
  // Shared helper for backend routes used by the admin panel.
  // Current use: admin site content plus Cloudinary sign-upload and delete.
  const headers = authRequired
    ? await getAdminRequestHeaders(options.headers || {})
    : (options.headers || {})

  const response = await fetch(url, {
    ...options,
    headers,
  })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || `Request failed with status ${response.status}.`)
  }

  return payload
}

function parseXhrJson(request) {
  if (request.response && typeof request.response === 'object') {
    return request.response
  }

  try {
    return JSON.parse(request.responseText || '{}')
  } catch {
    return {}
  }
}

function uploadFormDataWithProgress(url, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()

    request.open('POST', url)
    request.responseType = 'json'

    request.upload.addEventListener('progress', (event) => {
      if (!onProgress || !event.lengthComputable || !event.total) return

      onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)))
    })

    request.addEventListener('load', () => {
      const payload = parseXhrJson(request)

      if (request.status < 200 || request.status >= 300) {
        reject(new Error(payload?.error?.message || 'Cloudinary upload failed.'))
        return
      }

      onProgress?.(100)
      resolve(payload)
    })

    request.addEventListener('error', () => {
      reject(new Error('Cloudinary upload failed.'))
    })

    request.addEventListener('abort', () => {
      reject(new Error('Cloudinary upload was cancelled.'))
    })

    request.send(formData)
  })
}

export async function uploadSiteImage(file, folder, { onProgress } = {}) {
  // Called by AdminPanel upload inputs for courses, placed students, and leadership.
  // Result:
  // - url: saved into Firestore for rendering on the public site
  // - path/public_id: saved into Firestore so future replace/delete can remove the asset
  const signaturePayload = await requestJson(buildApiUrl('/api/cloudinary/sign-upload'), {
    body: JSON.stringify({ folder }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  }, { authRequired: true })

  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', signaturePayload.data.apiKey)
  formData.append('folder', signaturePayload.data.folder)
  formData.append('signature', signaturePayload.data.signature)
  formData.append('timestamp', String(signaturePayload.data.timestamp))

  const uploadPayload = await uploadFormDataWithProgress(
    `https://api.cloudinary.com/v1_1/${signaturePayload.data.cloudName}/image/upload`,
    formData,
    onProgress,
  )

  return {
    path: uploadPayload.public_id,
    url: uploadPayload.secure_url,
  }
}

export async function deleteSiteImage(filePath) {
  if (!filePath) return

  // Best-effort cleanup only. Firestore content should still remain editable even
  // if deleting the old Cloudinary asset fails for any reason.
  try {
    await requestJson(buildApiUrl('/api/cloudinary/delete'), {
      body: JSON.stringify({ publicId: filePath }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    }, { authRequired: true })
  } catch (error) {
    console.warn('Cloudinary delete skipped', error)
  }
}
