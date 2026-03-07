export function getHealth(_req, res) {
  res.json({
    ok: true,
    service: 'cits-backend',
    timestamp: new Date().toISOString(),
  })
}
