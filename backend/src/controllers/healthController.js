// Health controller used by GET /api/health.
// Purpose: quick backend liveness checks in local development and deployment.
export function getHealth(_req, res) {
  res.json({
    ok: true,
    service: 'cits-backend',
    timestamp: new Date().toISOString(),
  })
}
