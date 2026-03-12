import { useEffect, useState } from 'react'

// AuthScreen is UI-only.
// Used by App.jsx on /login and /signup while App.jsx keeps all Firebase auth logic.

// Marketing phrases for the animated hero line.
// Current use: visual brand motion on the auth landing page.
// Future production change: replace these with CMS/API content here without touching form logic.
const heroTypingPhrases = [
  'ServiceNow careers',
  'Oracle EBS growth',
  'QA job readiness',
  'interview-winning confidence',
]

// Keep hero highlights short so the left panel stays immersive and avoids internal scrolling.
// Future production change: this list is the safest place to swap positioning/copy for campaigns.
const heroHighlights = [
  'Mentor-led training',
  'Mock interviews and resumes',
  'Placement-focused support',
]

function TrustShieldIcon() {
  // Local icon used only inside the auth trust strip.
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M12 2.75 5.5 5.2v5.3c0 4.26 2.56 8.2 6.5 9.75 3.94-1.55 6.5-5.49 6.5-9.75V5.2L12 2.75Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="m9.7 11.95 1.55 1.55 3.25-3.45"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function AuthScreen({
  authMode,
  authForm,
  authError,
  authMessage,
  isAuthBusy,
  onChangeMode,
  onFieldChange,
  onSubmit,
}) {
  // This component stays presentation-only on purpose.
  // Current auth logic lives in App.jsx, which makes future production upgrades such as
  // email verification, OAuth providers, roles, or MFA easier to add in one place.
  // Route-driven mode keeps the UI and URL in sync without local toggle state.
  const isSignUp = authMode === 'signup'
  const [typingIndex, setTypingIndex] = useState(0)
  const [typedText, setTypedText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  // Typing timing values are purely presentational.
  // Future production change: you can remove this effect or swap it for API-driven copy
  // without changing how authentication works.
  useEffect(() => {
    const activePhrase = heroTypingPhrases[typingIndex]
    let timeoutMs = isDeleting ? 42 : 72

    if (!isDeleting && typedText === activePhrase) {
      timeoutMs = 1400
    }

    if (isDeleting && typedText === '') {
      timeoutMs = 260
    }

    const timer = window.setTimeout(() => {
      if (!isDeleting && typedText === activePhrase) {
        setIsDeleting(true)
        return
      }

      if (isDeleting && typedText === '') {
        setIsDeleting(false)
        setTypingIndex((prev) => (prev + 1) % heroTypingPhrases.length)
        return
      }

      const nextLength = typedText.length + (isDeleting ? -1 : 1)
      setTypedText(activePhrase.slice(0, nextLength))
    }, timeoutMs)

    return () => window.clearTimeout(timer)
  }, [isDeleting, typedText, typingIndex])

  return (
    <main className="auth-entry min-h-screen px-3 py-3 text-slate-100 sm:px-4 sm:py-4 lg:px-5 lg:py-5">
      <div className="auth-entry-grid mx-auto grid min-h-[calc(100vh-1.5rem)] w-full max-w-7xl gap-4 sm:min-h-[calc(100vh-2rem)] lg:min-h-[calc(100vh-2.5rem)] lg:grid-cols-2">
        {/* Left panel explains what CITS is and why this portal exists. */}
        <section className="auth-hero-panel auth-reveal-panel relative overflow-hidden rounded-[2rem] border border-white/10 px-6 py-6 sm:px-7 sm:py-7 lg:px-8 lg:py-8">
          <div className="auth-ambient auth-ambient-one" aria-hidden="true" />
          <div className="auth-ambient auth-ambient-two" aria-hidden="true" />
          <div className="auth-grid-lines" aria-hidden="true" />
          <div className="auth-light-streak" aria-hidden="true" />
          <div className="auth-floating-dots" aria-hidden="true" />

          <div className="auth-hero-layout relative z-10 flex h-full flex-col gap-6">
            <div className="auth-hero-glow" aria-hidden="true" />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="auth-brand-badge inline-flex items-center gap-3 rounded-full border border-white/12 px-4 py-2">
                <span className="auth-brand-dot" aria-hidden="true" />
                <span className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200">CITS Portal</span>
              </div>
              <div className="auth-surface-tag rounded-full border border-cyan-300/18 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-200">
                Secure Access
              </div>
            </div>

            {/* The hero stays intentionally light: title, short proof points, and no deep content. */}
            <div className="flex flex-1 flex-col justify-center">
              <div className="max-w-[34rem]">
                <p className="auth-kicker text-xs font-semibold uppercase tracking-[0.34em] text-sky-200">
                  Career Access Layer
                </p>
                <h1 className="auth-title mt-4 font-black leading-[0.9] text-white">
                  CITS: Training that turns into <span className="auth-title-emphasis">placements.</span>
                </h1>
                <div className="auth-type-shell mt-4" aria-label={`CITS focus: ${heroTypingPhrases[typingIndex]}`}>
                  <span className="auth-type-label">Built for</span>
                  <span className="auth-type-text">{typedText}</span>
                  <span className="auth-type-cursor" aria-hidden="true" />
                </div>
                <p className="auth-copy mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  Career-first training for learners who want structured skills, mentor support, and real interview outcomes.
                </p>
              </div>

              {/* These pills are the easiest place to tweak present/future positioning copy. */}
              <div className="mt-6 flex max-w-[36rem] flex-wrap gap-3">
                {heroHighlights.map((point) => (
                  <div
                    key={point}
                    className="auth-copy-item auth-stagger rounded-full border border-cyan-300/18 bg-slate-950/40 px-4 py-2 text-sm font-medium text-slate-200"
                  >
                    {point}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Right panel owns only form UI; App.jsx owns all auth state transitions and side effects. */}
        <section className="auth-form-panel auth-reveal-panel auth-reveal-panel-delay relative rounded-[2rem] border border-white/10 px-5 py-5 shadow-2xl shadow-sky-950/30 sm:px-6 sm:py-6 lg:px-7 lg:py-6">
          <div className="auth-form-shell flex h-full flex-col">
            <div className="auth-form-top space-y-3">
              <div className="auth-form-meta flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  {isSignUp ? 'New Account' : 'Member Access'}
                </p>
                <div className="auth-surface-tag rounded-full border border-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-200">
                  {isSignUp ? 'Ready to register' : 'Fast sign in'}
                </div>
              </div>

              {/* Keep the mode switch at the very top so users can see it immediately. */}
              <div className="auth-toggle grid grid-cols-2 gap-1 rounded-[1.1rem] border border-white/10 p-1">
                <button
                  type="button"
                  disabled={isAuthBusy}
                  onClick={() => onChangeMode('signin')}
                  className={`rounded-[0.9rem] px-4 py-3 text-sm font-semibold transition ${
                    !isSignUp ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  disabled={isAuthBusy}
                  onClick={() => onChangeMode('signup')}
                  className={`rounded-[0.9rem] px-4 py-3 text-sm font-semibold transition ${
                    isSignUp ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <div className="auth-form-copy max-w-md">
                <h2 className="text-[1.8rem] font-black leading-none text-white sm:text-[2rem]">
                  {isSignUp ? 'Create account' : 'Welcome back'}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {isSignUp
                    ? 'Create your learner account and continue into the main website.'
                    : 'Use your email and password to continue.'}
                </p>
              </div>

              {/* This block documents the active auth provider for the current build. */}
              <div className="auth-trust-strip rounded-[1.15rem] border border-emerald-400/20 px-4 py-3">
                <div className="flex items-start gap-3">
                  <span className="auth-trust-icon mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-300/20 text-emerald-200">
                    <TrustShieldIcon />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200">
                      Firebase Authentication
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      Secure sign-in and account creation powered by Firebase on Google infrastructure.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={onSubmit} className="mt-4 flex flex-1 flex-col gap-3">
              <div className="auth-form-stage flex flex-1 flex-col rounded-[1.45rem] border border-white/10 px-4 py-4 sm:px-5 sm:py-5">
                {/* Add any future production-only fields here, then validate them in App.jsx. */}
                {/* Sign-up needs an extra name field, while sign-in stays more compact. */}
                <div className={`grid gap-3 ${isSignUp ? 'sm:grid-cols-2' : ''}`}>
                  {isSignUp && (
                    <label className="auth-input-wrap block rounded-[1.2rem] border border-white/10 px-4 pb-3 pt-3">
                      <span className="auth-input-label block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Full Name
                      </span>
                      <input
                        type="text"
                        name="name"
                        value={authForm.name}
                        onChange={onFieldChange}
                        placeholder="Your full name"
                        className="auth-input-field mt-2 w-full text-slate-100 outline-none transition"
                      />
                    </label>
                  )}

                  <label className="auth-input-wrap block rounded-[1.2rem] border border-white/10 px-4 pb-3 pt-3">
                    <span className="auth-input-label block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Email
                    </span>
                    <input
                      type="email"
                      name="email"
                      value={authForm.email}
                      onChange={onFieldChange}
                      placeholder="you@example.com"
                      className="auth-input-field mt-2 w-full text-slate-100 outline-none transition"
                    />
                  </label>
                </div>

                <div className={`mt-3 grid gap-3 ${isSignUp ? 'sm:grid-cols-2' : ''}`}>
                  <label className="auth-input-wrap block rounded-[1.2rem] border border-white/10 px-4 pb-3 pt-3">
                    <span className="auth-input-label block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Password
                    </span>
                    <input
                      type="password"
                      name="password"
                      value={authForm.password}
                      onChange={onFieldChange}
                      placeholder="Enter your password"
                      className="auth-input-field mt-2 w-full text-slate-100 outline-none transition"
                    />
                  </label>

                  {isSignUp && (
                    <label className="auth-input-wrap block rounded-[1.2rem] border border-white/10 px-4 pb-3 pt-3">
                      <span className="auth-input-label block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Confirm Password
                      </span>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={authForm.confirmPassword}
                        onChange={onFieldChange}
                        placeholder="Repeat password"
                        className="auth-input-field mt-2 w-full text-slate-100 outline-none transition"
                      />
                    </label>
                  )}
                </div>

                {/* Inline feedback is shared by local validation and Firebase responses from App.jsx. */}
                {(authError || authMessage) && (
                  <p
                    className={`mt-3 rounded-[1.2rem] border px-4 py-3 text-sm ${
                      authError
                        ? 'border-rose-400/30 bg-rose-500/10 text-rose-200'
                        : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                    }`}
                  >
                    {authError || authMessage}
                  </p>
                )}

                {/* Button text stays route-driven, so future auth modes should be added through authMode. */}
                <div className="auth-actions mt-auto grid gap-3 pt-3">
                  <button
                    type="submit"
                    disabled={isAuthBusy}
                    className="auth-primary-button rounded-[1.2rem] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
                  >
                    {isAuthBusy ? (isSignUp ? 'Creating...' : 'Signing In...') : (isSignUp ? 'Create Account' : 'Sign In')}
                  </button>
                </div>

                <p className="mt-2 text-center text-xs text-slate-400">
                  Secure email and password flow powered by Firebase, backed by Google.
                </p>
              </div>

              <p className="text-center text-[11px] uppercase tracking-[0.24em] text-slate-500">
                Secure sign-in for learners, batches, and placement support.
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  )
}
