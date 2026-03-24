// Contact API controller.
// Used by routes/contactRoutes.js for POST /api/contact.
// Current implementation is a placeholder until a real DB/mail workflow is added.
export function submitContact(req, res) {
  // Current behavior is intentionally minimal: validate input and echo it back.
  // Future production change: replace this with database persistence, spam protection,
  // notifications, and audit logging without changing the route contract.
  const { name = '', email = '', phone = '', message = '' } = req.body ?? {}
  const trimmedName = name.trim()
  const trimmedEmail = email.trim().toLowerCase()
  const trimmedPhone = phone.trim()
  const trimmedMessage = message.trim()
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)

  if (!trimmedName || !trimmedEmail || !trimmedMessage) {
    return res.status(400).json({
      ok: false,
      error: 'name, email, and message are required',
    })
  }

  if (!isValidEmail) {
    return res.status(400).json({
      ok: false,
      error: 'Enter a valid email address.',
    })
  }

  if (trimmedMessage.length > 2000) {
    return res.status(400).json({
      ok: false,
      error: 'Message is too long. Keep it under 2000 characters.',
    })
  }

  return res.status(201).json({
    ok: true,
    data: {
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      message: trimmedMessage,
    },
    note: 'Validated only. Delivery or storage is not connected yet.',
    submittedAtIso: new Date().toISOString(),
  })
}
