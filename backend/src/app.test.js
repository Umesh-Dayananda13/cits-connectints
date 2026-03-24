import test from 'node:test'
import assert from 'node:assert/strict'
import app from './app.js'

const startServer = async () => new Promise((resolve) => {
  const server = app.listen(0, () => {
    const { port } = server.address()
    resolve({
      close: () => new Promise((closeResolve) => server.close(closeResolve)),
      url: `http://127.0.0.1:${port}`,
    })
  })
})

test('GET /api/health returns backend health payload', async () => {
  const server = await startServer()

  try {
    const response = await fetch(`${server.url}/api/health`)
    const payload = await response.json()

    assert.equal(response.status, 200)
    assert.equal(payload.ok, true)
    assert.equal(payload.service, 'cits-backend')
    assert.ok(payload.timestamp)
  } finally {
    await server.close()
  }
})

test('POST /api/cloudinary/sign-upload requires admin authorization', async () => {
  const server = await startServer()

  try {
    const response = await fetch(`${server.url}/api/cloudinary/sign-upload`, {
      body: JSON.stringify({ folder: 'courses' }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
    const payload = await response.json()

    assert.equal(response.status, 401)
    assert.equal(payload.ok, false)
  } finally {
    await server.close()
  }
})

test('GET /api/site-content requires admin authorization', async () => {
  const server = await startServer()

  try {
    const response = await fetch(`${server.url}/api/site-content`)
    const payload = await response.json()

    assert.equal(response.status, 401)
    assert.equal(payload.ok, false)
  } finally {
    await server.close()
  }
})

test('POST /api/contact rejects invalid email input', async () => {
  const server = await startServer()

  try {
    const response = await fetch(`${server.url}/api/contact`, {
      body: JSON.stringify({
        email: 'not-an-email',
        message: 'Need details',
        name: 'Test User',
        phone: '12345',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
    const payload = await response.json()

    assert.equal(response.status, 400)
    assert.equal(payload.ok, false)
    assert.equal(payload.error, 'Enter a valid email address.')
  } finally {
    await server.close()
  }
})
