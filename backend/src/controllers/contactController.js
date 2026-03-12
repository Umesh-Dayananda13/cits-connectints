export function submitContact(req, res) {
  // Current behavior is intentionally minimal: validate input and echo it back.
  // Future production change: replace this with database persistence, spam protection,
  // notifications, and audit logging without changing the route contract.
  const { name = '', email = '', phone = '', message = '' } = req.body ?? {}

  if (!name.trim() || !email.trim() || !message.trim()) {
    return res.status(400).json({
      ok: false,
      error: 'name, email, and message are required',
    })
  }

  return res.status(201).json({
    ok: true,
    data: {
      name,
      email,
      phone,
      message,
    },
    note: 'Stored in memory for now. Connect DB/mail later.',
  })
}
