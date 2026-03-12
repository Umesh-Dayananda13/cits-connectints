import express from 'express'
import cors from 'cors'
import config from './config/env.js'
import cloudinaryRoutes from './routes/cloudinaryRoutes.js'
import healthRoutes from './routes/healthRoutes.js'
import contactRoutes from './routes/contactRoutes.js'

// Express app composition layer.
// Owns middleware and route mounting only.
// Used by server.js as the process entry point.
const app = express()

// The frontend runs on Vite (default http://localhost:5173) and calls this backend
// for contact submissions plus signed Cloudinary upload/delete actions.
app.use(
  cors({
    origin: config.frontendOrigin,
  }),
)
app.use(express.json())

app.get('/', (_req, res) => {
  res.json({ ok: true, message: 'CITS backend running' })
})

// Used by local checks and deployment health probes.
app.use('/api', healthRoutes)
// Used by frontend/src/services/siteContent.js for admin image uploads and deletes.
app.use('/api', cloudinaryRoutes)
// Used by the public contact form submission flow.
app.use('/api', contactRoutes)

app.use((req, res) => {
  res.status(404).json({ ok: false, error: `Route not found: ${req.method} ${req.url}` })
})

export default app
