import config from '../config/env.js'
import {
  getFirestoreDocument,
  setFirestoreDocument,
} from '../lib/firestoreRest.js'

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

export async function getSiteContent(_req, res) {
  try {
    const content = await getFirestoreDocument({
      documentPath: config.firestoreDocumentPath,
      idToken: _req.adminAuth.idToken,
    })

    res.json({
      ok: true,
      data: content,
    })
  } catch (error) {
    res.status(502).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Could not load site content.',
    })
  }
}

export async function saveSiteContent(req, res) {
  const nextContent = req.body
  if (!isPlainObject(nextContent)) {
    res.status(400).json({
      ok: false,
      error: 'A JSON object is required to save site content.',
    })
    return
  }

  const payload = {
    ...nextContent,
    updatedAtIso: new Date().toISOString(),
    updatedByEmail: req.adminAuth.email,
  }

  try {
    const savedContent = await setFirestoreDocument({
      data: payload,
      documentPath: config.firestoreDocumentPath,
      idToken: req.adminAuth.idToken,
    })

    res.json({
      ok: true,
      data: savedContent,
    })
  } catch (error) {
    res.status(502).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Could not save site content.',
    })
  }
}
