export function submitContact(req, res) {
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
