import { useEffect, useRef, useState } from 'react'

// Rule-based chatbot for the public /home page.
// Used by App.jsx and powered by Firestore-backed knowledge passed in as props.
// It does not call the backend or any external AI model.

const quickQuestions = [
  'Course fees',
  'Upcoming batches',
  'Certificate verification',
  'Placement support',
]

const createMessage = (role, text, extras = {}) => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role,
  text,
  ...extras,
})

const normalizeText = (value) => (
  value
    .toLowerCase()
    .replace(/[^a-z0-9+\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
)

const includesAny = (value, terms) => terms.some((term) => value.includes(term))

const courseAliases = {
  'Oracle EBS by CITS': ['oracle ebs', 'oracle'],
  'Versant Mock Test Practice by CITS': ['versant mock test', 'versant'],
  'Quality Analyst': ['quality analyst', 'quality', 'qa'],
  'ServiceNow by CITS': ['servicenow', 'service now'],
  'Incident Management': ['incident management', 'incident'],
}

// First assistant message shown when the widget opens or resets.
const buildWelcomeMessage = (memberName) => createMessage(
  'assistant',
  `Hi ${memberName || 'there'}. I can help with courses, fees, batches, placement support, certificate verification, and contact details.`,
  {
    actions: [
      { type: 'section', label: 'Open Courses', sectionId: 'courses', sectionLabel: 'Courses' },
      { type: 'section', label: 'Open Roadmap', sectionId: 'roadmap', sectionLabel: 'Roadmap' },
      { type: 'section', label: 'Contact Team', sectionId: 'verify-certificate', sectionLabel: 'Verify Your Certificate' },
    ],
  },
)

const getCourseMatch = (query, courses) => (
  courses.find((course) =>
    (courseAliases[course.title] || []).some((alias) => query.includes(alias)),
  )
)

const getCourseResponse = (course, knowledge) => {
  const batch = knowledge.upcomingBatches.find(
    (item) => item.track.toLowerCase() === course.title.toLowerCase(),
  )

  const includesList = knowledge.courseIncludes
    .slice(0, 4)
    .map((item) => `- ${item}`)
    .join('\n')

  const timingLine = batch
    ? `Current format: ${batch.mode} for ${batch.duration}.`
    : 'Batch timing details will be announced soon.'

  return createMessage(
    'assistant',
    `${course.title} is listed at Rs ${course.fee}.\n${timingLine}\n\nWhat is included:\n${includesList}`,
    {
      actions: [
        { type: 'section', label: 'Open Courses', sectionId: 'courses', sectionLabel: 'Courses' },
        { type: 'section', label: 'View Batches', sectionId: 'upcoming-batches', sectionLabel: 'Upcoming Batches' },
      ],
    },
  )
}

// Main intent router for user questions.
// Converts the Firestore-backed knowledge object into local canned replies and shortcuts.
const getReplyForMessage = (rawMessage, knowledge) => {
  const query = normalizeText(rawMessage)
  const {
    blogPreviews,
    contact,
    courses,
    impactStats,
    placedStudents,
    verificationSteps,
    whatsappNumber,
  } = knowledge

  const isGreeting = query === 'hi' || query.startsWith('hi ') || includesAny(query, ['hello', 'hey', 'good morning', 'good afternoon', 'good evening'])

  if (!query || isGreeting) {
    return createMessage(
      'assistant',
      'Ask me about a course, fee, batch duration, verification steps, or placement support.',
      {
        actions: [
          { type: 'section', label: 'Browse Courses', sectionId: 'courses', sectionLabel: 'Courses' },
          { type: 'section', label: 'See Placements', sectionId: 'placed-students', sectionLabel: 'Placed Students' },
        ],
      },
    )
  }

  const matchedCourse = getCourseMatch(query, courses)
  if (matchedCourse) {
    return getCourseResponse(matchedCourse, knowledge)
  }

  if (includesAny(query, ['fee', 'fees', 'price', 'pricing', 'cost'])) {
    const feeLines = courses
      .map((course) => `- ${course.title}: Rs ${course.fee}`)
      .join('\n')

    return createMessage(
      'assistant',
      `Here are the current course fees:\n${feeLines}`,
      {
        actions: [
          { type: 'section', label: 'Open Courses', sectionId: 'courses', sectionLabel: 'Courses' },
        ],
      },
    )
  }

  if (includesAny(query, ['batch', 'batches', 'duration', 'when does', 'when is', 'schedule'])) {
    const batchLines = knowledge.upcomingBatches
      .map((batch) => `- ${batch.track}: ${batch.mode}, ${batch.duration}`)
      .join('\n')

    return createMessage(
      'assistant',
      `Batch dates are marked as coming soon, but the current training formats are:\n${batchLines}\n\nContact the team to get priority updates for the next intake.`,
      {
        actions: [
          { type: 'section', label: 'Open Batches', sectionId: 'upcoming-batches', sectionLabel: 'Upcoming Batches' },
          { type: 'link', label: 'WhatsApp Team', href: `https://wa.me/${whatsappNumber}` },
        ],
      },
    )
  }

  if (includesAny(query, ['verify', 'verification', 'certificate', 'certificate id'])) {
    const steps = verificationSteps
      .map((step, index) => `${index + 1}. ${step}`)
      .join('\n')

    return createMessage(
      'assistant',
      `Certificate verification currently works like this:\n${steps}`,
      {
        actions: [
          { type: 'section', label: 'Open Verification', sectionId: 'verify-certificate', sectionLabel: 'Verify Your Certificate' },
        ],
      },
    )
  }

  if (includesAny(query, ['placement', 'placements', 'job', 'jobs', 'interview', 'resume', 'linkedin'])) {
    const highlightedPlacements = placedStudents
      .slice(0, 2)
      .map((student) => `${student.name} at ${student.company}`)
      .join(', ')

    return createMessage(
      'assistant',
      `CITS focuses on live classes, mock interviews, resume and LinkedIn optimization, and hands-on assignments. Placement highlights currently shown on the page include ${highlightedPlacements}.`,
      {
        actions: [
          { type: 'section', label: 'Open Placements', sectionId: 'placed-students', sectionLabel: 'Placed Students' },
          { type: 'section', label: 'See Roadmap', sectionId: 'roadmap', sectionLabel: 'Roadmap' },
        ],
      },
    )
  }

  if (includesAny(query, ['contact', 'phone', 'email', 'whatsapp', 'support'])) {
    return createMessage(
      'assistant',
      `You can reach CITS at ${contact.email}, ${contact.phone}, or ${contact.alternatePhone}. Support hours are ${contact.supportHours}.`,
      {
        actions: [
          { type: 'link', label: 'Open WhatsApp', href: `https://wa.me/${whatsappNumber}` },
          { type: 'section', label: 'Open Contact Area', sectionId: 'verify-certificate', sectionLabel: 'Verify Your Certificate' },
        ],
      },
    )
  }

  if (includesAny(query, ['roadmap', 'enroll', 'enrollment', 'join', 'start course'])) {
    return createMessage(
      'assistant',
      'The enrollment flow is: start on WhatsApp, choose your course, submit your request, receive enrollment guidance, and then join live classes.',
      {
        actions: [
          { type: 'section', label: 'Open Roadmap', sectionId: 'roadmap', sectionLabel: 'Roadmap' },
          { type: 'link', label: 'Start on WhatsApp', href: `https://wa.me/${whatsappNumber}` },
        ],
      },
    )
  }

  if (includesAny(query, ['about', 'story', 'founder', 'co founder', 'approval', 'aicte', 'iso', 'msme'])) {
    const statsLine = impactStats
      .slice(0, 3)
      .map((item) => `${item.value} ${item.label}`)
      .join(', ')

    return createMessage(
      'assistant',
      `CITS positions itself as a career-first training platform built from the founders' struggle to create opportunities. The page highlights recognitions including AICTE approval, ISO 21001:2018, Start-up India, and MSME registration, plus ${statsLine}.`,
      {
        actions: [
          { type: 'section', label: 'Open About', sectionId: 'about-us', sectionLabel: 'About Us' },
          { type: 'section', label: 'Meet Leadership', sectionId: 'leadership', sectionLabel: 'Founder & Co-Founder' },
        ],
      },
    )
  }

  if (includesAny(query, ['blog', 'blogs', 'career tips', 'insights'])) {
    const topics = blogPreviews
      .map((post) => `- ${post.title}`)
      .join('\n')

    return createMessage(
      'assistant',
      `The current blog section is a preview area with topics such as:\n${topics}`,
      {
        actions: [
          { type: 'section', label: 'Open Blogs', sectionId: 'blogs', sectionLabel: 'Blogs' },
        ],
      },
    )
  }

  return createMessage(
    'assistant',
    'I could not match that exactly. Try asking about course fees, batches, placements, certificate verification, or contact details.',
    {
      actions: [
        { type: 'section', label: 'Browse Courses', sectionId: 'courses', sectionLabel: 'Courses' },
        { type: 'section', label: 'See Placements', sectionId: 'placed-students', sectionLabel: 'Placed Students' },
        { type: 'link', label: 'WhatsApp Team', href: `https://wa.me/${whatsappNumber}` },
      ],
    },
  )
}

function ChatbotMessage({ message, onNavigateToSection }) {
  const isAssistant = message.role === 'assistant'

  return (
    <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-lg ${
          isAssistant
            ? 'rounded-bl-md border border-cyan-400/18 bg-slate-900/95 text-slate-100'
            : 'rounded-br-md bg-gradient-to-r from-cyan-300 to-sky-400 text-slate-950'
        }`}
      >
        <p className="whitespace-pre-line">{message.text}</p>
        {isAssistant && message.actions?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.actions.map((action) => (
              action.type === 'link' ? (
                <a
                  key={`${message.id}-${action.label}`}
                  href={action.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
                >
                  {action.label}
                </a>
              ) : (
                <button
                  key={`${message.id}-${action.label}`}
                  type="button"
                  onClick={() => onNavigateToSection(action.sectionId, action.sectionLabel || action.label)}
                  className="rounded-full border border-slate-600 bg-slate-950/70 px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:border-cyan-300/60 hover:text-cyan-100"
                >
                  {action.label}
                </button>
              )
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default function ChatbotWidget({ knowledge, memberName, onNavigateToSection }) {
  const [draft, setDraft] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [messages, setMessages] = useState(() => [buildWelcomeMessage(memberName)])
  const replyTimerRef = useRef(null)
  const messageListRef = useRef(null)

  useEffect(() => () => {
    if (replyTimerRef.current) {
      window.clearTimeout(replyTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!messageListRef.current) return

    messageListRef.current.scrollTop = messageListRef.current.scrollHeight
  }, [isOpen, isTyping, messages])

  const sendMessage = (value) => {
    const trimmedValue = value.trim()
    if (!trimmedValue || isTyping) return

    if (replyTimerRef.current) {
      window.clearTimeout(replyTimerRef.current)
    }

    setMessages((prev) => [...prev, createMessage('user', trimmedValue)])
    setDraft('')
    setIsTyping(true)

    replyTimerRef.current = window.setTimeout(() => {
      setMessages((prev) => [...prev, getReplyForMessage(trimmedValue, knowledge)])
      setIsTyping(false)
    }, 360)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    sendMessage(draft)
  }

  return (
    <div className="chatbot-shell">
      {isOpen ? (
        <section className="chatbot-panel flex flex-col overflow-hidden rounded-[1.6rem] border border-cyan-400/25 bg-slate-950/96 text-slate-100 shadow-2xl shadow-cyan-950/35">
          <header className="shrink-0 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/80 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-cyan-300">
                  CITS Assistant
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  Ask about fees, batches, placements, or verification.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/60 hover:text-cyan-100"
              >
                Close
              </button>
            </div>
          </header>

          <div ref={messageListRef} className="chatbot-messages min-h-0 flex-1 space-y-3 px-4 py-4">
            {messages.map((message) => (
              <ChatbotMessage
                key={message.id}
                message={message}
                onNavigateToSection={onNavigateToSection}
              />
            ))}

            {isTyping ? (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md border border-cyan-400/18 bg-slate-900/95 px-4 py-3">
                  <span className="chatbot-typing-dot" />
                  <span className="chatbot-typing-dot" />
                  <span className="chatbot-typing-dot" />
                </div>
              </div>
            ) : null}
          </div>

          <div className="shrink-0 border-t border-slate-800 px-4 py-3">
            <div className="mb-3 flex flex-wrap items-start gap-2">
              {quickQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => sendMessage(question)}
                  className="rounded-full border border-slate-700 bg-slate-900/75 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/60 hover:text-cyan-100"
                >
                  {question}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask your question"
                className="h-12 min-w-0 flex-1 rounded-full border border-slate-700 bg-slate-900/80 px-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60"
              />
              <button
                type="submit"
                disabled={!draft.trim() || isTyping}
                className="h-12 min-w-[5.5rem] rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-4 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Send
              </button>
            </form>
          </div>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="chatbot-launcher inline-flex items-center gap-3 rounded-full border border-cyan-300/35 bg-slate-950/95 px-4 py-3 text-left text-slate-100 shadow-xl shadow-cyan-950/35 transition hover:-translate-y-0.5"
        aria-expanded={isOpen}
        aria-label="Open CITS chatbot"
      >
        <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-cyan-300 via-sky-400 to-blue-500 text-slate-950 shadow-lg shadow-cyan-900/40">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
            <path d="M7 10h10M7 14h6M6.2 19.4 3.5 21l.82-3.05A8 8 0 1 1 20 12a8 8 0 0 1-13.8 7.4Z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="min-w-0">
          <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-cyan-300">
            CITS Chatbot
          </span>
          <span className="block truncate text-sm text-slate-200">
            Ask about fees, batches, and placements
          </span>
        </span>
      </button>
    </div>
  )
}
