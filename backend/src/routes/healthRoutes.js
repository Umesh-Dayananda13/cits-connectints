import { Router } from 'express'
import { getHealth } from '../controllers/healthController.js'

// Health route group mounted in app.js at /api.
// Final endpoint: GET /api/health
const router = Router()

router.get('/health', getHealth)

export default router
