import { useState } from 'react'
import { createCheckoutSession, redirectToCheckout } from '../services/payment'

// Checkout modal for member/admin enrollment payments.
// Current use: hosted Stripe Checkout redirect flow.
// Future production change: add coupon support, tax handling, and payment status UX.
export default function PaymentModal({ course, userEmail, userId, onClose }) {
  // Processing state avoids duplicate session creation.
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')

  const handleCheckout = async () => {
    setIsProcessing(true)
    setError('')

    try {
      // Create checkout session
      const sessionId = await createCheckoutSession({
        courseId: course.id,
        courseTitle: course.title,
        courseFee: course.fee / 100, // Convert from cents to dollars
        userEmail,
        // Persist user identity in Stripe metadata for verifyPayment fallback logic.
        userId,
      })

      // Redirect to Stripe checkout
      await redirectToCheckout(sessionId)
    } catch (err) {
      // Keep modal open and show actionable error for retry.
      setError(err.message || 'Payment process failed. Please try again.')
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-950 p-8 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white"
          disabled={isProcessing}
        >
          ✕
        </button>

        {/* Header */}
        <h2 className="text-2xl font-black text-white mb-2">Enroll in Course</h2>
        <p className="text-sm text-slate-400 mb-6">Complete your enrollment by making a payment</p>

        {/* Course details */}
        <div className="mb-6 space-y-3 rounded-lg border border-cyan-300/18 bg-slate-950/50 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-sky-200">
              Course
            </p>
            <p className="mt-1 text-lg font-bold text-white">{course.title}</p>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-sky-200">
                Fee
              </p>
              <p className="mt-1 text-2xl font-black text-cyan-200">
                ${(course.fee / 100).toFixed(2)}
              </p>
            </div>
            <p className="text-xs text-slate-400">One-time payment</p>
          </div>
        </div>

        {/* Email confirmation */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-slate-400 mb-2">
            Payment will be sent to
          </p>
          <p className="text-sm font-medium text-white break-all">{userEmail}</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3">
            <p className="text-sm text-rose-200">{error}</p>
          </div>
        )}

        {/* Info box */}
        <div className="mb-6 rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3">
          <p className="text-xs text-emerald-200">
            💳 Secure payment powered by Stripe. Your data is encrypted and safe.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 rounded-lg border border-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/5 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCheckout}
            disabled={isProcessing}
            className="flex-1 rounded-lg bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Proceed to Payment'}
          </button>
        </div>

        {/* Footer text */}
        <p className="mt-4 text-center text-[11px] text-slate-500">
          By enrolling, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
