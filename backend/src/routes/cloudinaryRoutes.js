import { Router } from 'express'
import {
  deleteCloudinaryAsset,
  signCloudinaryUpload,
} from '../controllers/cloudinaryController.js'

// Cloudinary route group.
// Mounted in app.js at /api, producing:
// - POST /api/cloudinary/sign-upload
// - POST /api/cloudinary/delete
const router = Router()

router.post('/cloudinary/sign-upload', signCloudinaryUpload)
router.post('/cloudinary/delete', deleteCloudinaryAsset)

export default router
