import express from 'express'
import cors from 'cors'
import config from './config/env.js'
import healthRoutes from './routes/healthRoutes.js'
import contactRoutes from './routes/contactRoutes.js'

const app = express()

app.use(
  cors({
    origin: config.frontendOrigin,
  }),
)
app.use(express.json())

app.get('/', (_req, res) => {
  res.json({ ok: true, message: 'CITS backend running' })
})

app.use('/api', healthRoutes)
app.use('/api', contactRoutes)

app.use((req, res) => {
  res.status(404).json({ ok: false, error: `Route not found: ${req.method} ${req.url}` })
})

export default app
