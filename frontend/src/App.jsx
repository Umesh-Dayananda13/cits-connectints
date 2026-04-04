import { Suspense, lazy, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { defaultSiteContent } from './content/siteContent'
import AuthScreen from './components/AuthScreen'
import PaymentModal from './components/PaymentModal'
import './index.css'
import { auth, firebaseConfigIssue, isFirebaseConfigured } from './firebase'
import { subscribeSiteContent } from './services/siteContent'
import { getUserPurchases, verifyPayment } from './services/payment'
import { saveUserProfile } from './services/userProfiles'

const AdminPanel = lazy(() => import('./components/AdminPanel'))
const ChatbotWidget = lazy(() => import('./components/ChatbotWidget'))

// Main frontend shell.
// Owns:
// - auth routing (/login, /signup, /home, /admin)
// - Firebase Auth session handling
// - Firestore content subscription for the public site and chatbot
// - admin route gating by configured email list

// Current use: static course cards for the home page catalog.
// Future production change: replace this array with CMS, backend, or Firestore content.
const _courses = [
  {
    fee: '69999',
    title: 'Oracle EBS by CITS',
    image: '/images/oracle.jpeg',
    tagline: 'Learn. Practice. Get Placed.',
  },
  {
    fee: '1999',
    title: 'Versant Mock Test Practice by CITS',
    image: '/images/versant.png',
  },
  { fee: '34999', title: 'Quality Analyst', image: '/images/quality.png' },
  { fee: '34999', title: 'ServiceNow by CITS', image: '/images/service-now.png' },
  { fee: '34999', title: 'Incident Management', image: '/images/incident-management.png' },
]

// Current use: hard-coded brand proof points in the About section.
// Future production change: connect these values to verified reporting before publishing live metrics.
const _impactStats = [
  { label: 'Students Guided', value: '1000+' },
  { label: 'Live Sessions', value: '250+' },
  { label: 'Mentor Support', value: '1:1 Access' },
  { label: 'Industry Projects', value: 'Real Case Studies' },
]

// Current use: shared bullet copy under every course card.
// Future production change: move this into each course record if different tracks need different benefits.
const _courseIncludes = [
  'Live instructor-led classes',
  'Interview preparation with mock rounds',
  'Resume and LinkedIn optimization',
  'Hands-on assignments with feedback',
]

// Current use: placeholder batch information for the upcoming-batches section.
// Future production change: replace with real batch schedules, dates, and enrollment status.
const _upcomingBatches = [
  { track: 'Oracle EBS by CITS', mode: 'Online Live', duration: '12 Weeks' },
  { track: 'Versant Mock Test Practice by CITS', mode: 'Online Live', duration: '4 Weeks' },
  { track: 'Quality Analyst', mode: 'Online Live', duration: '10 Weeks' },
  { track: 'ServiceNow by CITS', mode: 'Online Live', duration: '12 Weeks' },
  { track: 'Incident Management', mode: 'Online Live', duration: '10 Weeks' },
]

// Current use: manual certificate verification instructions.
// Future production change: replace with an automated verification form or backend lookup flow.
const _verificationSteps = [
  'Send your certificate ID to connectints1@gmail.com',
  'Include your full name and course name in the email',
  'Our team validates your record and responds with confirmation',
]

// Current use: placeholder blog cards to hold layout space.
// Future production change: source these from a CMS, markdown pipeline, or backend blog API.
const _blogPreviews = [
  {
    title: 'How to Prepare for ServiceNow Interviews in 30 Days',
    summary: 'A focused roadmap with weekly goals, practical exercises, and mock interview checkpoints.',
  },
  {
    title: 'Incident Management Career Path: Beginner to Pro',
    summary: 'Understand roles, salary trends, and the skills required to move from fresher to specialist.',
  },
  {
    title: 'Top Portfolio Projects to Prove Your ITSM Skills',
    summary: 'Project ideas that demonstrate troubleshooting, process design, and business impact.',
  },
]

// Current use: static enrollment journey content for the roadmap section.
// Future production change: keep this array as the single edit point if enrollment steps or channels change.
const _roadmapSteps = [
  {
    number: '1',
    title: 'Get Started',
    description: 'Kick off your journey by sending us a message on WhatsApp at +91 6303545766 and say Hi to begin.',
    icon: '💬',
    accent: 'from-fuchsia-400 to-violet-500',
  },
  {
    number: '2',
    title: 'Choose Your Course',
    description: 'Browse our course catalog and pick the one that matches your learning goals and interests.',
    icon: '📘',
    accent: 'from-violet-400 to-purple-500',
  },
  {
    number: '3',
    title: 'Submit Your Request',
    description: 'Fill out and submit your course application or select the course you are interested in.',
    icon: '📝',
    accent: 'from-sky-400 to-cyan-500',
  },
  {
    number: '4',
    title: 'Receive Enrollment Guidance',
    description: 'Get detailed instructions to smoothly navigate through the enrollment process.',
    icon: '⚙️',
    accent: 'from-cyan-400 to-blue-500',
  },
  {
    number: '5',
    title: 'Join Live Classes',
    description: 'Participate in interactive sessions led by experienced instructors and start building your skills.',
    icon: '▶️',
    accent: 'from-pink-400 to-fuchsia-500',
  },
]

// Current use: local placement showcase cards for social proof.
// Future production change: connect this to approved placement records with optional filtering by course/batch.
const _placedStudents = [
  {
    name: 'S Gowtham',
    role: 'Process Executive to Associate',
    company: 'NTT DATA',
    package: 'Role Upgrade',
    batch: '2026',
    personImage: '/images/gowtham.jpeg',
    companyImage: '/images/NTT%20DATA.jpeg',
  },
  {
    name: 'Ayeesha',
    role: 'Executive to IT Support Engineer',
    company: 'Wipro',
    package: 'Role Upgrade',
    batch: '2026',
    personImage: '/images/ayeesha.jpeg',
    companyImage: '/images/wipro.jpeg',
  },
  {
    name: 'Rahul Verma',
    role: 'Incident Management Executive',
    company: 'CloudBridge Support',
    package: '4.2 LPA',
    batch: 'Mar 2026',
    personImage: '/images/tharun.png',
    companyImage: '/images/logo-cits.svg',
  },
]

// Current use: one-page navigation and footer quick links.
// Future production change: keep section IDs in sync here if routes or section names change.
const _navItems = [
  { label: 'Courses', href: '#courses' },
  { label: 'About Us', href: '#about-us' },
  { label: 'Founder & Co-Founder', href: '#leadership' },
  { label: 'Placed Students', href: '#placed-students' },
  { label: 'Roadmap', href: '#roadmap' },
  { label: 'Upcoming Batches', href: '#upcoming-batches' },
  { label: 'Verify Your Certificate', href: '#verify-certificate' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Blogs', href: '#blogs' },
]

const _whatsappNumber = '916303545755'
const _contactEmail = 'connectints1@gmail.com'
const _primaryPhone = '+91 6303545755'
const _alternatePhone = '+91 8247097984'
const _supportHours = 'Mon-Sat | 9:00 AM to 7:00 PM'

// Small reusable icon component for founder and company social links.
const InstagramIcon = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm8.5 1.5h-8.5A4.25 4.25 0 0 0 3.5 7.75v8.5a4.25 4.25 0 0 0 4.25 4.25h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5a4.25 4.25 0 0 0-4.25-4.25ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Zm5.25-.88a1.12 1.12 0 1 1 0 2.24 1.12 1.12 0 0 1 0-2.24Z" />
  </svg>
)

// Current use: lightweight client-side search that jumps to page sections.
// Future production change: extend keywords here or swap to a real search index without changing the UI.
const _searchTargets = [
  { id: 'courses', label: 'Courses', keywords: ['course', 'servicenow', 'oracle', 'versant', 'incident', 'quality', 'qa', 'quality analyst'] },
  { id: 'about-us', label: 'About Us', keywords: ['about', 'cits', 'story', 'mission'] },
  { id: 'leadership', label: 'Founder & Co-Founder', keywords: ['founder', 'cofounder', 'leadership', 'tharun', 'surya'] },
  { id: 'placed-students', label: 'Placed Students', keywords: ['placed', 'placement', 'students', 'hired', 'job'] },
  { id: 'roadmap', label: 'Roadmap', keywords: ['roadmap', 'steps', 'enroll', 'enrollment', 'skill development'] },
  { id: 'upcoming-batches', label: 'Upcoming Batches', keywords: ['batch', 'upcoming', 'enrollment'] },
  { id: 'verify-certificate', label: 'Verify Your Certificate', keywords: ['verify', 'certificate', 'validation'] },
  { id: 'faq', label: 'FAQ', keywords: ['faq', 'questions', 'help', 'support', 'how'] },
  { id: 'blogs', label: 'Blogs', keywords: ['blog', 'insights', 'career'] },
]

// Current use: translate Firebase Auth errors into user-facing copy.
// Future production change: centralize this with localization if the app adds more auth providers or languages.
const firebaseAuthMessages = {
  'auth/email-already-in-use': 'This email is already in use.',
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/too-many-requests': 'Too many attempts. Try again later.',
  'auth/user-not-found': 'No account found with this email. Please check and try again.',
  'auth/weak-password': 'Password must be stronger: 8+ chars, uppercase, lowercase, number, and special character.',
}

// Keep message mapping separate so auth handlers stay focused on control flow.
const getFirebaseAuthMessage = (error) => (
  firebaseAuthMessages[error?.code] || 'Authentication failed. Please try again.'
)

// Formats rule lists into human-readable UI messages.
// Example: ["A", "B", "C"] -> "A, B, and C"
const formatRuleList = (items) => {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

// Returns unmet password requirements for create-account validation.
// Future production change: keep this as the single source of truth if password policy changes.
const getPasswordRuleFailures = (password) => {
  const failures = []

  if (password.length < 8) failures.push('at least 8 characters')
  if (!/[a-z]/.test(password)) failures.push('one lowercase letter')
  if (!/[A-Z]/.test(password)) failures.push('one uppercase letter')
  if (!/[0-9]/.test(password)) failures.push('one number')
  if (!/[^A-Za-z0-9]/.test(password)) failures.push('one special character')

  return failures
}

const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean)

const areAdminEmailsConfigured = adminEmails.length > 0
const isAdminEmail = (email) => adminEmails.includes((email || '').trim().toLowerCase())

// Normalize names derived from email prefixes until richer member profiles exist.
const formatMemberName = (value) => (
  value
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
)

// Current use: derive a friendly greeting for the navbar and hero.
// Future production change: prefer backend or profile-stored names when member records become richer.
const getMemberName = (user) => {
  const displayName = user?.displayName?.trim()
  if (displayName) return displayName

  const emailPrefix = user?.email?.split('@')[0]?.trim()
  return emailPrefix ? formatMemberName(emailPrefix) : 'Member'
}

// Loads course-purchase records from both uid and legacy email-based paths.
// This keeps older purchase records visible during uid/email migration.
const loadPurchasesForUser = async (user) => {
  const primaryLookupId = user?.uid || ''
  const legacyEmailLookupId = user?.email?.trim().toLowerCase() || ''

  let mergedPurchases = {}

  if (primaryLookupId) {
    try {
      const purchases = await getUserPurchases(primaryLookupId)
      if (purchases && typeof purchases === 'object') {
        mergedPurchases = { ...mergedPurchases, ...purchases }
      }
    } catch (error) {
      console.error(`Failed to load purchases for ${primaryLookupId}:`, error)
    }
  }

  // Legacy email fallback: run only when different from uid to avoid duplicate calls.
  // Permission failures here are expected in stricter rules, so keep this silent.
  if (legacyEmailLookupId && legacyEmailLookupId !== primaryLookupId) {
    try {
      const purchases = await getUserPurchases(legacyEmailLookupId, { silent: true })
      if (purchases && typeof purchases === 'object') {
        mergedPurchases = { ...mergedPurchases, ...purchases }
      }
    } catch {
      // No-op by design.
    }
  }

  return mergedPurchases
}

// Protects UI cards when CMS image URLs are missing/deleted after deployment.
// Current use: course, leadership, and placement image fallbacks.
// Future production change: migrate to a shared <SafeImage/> component if fallback rules grow.
const applyImageFallback = (event, fallbackSrc) => {
  const target = event.currentTarget
  if (!target || target.dataset.fallbackApplied === 'true') return

  target.dataset.fallbackApplied = 'true'
  target.src = fallbackSrc
}

// Reused loader for auth gating and protected home entry.
// Future production change: this is the place to connect branded loading states or skeletons.
function LoadingScreen({ label, detail }) {
  return (
    <div className="loader-screen">
      <div className="loader-orbit" aria-hidden="true">
        <span className="loader-ring loader-ring-outer" />
        <span className="loader-ring loader-ring-middle" />
        <span className="loader-ring loader-ring-inner" />
        <span className="loader-core" />
        <span className="loader-dot loader-dot-one" />
        <span className="loader-dot loader-dot-two" />
      </div>
      <div className="loader-copy">
        <p className="loader-text">{label}</p>
        <p className="loader-detail">{detail}</p>
      </div>
    </div>
  )
}


function App() {
  // Signed-in users come from Firebase auth state.
  const navigate = useNavigate()
  const location = useLocation()
  const [accessMode, setAccessMode] = useState('')
  // Keep auth form state in this parent so AuthScreen remains a pure UI component.
  // Future production change: add fields for MFA, profile metadata, invite codes, or terms here.
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [resetEmail, setResetEmail] = useState('')
  const [isVerificationPending, setIsVerificationPending] = useState(false)
  const [unverifiedUserEmail, setUnverifiedUserEmail] = useState('')
  const [unverifiedUserData, setUnverifiedUserData] = useState(null)
  const [authError, setAuthError] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [isAuthReady, setIsAuthReady] = useState(!isFirebaseConfigured)
  const [isAuthBusy, setIsAuthBusy] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [memberName, setMemberName] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFeedback, setSearchFeedback] = useState('')
  const [siteContent, setSiteContent] = useState(defaultSiteContent)
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [isRefundPolicyExpanded, setIsRefundPolicyExpanded] = useState(false)
  const [expandedFaqItems, setExpandedFaqItems] = useState({})

  // Toggle FAQ item expansion
  const toggleFaqItem = (index) => {
    setExpandedFaqItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const [userPurchases, setUserPurchases] = useState({})
  // Current routing keeps auth on /login and /signup, with the protected site on /home.
  // Future production change: expand this route-driven mode if onboarding or member dashboards split out.
  const isForgotPasswordPath = location.pathname === '/forgot-password'
  const authMode = isForgotPasswordPath ? 'forgot-password' : location.pathname === '/signup' ? 'signup' : 'signin'
  const homeAccessLabel = 'Member Access'
  const homeVisitorLabel = `Welcome, ${memberName || 'Member'}`
  const isAdmin = areAdminEmailsConfigured && isAdminEmail(currentUser?.email)
  // Everything below is the public site data source. /admin writes to Firestore,
  // subscribeSiteContent reads that same document, and /home renders from it here.
  const {
    about,
    authPageContent,
    blogPreviews: siteBlogPreviews,
    contact,
    courseIncludes: siteCourseIncludes,
    courses: siteCourses,
    faqItems,
    footer,
    impactStats: siteImpactStats,
    leadershipMembers,
    navItems: siteNavItems,
    placedStudents: sitePlacedStudents,
    referralBanner,
    roadmapSteps: siteRoadmapSteps,
    searchTargets: siteSearchTargets,
    upcomingBatches: siteUpcomingBatches,
    verificationSteps: siteVerificationSteps,
  } = siteContent
  const {
    alternatePhone,
    email: contactEmail,
    phone: primaryPhone,
    supportHours,
    whatsappNumber,
  } = contact

  // Firebase becomes the source of truth for signed-in users after configuration is present.
  // Future production change: fetch roles, profile data, or onboarding status in this callback.
  useEffect(() => {
    if (!auth || !isFirebaseConfigured) {
      setIsAuthReady(true)
      return undefined
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user)
        setAccessMode('member')
        setMemberName(getMemberName(user))
      } else {
        setCurrentUser(null)
        setAccessMode('')
        setMemberName('')
      }

      setIsAuthReady(true)
    })

    return unsubscribe
  }, [])

  // Firestore now acts as the shared content source for both the page and the chatbot.
  // Future production change: move admin editing into the app so this subscription stays the only read path.
  useEffect(() => {
    if (!isAuthReady) return undefined

    if (!currentUser) {
      setSiteContent(defaultSiteContent)
      return undefined
    }

    const unsubscribe = subscribeSiteContent(
      (nextContent) => setSiteContent(nextContent),
      (error) => console.error('Firestore site content sync failed', error),
    )

    return unsubscribe
  }, [currentUser, isAuthReady])

  // Auto-detect email verification and redirect when verified
  // This checks the verification status periodically and when the page regains focus
  useEffect(() => {
    if (!isVerificationPending || !auth || !unverifiedUserData) {
      return undefined
    }

    // Function to check verification status and redirect if verified
    const checkAndNavigateIfVerified = async () => {
      try {
        // Refresh the unverified user's verification status from Firebase
        await unverifiedUserData.reload()

        if (unverifiedUserData.emailVerified) {
          // Email is now verified - sign in the user
          try {
            const userCredential = await signInWithEmailAndPassword(
              auth,
              unverifiedUserData.email,
              authForm.password,
            )

            // User is now authenticated and verified
            setIsVerificationPending(false)
            setUnverifiedUserEmail('')
            setUnverifiedUserData(null)
            setAccessMode('member')
            setMemberName(getMemberName(userCredential.user))
            navigate('/home')
          } catch (loginError) {
            console.error('Failed to auto-login after verification:', loginError)
            // Navigation will happen when user manually signs in
          }
        }
      } catch (error) {
        console.error('Failed to check email verification status:', error)
      }
    }

    // Check immediately when this effect runs
    checkAndNavigateIfVerified()

    // Check every 2 seconds while verification is pending
    const interval = setInterval(checkAndNavigateIfVerified, 2000)

    // Also check when the page regains focus (user might have verified in another tab)
    const handleFocus = () => {
      checkAndNavigateIfVerified()
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [isVerificationPending, unverifiedUserData, navigate, auth, authForm.password])

  // Keep field editing local so the auth form feels responsive before any network request is made.
  const handleAuthFieldChange = (event) => {
    const { name, value } = event.target
    setAuthForm((prev) => ({ ...prev, [name]: value }))
    if (authError) setAuthError('')
    if (authMessage) setAuthMessage('')
  }

  // Current production scope is email/password auth.
  // Future production change: add provider sign-in, email verification, or MFA from this handler
  // so all auth side effects continue living in one place.
  const handleAuthSubmit = async (event) => {
    event.preventDefault()

    const email = authForm.email.trim()
    const password = authForm.password.trim()

    if (!email || !password) {
      setAuthError('Email and password are required.')
      return
    }

    if (!auth || !isFirebaseConfigured) {
      setAuthError(firebaseConfigIssue || 'Firebase is not configured.')
      return
    }

    if (authMode === 'signup') {
      if (!authForm.name.trim()) {
        setAuthError('Full name is required.')
        return
      }

      const phoneDigits = authForm.phone.replace(/\D/g, '')
      if (!authForm.phone.trim()) {
        setAuthError('Phone number is required.')
        return
      }

      if (phoneDigits.length < 7) {
        setAuthError('Enter a valid phone number.')
        return
      }

      // Keep one validation function so UI and backend policy remain consistent.
      const passwordRuleFailures = getPasswordRuleFailures(password)
      if (passwordRuleFailures.length > 0) {
        setAuthError(`Password must include ${formatRuleList(passwordRuleFailures)}.`)
        return
      }

      if (password !== authForm.confirmPassword.trim()) {
        setAuthError('Passwords do not match.')
        return
      }
    }

    setIsAuthBusy(true)
    setAuthError('')
    setAuthMessage('')

    try {
      if (authMode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const trimmedName = authForm.name.trim()
        const trimmedPhone = authForm.phone.trim()
        // For now we only persist a display name in Firebase Auth.
        // Profile data is also persisted through backend /api/user-profile for admin visibility.
        await updateProfile(userCredential.user, { displayName: trimmedName })
        // Save explicit profile fields so admin can view registered users (name/email/phone).
        // Future production change: this can include address, consent flags, or referral metadata.
        try {
          await saveUserProfile({
            email,
            name: trimmedName,
            phone: trimmedPhone,
          })
        } catch (profileError) {
          console.error('Profile save warning (non-blocking):', profileError)
          // Continue anyway - don't fail signup if profile save fails
        }
        
        // Send email verification
        try {
          await sendEmailVerification(userCredential.user)
        } catch (verificationError) {
          console.error('Failed to send verification email:', verificationError)
        }
        
        // Sign out immediately - user must verify email first before accessing the platform
        try {
          await signOut(auth)
        } catch (signOutError) {
          console.error('Failed to sign out after signup:', signOutError)
        }
        
        setMemberName(trimmedName)
        setIsVerificationPending(true)
        setUnverifiedUserEmail(email)
        setUnverifiedUserData(userCredential.user)
        setAuthMessage('Account created! A verification email has been sent. Please check your inbox and verify your email. After verification, you can sign in.')
        setAuthError('')
        // Don't navigate - stay on verification screen
        setAccessMode('')
        setCurrentUser(null)
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        
        // Check if email is verified
        if (!userCredential.user.emailVerified) {
          // Sign out immediately - don't allow access without verification
          try {
            await signOut(auth)
          } catch (signOutError) {
            console.error('Failed to sign out:', signOutError)
          }
          
          setIsVerificationPending(true)
          setUnverifiedUserEmail(email)
          setAuthError('Please verify your email before signing in. We sent you a verification link.')
          setAccessMode('')
          setCurrentUser(null)
          setIsAuthBusy(false)
          return
        }
        
        setMemberName(getMemberName(userCredential.user))
        setAuthMessage('Sign-in successful. Opening the main website.')
        setAccessMode('member')
        navigate('/home')
      }
    } catch (error) {
      if (error?.code) {
        setAuthError(getFirebaseAuthMessage(error))
      } else {
        console.error('Auth error:', error)
        setAuthError(error?.message || 'Could not finish account setup. Please try again.')
      }
    } finally {
      setIsAuthBusy(false)
    }
  }

  // Route changes keep the visible auth tab aligned with the URL.
  // Future production change: extend this handler if extra auth routes such as forgot-password are added.
  const handleAuthModeChange = (mode) => {
    if (isAuthBusy) return

    setAuthError('')
    setAuthMessage('')
    setResetEmail('')
    if (mode === 'signup') {
      navigate('/signup')
    } else if (mode === 'forgot-password') {
      navigate('/forgot-password')
    } else {
      navigate('/login')
    }
  }

  // Handle forgot password email submission
  const handleForgotPasswordSubmit = async (event) => {
    event.preventDefault()

    const email = resetEmail.trim()

    if (!email) {
      setAuthError('Email is required.')
      return
    }

    if (!auth || !isFirebaseConfigured) {
      setAuthError(firebaseConfigIssue || 'Firebase is not configured.')
      return
    }

    setIsAuthBusy(true)
    setAuthError('')
    setAuthMessage('')

    try {
      await sendPasswordResetEmail(auth, email)
      setAuthMessage(
        'Password reset email sent! Check your inbox for instructions to reset your password.',
      )
      setResetEmail('')
      // Redirect back to signin after a short delay
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (error) {
      if (error?.code) {
        setAuthError(getFirebaseAuthMessage(error))
      } else {
        setAuthError(error?.message || 'Could not send reset email. Please try again.')
      }
    } finally {
      setIsAuthBusy(false)
    }
  }

  // Handle check verification / resend verification email
  const handleResendVerificationEmail = async () => {
    if (!isVerificationPending || !unverifiedUserEmail) {
      setAuthError('Please create an account first.')
      return
    }

    setIsAuthBusy(true)
    setAuthError('')
    setAuthMessage('')

    try {
      // Try to sign in silently to get updated user state and check verification
      const userCredential = await signInWithEmailAndPassword(auth, unverifiedUserEmail, authForm.password)
      
      // Check if now verified
      if (userCredential.user.emailVerified) {
        // Verified! Keep the user signed in and navigate
        setIsVerificationPending(false)
        setUnverifiedUserEmail('')
        setUnverifiedUserData(null)
        setAccessMode('member')
        setMemberName(getMemberName(userCredential.user))
        setAuthMessage('Email verified! Welcome to CITS.')
        navigate('/home')
        return
      }
      
      // Not verified yet - offer to resend
      await sendEmailVerification(userCredential.user)
      
      // Sign out again to keep user in verification pending state
      await signOut(auth)
      
      setAuthMessage('Verification email resent! Check your inbox and verify your email. After verification, click "Check Verification" again.')
      setAccessMode('')
      setCurrentUser(null)
    } catch (error) {
      if (error?.code === 'auth/too-many-requests') {
        setAuthError('Too many requests. Please try again later.')
      } else if (error?.code === 'auth/invalid-credential') {
        setAuthError('Could not verify credentials. Please check your password.')
      } else {
        setAuthError(error?.message || 'Could not send verification email. Please try again.')
      }
    } finally {
      setIsAuthBusy(false)
    }
  }

  // Logout resets local UI state first, then ends the Firebase session if one exists.
  // Future production change: clear cached profile/role data here as more member data is added.
  const handleLogout = async () => {
    setCurrentUser(null)
    setAccessMode('')
    setMemberName('')
    setAuthError('')
    setAuthMessage('')
    setAuthForm({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
    setMobileMenuOpen(false)

    if (auth && accessMode === 'member') {
      try {
        await signOut(auth)
      } catch (error) {
        console.error('Firebase sign-out failed', error)
      }
    }

    navigate('/login')
  }

  // Handle course enrollment
  const handleEnrollCourse = (course) => {
    if (!currentUser) {
      navigate('/login')
      return
    }
    setSelectedCourse(course)
    setShowPaymentModal(true)
  }

  // Check if user already purchased a course
  const isCoursePurchased = (courseId) => {
    return userPurchases && userPurchases[courseId]
  }

  // Current use: short branded loading delay before the protected home page appears.
  // Future production change: remove or shorten this if real data loading replaces the staged reveal.
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 720)
    return () => clearTimeout(timer)
  }, [])

  // Current use: home-page entrance animation for static sections.
  // Future production change: replace direct DOM queries with component-level refs if this page becomes more dynamic.
  useEffect(() => {
    if (isLoading || !accessMode || location.pathname !== '/home') return

    const nodes = document.querySelectorAll('[data-reveal]')
    if (!nodes.length) return

    nodes.forEach((node, index) => {
      const translateX = index % 2 === 0 ? '-20px' : '20px'
      node.style.setProperty('--reveal-translate-x', translateX)
      node.style.setProperty('--reveal-delay', `${Math.min(index * 60, 360)}ms`)
    })

    if (!('IntersectionObserver' in window)) {
      nodes.forEach((node) => node.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            obs.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -12% 0px' },
    )

    nodes.forEach((node) => observer.observe(node))

    // Failsafe: if observer misses any node, force visibility anyway.
    const visibilityFallback = setTimeout(() => {
      nodes.forEach((node) => node.classList.add('is-visible'))
    }, 1800)

    return () => {
      clearTimeout(visibilityFallback)
      observer.disconnect()
    }
  }, [accessMode, isLoading, location.pathname, siteContent])

  // Current use: make section jumps more obvious after navbar search or keyboard focus.
  // Future production change: revisit this if the page moves from one long route to multiple routed pages.
  useEffect(() => {
    if (isLoading || !accessMode || location.pathname !== '/home') return

    const sectionNodes = Array.from(document.querySelectorAll('main > section'))
    const cleanupHandlers = []
    const accentPalette = ['56 189 248', '34 197 94', '245 158 11', '244 114 182', '168 85 247', '14 165 233']

    sectionNodes.forEach((node, index) => {
      node.classList.add('highlightable-section')
      node.setAttribute('tabindex', '0')
      node.style.setProperty('--section-accent-rgb', accentPalette[index % accentPalette.length])

      const focusSection = () => node.focus()
      node.addEventListener('click', focusSection)
      cleanupHandlers.push(() => node.removeEventListener('click', focusSection))
    })

    return () => {
      cleanupHandlers.forEach((cleanup) => cleanup())
    }
  }, [accessMode, isLoading, location.pathname])

  // Load user purchases when logged in
  useEffect(() => {
    if (!currentUser) {
      setUserPurchases({})
      return
    }

    // Purchases are needed for course cards in /home only.
    // Skipping this on /admin avoids unnecessary purchase API calls there.
    if (location.pathname !== '/home') {
      return
    }

    const loadPurchases = async () => {
      try {
        const purchases = await loadPurchasesForUser(currentUser)
        setUserPurchases(purchases)
      } catch (error) {
        console.error('Failed to load purchases:', error)
      }
    }

    loadPurchases()
  }, [currentUser, location.pathname])

  // Stripe redirects back to /home after payment. Verify the session here and then
  // refresh purchases so both member and admin accounts see updated enrollment state.
  useEffect(() => {
    if (!currentUser || location.pathname !== '/home') return

    const query = new URLSearchParams(location.search)
    const paymentStatus = query.get('payment')
    const sessionId = query.get('sessionId')

    if (paymentStatus !== 'success' || !sessionId) return

    let isCancelled = false
    const finalizePayment = async () => {
      try {
        await verifyPayment({
          sessionId,
          userId: currentUser.uid,
        })
      } catch (error) {
        console.error('Failed to verify payment:', error)
      }

      try {
        const purchases = await loadPurchasesForUser(currentUser)
        if (!isCancelled) {
          setUserPurchases(purchases)
        }
      } catch (error) {
        console.error('Failed to refresh purchases after payment:', error)
      }

      if (!isCancelled) {
        navigate('/home', { replace: true })
      }
    }

    finalizePayment()

    return () => {
      isCancelled = true
    }
  }, [currentUser, location.pathname, location.search, navigate])

  // Current use: keyword-to-section scrolling for the single-page home layout.
  // Future production change: replace with routed search results if content stops living on one page.
  const openSection = (sectionId, label) => {
    const sectionNode = document.getElementById(sectionId)
    if (!sectionNode) {
      setSearchFeedback('Section exists in menu but not found on page.')
      return false
    }

    sectionNode.scrollIntoView({ behavior: 'smooth', block: 'start' })
    sectionNode.focus()
    if (label) setSearchFeedback(`Showing: ${label}`)
    setMobileMenuOpen(false)
    return true
  }

  const handleSearch = (event) => {
    event.preventDefault()
    const query = searchQuery.trim().toLowerCase()

    if (!query) {
      setSearchFeedback('Enter a keyword to search.')
      return
    }

    const matchedTarget = siteSearchTargets.find((target) =>
      target.label.toLowerCase().includes(query) ||
      target.keywords.some((keyword) => keyword.includes(query)),
    )

    if (!matchedTarget) {
      setSearchFeedback(`No section found for "${searchQuery}".`)
      return
    }

    openSection(matchedTarget.id, matchedTarget.label)
  }

  // Route guards wait for Firebase to report the current user before redirecting.
  if (!isAuthReady) {
    return (
      <LoadingScreen
        label="Checking Access"
        detail="Validating your Firebase session and preparing secure entry."
      />
    )
  }

  // AuthScreen stays presentational, while this parent owns behavior and navigation.
  const authPage = (
    <AuthScreen
      authMode={authMode}
      authForm={authForm}
      authError={authError}
      authMessage={authMessage}
      isAuthBusy={isAuthBusy}
      resetEmail={resetEmail}
      isVerificationPending={isVerificationPending}
      unverifiedUserEmail={unverifiedUserEmail}
      heroTypingPhrases={authPageContent.heroTypingPhrases}
      authImpactStats={authPageContent.authImpactStats}
      onChangeMode={handleAuthModeChange}
      onFieldChange={handleAuthFieldChange}
      onResetEmailChange={(value) => setResetEmail(value)}
      onSubmit={handleAuthSubmit}
      onForgotPasswordSubmit={handleForgotPasswordSubmit}
      onResendVerificationEmail={handleResendVerificationEmail}
    />
  )

  const adminPage = isAdmin ? (
    // /admin renders the structured Firestore editor. Saving here updates the same
    // content object later rendered by /home and passed into the chatbot knowledge.
    <Suspense
      fallback={(
        <LoadingScreen
          label="Loading Admin"
          detail="Preparing secure admin tools and content controls."
        />
      )}
    >
      <AdminPanel
        onLogout={handleLogout}
        userEmail={currentUser?.email || ''}
      />
    </Suspense>
  ) : (
    <Navigate to="/home" replace />
  )

  // Current use: render the branded one-page member experience after authentication.
  // Future production change: split this into smaller route components if the site grows beyond one long page.
  const homePage = isLoading ? (
    <LoadingScreen
      label="Loading CITS Experience"
      detail="Bringing in your dashboard, learning tracks, and placement content."
    />
  ) : (
    <div className="page-enter min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {/* Sticky header keeps navigation, search, and logout available on long pages. */}
        <header
          className="site-navbar sticky top-2 z-50 overflow-hidden rounded-2xl border border-cyan-300/25 bg-slate-950 text-slate-100"
        >
          <nav className="flex flex-wrap items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5">
            <a
              href="#about-us"
              className="premium-logo-shell rounded-xl border border-slate-200/70 bg-slate-50/95 p-2 shadow-md shadow-slate-950/30"
            >
              <img
                src="/images/logo-style-4.svg"
                alt="CITS logo with slogan"
                className="premium-logo-image h-11 w-auto max-w-[220px] object-contain sm:h-12 sm:max-w-[260px]"
              />
            </a>

            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav"
              className="ml-auto rounded-full border border-slate-500/70 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300/60 hover:text-cyan-100 lg:hidden"
            >
              {mobileMenuOpen ? 'Close' : 'Menu'}
            </button>

            <form
              onSubmit={handleSearch}
              className="order-3 hidden w-full items-center rounded-full border border-slate-500/60 bg-slate-900 px-4 py-2 lg:order-none lg:ml-2 lg:flex lg:max-w-xs"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value)
                  if (searchFeedback) setSearchFeedback('')
                }}
                placeholder="Search sections"
                className="w-full bg-transparent text-sm text-slate-200 placeholder:text-slate-400 outline-none"
              />
              <button type="submit" className="text-cyan-300" aria-label="Search">
                &#9906;
              </button>
            </form>

            <ul className="hidden items-center gap-1 rounded-full border border-slate-600/70 bg-slate-900 p-1 text-sm font-medium lg:flex">
              {siteNavItems.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="block rounded-full px-3 py-2 text-slate-200 transition hover:bg-cyan-400/15 hover:text-cyan-200"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="ml-auto hidden items-center gap-3 lg:flex">
              <div className="rounded-2xl border border-slate-600/80 bg-slate-900/80 px-4 py-2">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-cyan-200">
                  {homeAccessLabel}
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {homeVisitorLabel}
                </p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  className="rounded-full border border-cyan-300/35 bg-slate-900/80 px-5 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/10"
                >
                  Admin
                </button>
              )}
              <button
                onClick={handleLogout}
                className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-900/40 transition hover:brightness-110"
              >
                Logout
              </button>
            </div>

            {mobileMenuOpen && (
              // Mobile nav mirrors the desktop controls in a stacked layout.
              <div
                id="mobile-nav"
                className="order-4 mt-2 w-full rounded-2xl border border-slate-600/80 bg-slate-900 p-3 lg:hidden"
              >
                <form onSubmit={handleSearch} className="mb-3 flex items-center rounded-full border border-slate-600 bg-slate-950/70 px-3 py-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value)
                      if (searchFeedback) setSearchFeedback('')
                    }}
                    placeholder="Search sections"
                    className="w-full bg-transparent text-sm text-slate-200 placeholder:text-slate-400 outline-none"
                  />
                  <button type="submit" className="text-cyan-300" aria-label="Search">
                    &#9906;
                  </button>
                </form>
                <ul className="space-y-2 text-sm font-medium text-slate-200">
                  {siteNavItems.map((item) => (
                    <li key={item.label}>
                      <a
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 hover:bg-cyan-500/20"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 rounded-2xl border border-slate-600/80 bg-slate-950/80 px-4 py-3">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-cyan-200">
                    {homeAccessLabel}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {homeVisitorLabel}
                  </p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      navigate('/admin')
                    }}
                    className="mt-3 w-full rounded-full border border-cyan-300/35 bg-slate-950/80 px-4 py-2 text-sm font-semibold text-cyan-100"
                  >
                    Admin
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="mt-3 w-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2 text-sm font-semibold text-slate-950"
                >
                  Logout
                </button>
              </div>
            )}
          </nav>
          {searchFeedback && (
            <div className="border-t border-slate-700/60 bg-slate-900/70 px-4 py-2 text-xs text-cyan-200 sm:px-5">
              {searchFeedback}
            </div>
          )}
        </header>

        {/* Brand story and approvals establish trust before users browse offerings. */}
        <section
          id="about-us"
          data-reveal
          className="reveal delay-2 overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/80 shadow-2xl shadow-cyan-900/20"
        >
          <div className="space-y-6 p-6 sm:p-8 lg:p-12">
            <div className="inline-flex items-center gap-3 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-100">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.95)]" />
              {homeVisitorLabel}
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">{about.kicker}</p>
            <h1 className="max-w-4xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-7xl">
              {about.title}
            </h1>
            {about.paragraphs.map((paragraph, index) => (
              <p key={`about-${index}`} className={`max-w-4xl text-base leading-8 sm:text-lg ${index === 0 ? 'text-slate-200' : 'text-slate-300'}`}>
                {paragraph}
              </p>
            ))}
            <div className="flex flex-wrap gap-3 text-xs text-slate-200 sm:text-sm">
              {about.approvals.map((approval, index) => (
                <span key={approval} data-reveal className={`reveal ${index % 4 === 0 ? 'delay-3' : index % 4 === 1 ? 'delay-4' : index % 4 === 2 ? 'delay-5' : 'delay-6'} rounded-full border border-amber-400/70 px-4 py-2`}>
                  {approval}
                </span>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {siteImpactStats.map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-700/80 bg-slate-900/50 p-4">
                  <p className="text-xl font-black text-cyan-300">{item.value}</p>
                  <p className="mt-1 text-sm text-slate-200">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Leadership cards explain who founded CITS and the mission behind it. */}
        <section
          id="leadership"
          data-reveal
          className="reveal delay-3 rounded-2xl border border-slate-700/70 bg-slate-900/60 p-6 sm:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Leadership</p>
          <h3 className="mt-2 text-2xl font-bold text-white">Founder &amp; Co-Founder</h3>
          <p className="mt-3 max-w-3xl text-slate-300">{about.leadershipIntro}</p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {leadershipMembers.map((member, index) => (
              <article
                key={`${member.name}-${index}`}
                data-reveal
                className={`reveal ${index % 2 === 0 ? 'delay-4' : 'delay-5'} overflow-hidden rounded-xl border border-slate-700 bg-slate-950/70`}
              >
                <img
                  src={member.image || '/images/tharun.png'}
                  alt={member.alt || member.name}
                  onError={(event) => applyImageFallback(event, '/images/tharun.png')}
                  className="h-72 w-full object-cover object-top sm:h-80"
                />
                <div className="space-y-2 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                    {member.roleLabel}
                  </p>
                  <h4 className="text-xl font-bold text-white">{member.name}</h4>
                  <div className="mt-3 grid gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3 text-sm text-cyan-100">
                    <p><span className="font-semibold text-cyan-300">Education:</span> {member.education}</p>
                    <p><span className="font-semibold text-cyan-300">Specialization:</span> {member.specialization}</p>
                  </div>
                  <p className="text-sm leading-7 text-slate-200">{member.description}</p>
                  <p className="text-sm italic text-cyan-200">"{member.quote}"</p>
                  {member.instagramUrl && (
                    <p className="pt-1 text-sm">
                      <a
                        className="inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-500/10 p-2 text-cyan-300 transition hover:bg-cyan-500/20"
                        href={member.instagramUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${member.name} Instagram`}
                        title={`${member.name} Instagram`}
                      >
                        <InstagramIcon className="h-5 w-5" />
                      </a>
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Course catalog showcases the current learning tracks and what each includes. */}
        <section
          id="courses"
          data-reveal
          className="reveal delay-4 rounded-2xl border border-slate-700/70 bg-slate-900/60 p-6 sm:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Courses</p>
          <h2 className="mt-2 text-2xl font-bold text-white">CITS Learning Tracks</h2>
          <p className="mt-3 max-w-3xl text-slate-300">
            Each track is designed with structured curriculum, projects, and placement guidance.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {siteCourses.map((course, index) => (
              <div
                key={`${course.title || 'course'}-${index}`}
                data-reveal
                className={`reveal ${index === 0 ? 'delay-5' : 'delay-6'} overflow-hidden rounded-xl border border-slate-600/70 bg-slate-800/70`}
              >
                <div className="flex aspect-[4/5] items-center justify-center bg-slate-900/80 p-3">
                  <img
                    src={course.image}
                    alt={`${course.title} course`}
                    onError={(event) => applyImageFallback(event, '/images/logo-cits.svg')}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="p-4">
                  <p className="text-sm text-slate-300">Course Fee</p>
                  <p className="mt-1 text-2xl font-black text-cyan-300">Rs {course.fee}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{course.title}</p>
                  <div className="mt-4 space-y-2">
                    {siteCourseIncludes.map((item) => (
                      <p key={`${course.title}-${item}`} className="text-sm text-slate-300">
                        - {item}
                      </p>
                    ))}
                  </div>
                  {course.tagline && (
                    <p className="mt-4 text-sm font-semibold text-amber-300">{course.tagline}</p>
                  )}
                  <button
                    onClick={() => handleEnrollCourse({
                      id: `${course.title || 'course'}-${index}`,
                      title: course.title,
                      fee: parseInt(course.fee) || 0,
                    })}
                    disabled={isCoursePurchased(`${course.title || 'course'}-${index}`)}
                    className={`mt-6 w-full rounded-lg px-4 py-3 font-semibold transition ${
                      isCoursePurchased(`${course.title || 'course'}-${index}`)
                        ? 'bg-emerald-500/20 text-emerald-300 cursor-default'
                        : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                    }`}
                  >
                    {isCoursePurchased(`${course.title || 'course'}-${index}`) ? '✓ Enrolled' : 'Enroll Now'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Enrollment roadmap turns the sign-up journey into a visual step-by-step guide. */}
        <section
          id="roadmap"
          data-reveal
          className="reveal delay-5 overflow-hidden rounded-3xl border border-slate-700/70 bg-slate-900/60 p-6 sm:p-8 lg:p-10"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Enrollment Roadmap</p>
          <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">A Roadmap to Skill Development</h2>
          <p className="mt-3 max-w-4xl text-slate-300">
            Follow these simple steps to enroll and start your online learning journey with CITS.
          </p>

          <div className="roadmap-shell mt-8 rounded-2xl border border-slate-700/60 bg-slate-950/60 p-4 sm:p-6">
            <svg className="roadmap-line" viewBox="0 0 1000 220" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="roadmapGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#d946ef" />
                  <stop offset="35%" stopColor="#8b5cf6" />
                  <stop offset="65%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
              <path
                d="M20,165 C180,230 250,20 390,80 C520,140 610,10 740,90 C850,160 930,225 980,135"
                fill="none"
                stroke="url(#roadmapGradient)"
                strokeWidth="8"
                strokeLinecap="round"
              />
            </svg>

            <div className="relative z-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {siteRoadmapSteps.map((step, index) => (
                <article
                  key={step.number}
                  className="roadmap-step rounded-xl border border-slate-700/70 bg-slate-900/80 p-4"
                  style={{ '--step-index': index }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className={`bg-gradient-to-r ${step.accent} bg-clip-text text-5xl font-black leading-none text-transparent`}>
                      {step.number}
                    </p>
                    <span className="grid h-10 w-10 place-items-center rounded-full border border-slate-600 bg-slate-950/80 text-lg">
                      {step.icon}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Batch cards highlight upcoming learning windows for each course track. */}
        <section
          id="upcoming-batches"
          data-reveal
          className="reveal delay-5 rounded-2xl border border-slate-700/70 bg-slate-900/60 p-6 sm:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Upcoming Batches</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Next Enrollment Window</h2>
          <p className="mt-4 max-w-3xl text-slate-200">
            New batch dates will be announced soon. Contact us to receive priority updates for ServiceNow and Incident Management tracks.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {siteUpcomingBatches.map((batch) => (
              <article key={batch.track} className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
                <h3 className="text-lg font-semibold text-white">{batch.track}</h3>
                <p className="mt-2 text-sm text-slate-300">Mode: {batch.mode}</p>
                <p className="text-sm text-slate-300">Duration: {batch.duration}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Placement cards give social proof through learner success stories. */}
        <section
          id="placed-students"
          data-reveal
          className="reveal delay-6 rounded-2xl border border-slate-700/70 bg-slate-900/60 p-6 sm:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Placement Highlights</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Placed Students</h2>
          <p className="mt-3 max-w-3xl text-slate-300">
            Showcase student success stories here. These cards are ready for posting new placement updates.
          </p>
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {sitePlacedStudents.map((student, index) => (
              <article
                key={`${student.name}-${student.company}`}
                data-reveal
                className={`placement-card reveal ${index === 0 ? 'delay-4' : index === 1 ? 'delay-5' : 'delay-6'} rounded-2xl border border-slate-700 bg-slate-950/85 p-5`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={student.personImage || '/images/tharun.png'}
                      alt={`${student.name} profile`}
                      onError={(event) => applyImageFallback(event, '/images/tharun.png')}
                      className="placement-person-image h-20 w-20 rounded-2xl border border-cyan-400/40 bg-slate-900 p-1 object-contain object-center"
                    />
                    <div>
                      <h3 className="text-xl font-bold text-white">{student.name}</h3>
                      <p className="mt-1 text-sm font-medium text-cyan-200">{student.role}</p>
                    </div>
                  </div>
                  <div className="placement-company-shell rounded-xl border border-slate-600/80 bg-white p-1.5">
                    <img
                      src={student.companyImage || '/images/logo-cits.svg'}
                      alt={`${student.company} logo`}
                      onError={(event) => applyImageFallback(event, '/images/logo-cits.svg')}
                      className="h-12 w-20 rounded-lg object-contain"
                    />
                  </div>
                </div>
                <div className="mt-5 space-y-2 text-sm text-slate-300">
                  <p><span className="font-semibold text-slate-200">Company:</span> {student.company}</p>
                  <p><span className="font-semibold text-slate-200">Package:</span> {student.package}</p>
                  <p><span className="font-semibold text-slate-200">Batch:</span> {student.batch}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Referral banner adds a short conversion-focused callout between content sections. */}
        <section
          data-reveal
          className="reveal delay-6 rounded-2xl border border-emerald-400/35 bg-gradient-to-r from-emerald-500/15 via-cyan-500/10 to-sky-500/15 p-5 sm:p-6"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">{referralBanner.kicker}</p>
          <p className="mt-2 text-lg font-semibold text-slate-100">
            {referralBanner.text}
          </p>
        </section>

        {/* Certificate section explains the current manual validation process. */}
        <section
          id="verify-certificate"
          data-reveal
          className="reveal delay-6 rounded-2xl border border-slate-700/70 bg-slate-900/60 p-6 sm:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Certificate Verification</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Verify Your Certificate</h2>
          <p className="mt-4 max-w-3xl text-slate-200">
            Share your certificate ID with our team by email to confirm authenticity and course completion records.
          </p>
          <div className="mt-5 space-y-3">
            {siteVerificationSteps.map((step, index) => (
              <div key={step} className="rounded-lg border border-slate-700 bg-slate-950/60 p-4 text-slate-200">
                <p className="text-sm">
                  <span className="mr-2 font-semibold text-cyan-300">Step {index + 1}:</span>
                  {step}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Blog cards reserve space for future publishing and career content. */}
        <section
          id="blogs"
          data-reveal
          className="reveal delay-6 rounded-2xl border border-slate-700/70 bg-slate-900/60 p-6 sm:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Blogs</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Career Insights</h2>
          <p className="mt-4 max-w-3xl text-slate-200">
            Blog posts are being prepared to cover interview strategies, industry trends, and practical career guidance.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {siteBlogPreviews.map((post) => (
              <article key={post.title} className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
                <h3 className="text-base font-semibold text-white">{post.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{post.summary}</p>
              </article>
            ))}
          </div>
        </section>

        {/* FAQ Section with Collapsible Items */}
        <section
          id="faq"
          data-reveal
          className="reveal delay-6 rounded-2xl border border-slate-700/70 bg-slate-900/60 p-6 sm:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">FAQ</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Frequently Asked Questions</h2>
          <p className="mt-4 max-w-3xl text-slate-200">
            Find answers to common questions about our courses, enrollment, and services.
          </p>

          <div className="mt-8 space-y-4">
            {faqItems.map((item, index) => (
              <button
                key={index}
                onClick={() => toggleFaqItem(index)}
                className={`w-full rounded-xl border px-6 py-4 text-left transition-all duration-200 ${
                  expandedFaqItems[index]
                    ? 'border-cyan-400/60 bg-cyan-950/30 shadow-lg shadow-cyan-950/20'
                    : 'border-slate-700/70 bg-slate-950/40 hover:border-slate-600/80'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-base font-semibold text-white">{item.question}</h3>
                  <span
                    className={`shrink-0 text-xl text-cyan-300 transition-transform duration-300 ${
                      expandedFaqItems[index] ? 'rotate-180' : ''
                    }`}
                  >
                    ▼
                  </span>
                </div>

                {expandedFaqItems[index] && (
                  <p className="mt-4 animate-in fade-in slide-in-from-top-2 text-sm leading-6 text-slate-300">
                    {item.answer}
                  </p>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Footer consolidates contact details, quick links, and the brand message. */}
        <footer
          data-reveal
          className="reveal delay-6 overflow-hidden rounded-3xl border border-cyan-400/25 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/70 p-6 shadow-2xl shadow-cyan-950/30 sm:p-8"
        >
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr_1fr]">
            <div>
              <a
                href="#about-us"
                className="premium-logo-shell inline-flex rounded-xl border border-slate-200/70 bg-slate-50/95 p-2 shadow-md shadow-slate-950/30"
              >
                <img
                  src="/images/logo-style-4.svg"
                  alt="CITS logo"
                  className="premium-logo-image h-10 w-auto max-w-[220px] object-contain"
                />
              </a>
              <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">
                {footer.brandCopy}
              </p>
              <div className="mt-4 inline-flex rounded-full border border-cyan-400/30 bg-slate-900/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                {footer.badgeText}
              </div>
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">Quick Links</p>
              <ul className="mt-4 space-y-3">
                {siteNavItems.map((item) => (
                  <li key={`footer-${item.label}`}>
                    <a
                      href={item.href}
                      className="text-sm text-slate-300 transition hover:text-cyan-200"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">Contact</p>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <p>
                  Email:{' '}
                  <a className="font-semibold text-cyan-200 hover:underline" href={`mailto:${contactEmail}`}>
                    {contactEmail}
                  </a>
                </p>
                <p>
                  Phone:{' '}
                  <a className="font-semibold text-cyan-200 hover:underline" href={`tel:${primaryPhone.replace(/\s+/g, '')}`}>
                    {primaryPhone}
                  </a>
                </p>
                <p>
                  Alternate Phone:{' '}
                  <a className="font-semibold text-cyan-200 hover:underline" href={`tel:${alternatePhone.replace(/\s+/g, '')}`}>
                    {alternatePhone}
                  </a>
                </p>
                <p className="flex items-center gap-3">
                  <span>Founder Insta:</span>
                  <a
                    className="inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-500/10 p-2 text-cyan-200 transition hover:bg-cyan-500/20"
                    href={leadershipMembers[0]?.instagramUrl || 'https://www.instagram.com/tharun_sparkss?igsh=MXA3bDl0NnNpNGx2Yw=='}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Founder Instagram"
                    title="Founder Instagram"
                  >
                    <InstagramIcon className="h-5 w-5" />
                  </a>
                </p>
                <p className="flex items-center gap-3">
                  <span>Co-Founder Insta:</span>
                  <a
                    className="inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-500/10 p-2 text-cyan-200 transition hover:bg-cyan-500/20"
                    href={leadershipMembers[1]?.instagramUrl || 'https://www.instagram.com/sj__surya_?igsh=MTZ1aWJsMWdxa2o5aA=='}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Co-Founder Instagram"
                    title="Co-Founder Instagram"
                  >
                    <InstagramIcon className="h-5 w-5" />
                  </a>
                </p>
                <p>{supportHours}</p>
                <p>{footer.responseTimeNote}</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-3 sm:flex-nowrap">
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110"
                >
                  Chat on WhatsApp
                </a>
                <a
                  href={contact.instagramUrl || 'https://www.instagram.com/connectints?igsh=b2xxNWp3djVxYm9o'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                  aria-label="Follow CITS on Instagram"
                  title="Follow CITS on Instagram"
                >
                  Follow on Instagram
                </a>
              </div>
            </div>
          </div>

          {/* Refund Policy Section - Collapsible Dropdown */}
          <div className="mt-8 border-t border-slate-700/70 pt-8">
            <div className="max-w-4xl">
              <button
                onClick={() => setIsRefundPolicyExpanded(!isRefundPolicyExpanded)}
                className="flex items-center gap-2 transition-all duration-200 hover:opacity-80"
              >
                <h3 className="text-lg font-bold uppercase tracking-[0.18em] text-cyan-300">
                  Returns and Refunds Policy
                </h3>
                <span className={`text-xl text-cyan-300 transition-transform duration-300 ${
                  isRefundPolicyExpanded ? 'rotate-180' : ''
                }`}>
                  ▼
                </span>
              </button>

              {isRefundPolicyExpanded && (
                <div className="animate-in fade-in slide-in-from-top-2 mt-4 space-y-4 text-sm text-slate-300 leading-relaxed">
                  <p className="font-semibold">
                    Thank you for Choosing CITS
                  </p>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-cyan-200 mb-2">Non-tangible irrevocable goods ("Digital products")</h4>
                      <p>
                        We do not issue refunds for non-tangible irrevocable goods ("digital products") once the order is confirmed and the product is sent. In case of refundable you will get in 5 - 7 working days which CITS will confirm in your course.
                      </p>
                    </div>

                    <p>
                      We recommend contacting us for assistance if you experience any issues receiving or downloading our products.
                    </p>

                    <div>
                      <h4 className="font-semibold text-cyan-200 mb-2">Contact us for any issues:</h4>
                      <p>
                        If you have any questions about our Returns and Refunds Policy, please contact us:
                      </p>
                      <p className="mt-2">
                        By email:{' '}
                        <a className="font-semibold text-cyan-200 hover:underline" href="mailto:connectints1@gmail.com">
                          connectints1@gmail.com
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-slate-700/70 pt-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} {footer.copyrightText}</p>
            <p>{footer.builtForText}</p>
          </div>
        </footer>
      </main>

      <Suspense fallback={null}>
        <ChatbotWidget
          memberName={memberName}
          knowledge={{
            blogPreviews: siteBlogPreviews,
            contact: {
              alternatePhone,
              email: contactEmail,
              phone: primaryPhone,
              supportHours,
            },
            courseIncludes: siteCourseIncludes,
            courses: siteCourses,
            impactStats: siteImpactStats,
            placedStudents: sitePlacedStudents,
            upcomingBatches: siteUpcomingBatches,
            verificationSteps: siteVerificationSteps,
            whatsappNumber,
          }}
          onNavigateToSection={openSection}
        />
      </Suspense>

      {/* Floating WhatsApp shortcut stays visible for quick contact from any section. */}
      <a
        href={`https://wa.me/${whatsappNumber}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-900/40 transition hover:scale-105 hover:bg-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
      >
        <svg viewBox="0 0 16 16" className="h-7 w-7" fill="currentColor" aria-hidden="true">
          <path d="M13.601 2.326A7.89 7.89 0 0 0 8.018 0C3.652 0 .1 3.55.1 7.915c0 1.395.365 2.757 1.06 3.958L0 16l4.235-1.11a7.9 7.9 0 0 0 3.783.965h.003c4.366 0 7.918-3.55 7.918-7.916a7.9 7.9 0 0 0-2.338-5.613Zm-5.58 12.193h-.003a6.58 6.58 0 0 1-3.353-.92l-.24-.142-2.514.659.67-2.451-.156-.252a6.56 6.56 0 0 1-1.01-3.498c0-3.63 2.955-6.585 6.588-6.585a6.55 6.55 0 0 1 4.664 1.932 6.56 6.56 0 0 1 1.93 4.654c-.002 3.63-2.958 6.584-6.588 6.584Zm3.61-4.929c-.198-.099-1.173-.579-1.354-.645-.182-.066-.314-.099-.446.1s-.512.645-.628.777c-.116.132-.232.149-.43.05-.198-.1-.836-.308-1.592-.982-.589-.525-.987-1.173-1.103-1.372-.116-.198-.012-.305.087-.404.09-.09.198-.232.297-.347.1-.116.133-.199.199-.331.066-.132.033-.248-.017-.348-.05-.099-.446-1.074-.611-1.47-.161-.387-.326-.334-.446-.34l-.38-.007a.73.73 0 0 0-.529.248c-.182.198-.694.678-.694 1.653 0 .976.711 1.919.81 2.05.099.132 1.399 2.137 3.39 2.996.474.205.843.327 1.132.418.475.151.908.13 1.25.08.381-.057 1.173-.48 1.338-.943.165-.463.165-.86.116-.942-.05-.083-.182-.133-.38-.232Z" />
        </svg>
      </a>
    </div>
  )

  return (
    <>
      {/* Router keeps login, signup, forgot-password, and home addressable in this preview app. */}
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={accessMode === 'member' && currentUser?.emailVerified ? <Navigate to="/home" replace /> : authPage} />
        <Route path="/signup" element={accessMode === 'member' && currentUser?.emailVerified ? <Navigate to="/home" replace /> : authPage} />
        <Route path="/forgot-password" element={accessMode === 'member' && currentUser?.emailVerified ? <Navigate to="/home" replace /> : authPage} />
        <Route path="/home" element={accessMode === 'member' && currentUser?.emailVerified ? homePage : <Navigate to="/login" replace />} />
        <Route path="/admin" element={accessMode === 'member' && currentUser?.emailVerified && isAdmin ? adminPage : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to={accessMode === 'member' && currentUser?.emailVerified ? '/home' : '/login'} replace />} />
      </Routes>

      {/* Payment Modal for course enrollment */}
      {showPaymentModal && selectedCourse && (
        <PaymentModal
          course={selectedCourse}
          userEmail={currentUser?.email || ''}
          userId={currentUser?.uid || ''}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </>
  )
}

export default App
