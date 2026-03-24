import app from './src/app.js'

const server = app.listen(5001, async () => {
  try {
    console.log('Server started on port 5001')
    const res = await fetch('http://localhost:5001/api/checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: 'test', courseFee: 100, userEmail: 'test@example.com' })
    })
    const data = await res.json()
    console.log('Status:', res.status)
    console.log('Body:', JSON.stringify(data, null, 2))
  } catch (e) {
    console.error('Error:', e.message)
  } finally {
    server.close()
    process.exit(0)
  }
})
