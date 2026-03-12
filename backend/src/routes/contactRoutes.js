import { Router } from 'express'
import { submitContact } from '../controllers/contactController.js'

// Contact route group mounted in app.js at /api.
// Final endpoint: POST /api/contact
const router = Router()

router.post('/contact', submitContact)

export default router
