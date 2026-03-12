import app from './app.js'
import config from './config/env.js'

// Thin process entry point used by:
// - npm run dev
// - npm start
// Keep bootstrapping here minimal so app.js stays reusable for tests or future serverless adapters.
app.listen(config.port, () => {
  console.log(`CITS backend listening on http://localhost:${config.port}`)
})
