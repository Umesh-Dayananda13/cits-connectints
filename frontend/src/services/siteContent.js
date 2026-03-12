import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { defaultSiteContent, mergeSiteContent } from '../content/siteContent'
import { db } from '../firebase'

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

export async function loadSiteContentOnce() {
  // One-time fetch used by frontend/src/components/AdminPanel.jsx to preload the
  // editor with the latest saved Firestore content before the admin starts editing.
  if (!db) return defaultSiteContent

  const siteContentRef = doc(db, siteContentCollection, siteContentDocument)
  const snapshot = await Promise.race([
    getDoc(siteContentRef),
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error('Firestore load timed out.')), 6000)
    }),
  ])

  if (!snapshot.exists()) {
    return defaultSiteContent
  }

  return mergeSiteContent(snapshot.data())
}

export async function saveSiteContent(content) {
  if (!db) {
    throw new Error('Firestore is not configured.')
  }

  // This is the single shared content document consumed by the public home page
  // and edited from /admin. Media URLs and image paths are stored alongside text.
  const siteContentRef = doc(db, siteContentCollection, siteContentDocument)
  await setDoc(siteContentRef, {
    ...content,
    updatedAtIso: new Date().toISOString(),
  })
}

const localApiBaseUrl = 'http://localhost:5000'
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? localApiBaseUrl : '')

const buildApiUrl = (path) => `${apiBaseUrl}${path}`

async function requestJson(url, options = {}) {
  // Shared helper for backend routes used by the admin panel.
  // Current use: Cloudinary sign-upload and delete.
  const response = await fetch(url, options)
  const payload = await response.json().catch(() => ({}))

  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || `Request failed with status ${response.status}.`)
  }

  return payload
}

export async function uploadSiteImage(file, folder) {
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
  })

  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', signaturePayload.data.apiKey)
  formData.append('folder', signaturePayload.data.folder)
  formData.append('signature', signaturePayload.data.signature)
  formData.append('timestamp', String(signaturePayload.data.timestamp))

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${signaturePayload.data.cloudName}/image/upload`,
    {
      body: formData,
      method: 'POST',
    },
  )

  const uploadPayload = await uploadResponse.json()

  if (!uploadResponse.ok) {
    throw new Error(uploadPayload?.error?.message || 'Cloudinary upload failed.')
  }

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
    })
  } catch (error) {
    console.warn('Cloudinary delete skipped', error)
  }
}
