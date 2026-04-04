import express from 'express'
import cors from 'cors'
import config from './config/env.js'
import cloudinaryRoutes from './routes/cloudinaryRoutes.js'
import healthRoutes from './routes/healthRoutes.js'
import contactRoutes from './routes/contactRoutes.js'
import siteContentRoutes from './routes/siteContentRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import userProfileRoutes from './routes/userProfileRoutes.js'

// Express app composition layer.
// Owns middleware and route mounting only.
// Used by server.js as the process entry point.
const app = express()

// CORS configuration for frontend communication
const allowedOrigins = new Set(
  config.frontendOrigins.map((origin) => origin.toLowerCase().trim()),
)

const corsOriginResolver = (origin, callback) => {
  // Allow requests with no origin (like mobile apps or curl requests)
  if (!origin) {
    callback(null, true)
    return
  }

  const normalizedOrigin = origin.toLowerCase().trim()

  if (allowedOrigins.has(normalizedOrigin)) {
    callback(null, true)
    return
  }

  console.error(
    `CORS violation: Origin "${origin}" not allowed. Allowed origins: ${Array.from(allowedOrigins).join(', ')}`,
  )
  callback(new Error(`Origin not allowed by CORS: ${origin}`))
}

app.disable('x-powered-by')

// The frontend runs on Vite (default http://localhost:5173) and calls this backend
// for contact submissions plus signed Cloudinary upload/delete actions.
app.use(
  cors({
    credentials: true,
    origin: corsOriginResolver,
  }),
)
const jsonBodyParser = express.json({ limit: '1mb' })
app.use((req, res, next) => {
  // Stripe webhook verification must read raw bytes.
  if (req.originalUrl?.startsWith('/api/webhook/stripe')) {
    next()
    return
  }

  jsonBodyParser(req, res, next)
})
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  next()
})

app.get('/', (_req, res) => {
  res.json({ ok: true, message: 'CITS backend running' })
})

// Used by local checks and deployment health probes.
app.use('/api', healthRoutes)
// Used by frontend/src/services/siteContent.js for admin image uploads and deletes.
app.use('/api', cloudinaryRoutes)
// Used by frontend/src/components/AdminPanel.jsx for admin-only content load/save.
app.use('/api', siteContentRoutes)
// Used by the public contact form submission flow.
app.use('/api', contactRoutes)
// Used by frontend for course payment gateway integration.
app.use('/api', paymentRoutes)
// Used by signup flow and admin user-list reporting.
app.use('/api', userProfileRoutes)

app.use((error, _req, res, next) => {
  if (!error) {
    next()
    return
  }

  if (error.message?.startsWith('Origin not allowed by CORS:')) {
    res.status(403).json({
      ok: false,
      error: error.message,
    })
    return
  }

  next(error)
})

app.use((req, res) => {
  res.status(404).json({ ok: false, error: `Route not found: ${req.method} ${req.url}` })
})

app.use((error, _req, res, _next) => {
  res.status(500).json({
    ok: false,
    error: error instanceof Error ? error.message : 'Unexpected backend error.',
  })
})

export default app
