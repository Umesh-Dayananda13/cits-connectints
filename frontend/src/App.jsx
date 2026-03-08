import { useEffect, useState } from 'react'
import './index.css'

const courses = [
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
  { fee: '34999', title: 'ServiceNow by CITS', image: '/images/service-now.png' },
  { fee: '34999', title: 'Incident Management', image: '/images/incident-management.png' },
]

const impactStats = [
  { label: 'Students Guided', value: '1000+' },
  { label: 'Live Sessions', value: '250+' },
  { label: 'Mentor Support', value: '1:1 Access' },
  { label: 'Industry Projects', value: 'Real Case Studies' },
]

const courseIncludes = [
  'Live instructor-led classes',
  'Interview preparation with mock rounds',
  'Resume and LinkedIn optimization',
  'Hands-on assignments with feedback',
]

const upcomingBatches = [
  { track: 'Oracle EBS by CITS', mode: 'Online Live', duration: '12 Weeks' },
  { track: 'Versant Mock Test Practice by CITS', mode: 'Online Live', duration: '4 Weeks' },
  { track: 'ServiceNow by CITS', mode: 'Online Live', duration: '12 Weeks' },
  { track: 'Incident Management', mode: 'Online Live', duration: '10 Weeks' },
]

const verificationSteps = [
  'Send your certificate ID to connectints1@gmail.com',
  'Include your full name and course name in the email',
  'Our team validates your record and responds with confirmation',
]

const blogPreviews = [
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

const navItems = [
  { label: 'Courses', href: '#courses' },
  { label: 'About Us', href: '#about-us' },
  { label: 'Founder & Co-Founder', href: '#leadership' },
  { label: 'Upcoming Batches', href: '#upcoming-batches' },
  { label: 'Verify Your Certificate', href: '#verify-certificate' },
  { label: 'Blogs', href: '#blogs' },
]

const whatsappNumber = '916303545755'
const searchTargets = [
  { id: 'courses', label: 'Courses', keywords: ['course', 'servicenow', 'oracle', 'versant', 'incident'] },
  { id: 'about-us', label: 'About Us', keywords: ['about', 'cits', 'story', 'mission'] },
  { id: 'leadership', label: 'Founder & Co-Founder', keywords: ['founder', 'cofounder', 'leadership', 'tharun', 'surya'] },
  { id: 'upcoming-batches', label: 'Upcoming Batches', keywords: ['batch', 'upcoming', 'enrollment'] },
  { id: 'verify-certificate', label: 'Verify Your Certificate', keywords: ['verify', 'certificate', 'validation'] },
  { id: 'blogs', label: 'Blogs', keywords: ['blog', 'insights', 'career'] },
]

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFeedback, setSearchFeedback] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isLoading) return

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

    // Failsafe: if observer misses any node, force visibility.
    const visibilityFallback = setTimeout(() => {
      nodes.forEach((node) => node.classList.add('is-visible'))
    }, 1800)

    return () => {
      clearTimeout(visibilityFallback)
      observer.disconnect()
    }
  }, [isLoading])

  useEffect(() => {
    if (isLoading) return

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
  }, [isLoading])

  if (isLoading) {
    return (
      <div className="loader-screen">
        <div className="loader-bars" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <p className="loader-text">Loading CITS Experience</p>
      </div>
    )
  }

  const handleSearch = (event) => {
    event.preventDefault()
    const query = searchQuery.trim().toLowerCase()

    if (!query) {
      setSearchFeedback('Enter a keyword to search.')
      return
    }

    const matchedTarget = searchTargets.find((target) =>
      target.label.toLowerCase().includes(query) ||
      target.keywords.some((keyword) => keyword.includes(query)),
    )

    if (!matchedTarget) {
      setSearchFeedback(`No section found for "${searchQuery}".`)
      return
    }

    const sectionNode = document.getElementById(matchedTarget.id)
    if (!sectionNode) {
      setSearchFeedback('Section exists in menu but not found on page.')
      return
    }

    sectionNode.scrollIntoView({ behavior: 'smooth', block: 'start' })
    sectionNode.focus()
    setSearchFeedback(`Showing: ${matchedTarget.label}`)
    setMobileMenuOpen(false)
  }

  return (
    <div className="page-enter min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <header
          data-reveal
          className="reveal delay-1 sticky top-3 z-40 overflow-hidden rounded-2xl border border-cyan-300/20 bg-slate-950/75 text-slate-100 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl"
        >
          <nav className="flex flex-wrap items-center gap-3 px-4 py-4 sm:gap-4 sm:px-5">
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
              className="order-3 hidden w-full items-center rounded-full border border-slate-500/60 bg-slate-900/70 px-4 py-2 lg:order-none lg:ml-2 lg:flex lg:max-w-xs"
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

            <ul className="hidden items-center gap-1 rounded-full border border-slate-600/60 bg-slate-900/60 p-1 text-sm font-medium lg:flex">
              {navItems.map((item) => (
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

            <button className="hidden rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-900/40 transition hover:brightness-110 lg:block">
              Get Started
            </button>

            {mobileMenuOpen && (
              <div
                id="mobile-nav"
                className="order-4 mt-2 w-full rounded-2xl border border-slate-600/70 bg-slate-900/95 p-3 lg:hidden"
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
                  {navItems.map((item) => (
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
                <button className="mt-3 w-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2 text-sm font-semibold text-slate-950">
                  Get Started
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

        <section
          id="about-us"
          data-reveal
          className="reveal delay-2 overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/80 shadow-2xl shadow-cyan-900/20"
        >
          <div className="space-y-6 p-6 sm:p-8 lg:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">About CITS</p>
            <h1 className="max-w-4xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-7xl">
              More than teaching skills, we build futures.
            </h1>
            <p className="max-w-4xl text-base leading-8 text-slate-200 sm:text-lg">
              CITS was born after interview rejection, struggle, and determination. Instead
              of giving up, the founders built a platform focused on opportunity,
              employability, and practical career growth for students.
            </p>
            <p className="max-w-4xl text-base leading-8 text-slate-300 sm:text-lg">
              Our training model combines concepts, implementation, and career preparation in one flow,
              so students can confidently move from learning to placement readiness.
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-slate-200 sm:text-sm">
              <span data-reveal className="reveal delay-3 rounded-full border border-amber-400/70 px-4 py-2">AICTE Approved</span>
              <span data-reveal className="reveal delay-4 rounded-full border border-amber-400/70 px-4 py-2">ISO 21001:2018</span>
              <span data-reveal className="reveal delay-5 rounded-full border border-amber-400/70 px-4 py-2">Start-up India</span>
              <span data-reveal className="reveal delay-6 rounded-full border border-amber-400/70 px-4 py-2">MSME Registered</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {impactStats.map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-700/80 bg-slate-900/50 p-4">
                  <p className="text-xl font-black text-cyan-300">{item.value}</p>
                  <p className="mt-1 text-sm text-slate-200">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="leadership"
          data-reveal
          className="reveal delay-3 rounded-2xl border border-slate-700/70 bg-slate-900/60 p-6 sm:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Leadership</p>
          <h3 className="mt-2 text-2xl font-bold text-white">Founder &amp; Co-Founder</h3>
          <p className="mt-3 max-w-3xl text-slate-300">
            CITS leadership focuses on practical outcomes, student confidence, and employability-first training.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <article
              data-reveal
              className="reveal delay-4 overflow-hidden rounded-xl border border-slate-700 bg-slate-950/70"
            >
              <img
                src="/images/tharun.png"
                alt="Tharun Kumar"
                className="h-72 w-full object-cover object-top sm:h-80"
              />
              <div className="space-y-2 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                  Founder &amp; CEO
                </p>
                <h4 className="text-xl font-bold text-white">Tharun Kumar</h4>
                <div className="mt-3 grid gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3 text-sm text-cyan-100">
                  <p><span className="font-semibold text-cyan-300">Education:</span> B.Tech in Computer Science Engineering</p>
                  <p><span className="font-semibold text-cyan-300">Specialization:</span> Career mentorship, storytelling, and employability training</p>
                </div>
                <p className="text-sm leading-7 text-slate-200">
                  Founder &amp; CEO. A computer science engineer, storyteller, filmmaker,
                  and mentor who built CITS to create career opportunities.
                </p>
                <p className="text-sm italic text-cyan-200">
                  "I was born in hunger, and I don&apos;t want to see anyone suffer from it."
                </p>
              </div>
            </article>

            <article
              data-reveal
              className="reveal delay-5 overflow-hidden rounded-xl border border-slate-700 bg-slate-950/70"
            >
              <img
                src="/images/surya.jpg"
                alt="Jyothi Prasad Surya"
                className="h-72 w-full object-cover object-top sm:h-80"
              />
              <div className="space-y-2 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                  Co-Founder &amp; CTO
                </p>
                <h4 className="text-xl font-bold text-white">Jyothi Prasad Surya</h4>
                <div className="mt-3 grid gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3 text-sm text-cyan-100">
                  <p><span className="font-semibold text-cyan-300">Education:</span> Engineering background in technology and systems</p>
                  <p><span className="font-semibold text-cyan-300">Specialization:</span> Program design, technical strategy, and student skill development</p>
                </div>
                <p className="text-sm leading-7 text-slate-200">
                  Co-Founder &amp; CTO. A strong contributor who spent sleepless nights
                  shaping ideas and programs aimed at reducing unemployment.
                </p>
                <p className="text-sm italic text-cyan-200">
                  "More than our own lives, we often spoke about unemployment."
                </p>
              </div>
            </article>
          </div>
        </section>

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
            {courses.map((course, index) => (
              <div
                key={course.title}
                data-reveal
                className={`reveal ${index === 0 ? 'delay-5' : 'delay-6'} overflow-hidden rounded-xl border border-slate-600/70 bg-slate-800/70`}
              >
                <div className="flex aspect-[4/5] items-center justify-center bg-slate-900/80 p-3">
                  <img
                    src={course.image}
                    alt={`${course.title} course`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="p-4">
                  <p className="text-sm text-slate-300">Course Fee</p>
                  <p className="mt-1 text-2xl font-black text-cyan-300">Rs {course.fee}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{course.title}</p>
                  <div className="mt-4 space-y-2">
                    {courseIncludes.map((item) => (
                      <p key={`${course.title}-${item}`} className="text-sm text-slate-300">
                        - {item}
                      </p>
                    ))}
                  </div>
                  {course.tagline && (
                    <p className="mt-4 text-sm font-semibold text-amber-300">{course.tagline}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

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
            {upcomingBatches.map((batch) => (
              <article key={batch.track} className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
                <h3 className="text-lg font-semibold text-white">{batch.track}</h3>
                <p className="mt-2 text-sm text-slate-300">Mode: {batch.mode}</p>
                <p className="text-sm text-slate-300">Duration: {batch.duration}</p>
              </article>
            ))}
          </div>
        </section>

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
            {verificationSteps.map((step, index) => (
              <div key={step} className="rounded-lg border border-slate-700 bg-slate-950/60 p-4 text-slate-200">
                <p className="text-sm">
                  <span className="mr-2 font-semibold text-cyan-300">Step {index + 1}:</span>
                  {step}
                </p>
              </div>
            ))}
          </div>
        </section>

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
            {blogPreviews.map((post) => (
              <article key={post.title} className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
                <h3 className="text-base font-semibold text-white">{post.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{post.summary}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          data-reveal
          className="reveal delay-5 rounded-2xl border border-slate-700/70 bg-slate-900/60 p-6 sm:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Contact</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Get In Touch</h2>
          <p className="mt-3 max-w-3xl text-slate-300">
            Reach out for course details, mentoring support, partnership opportunities, and certificate verification queries.
          </p>
          <div className="mt-5 space-y-3 text-slate-200">
            <p>
              Email:{' '}
              <a className="font-semibold text-cyan-300 hover:underline" href="mailto:connectints1@gmail.com">
                connectints1@gmail.com
              </a>
            </p>
            <p>
              Contact Number:{' '}
              <a className="font-semibold text-cyan-300 hover:underline" href="tel:6303545755">
                6303545755
              </a>
            </p>
            <p>Support Hours: Monday to Saturday, 9:00 AM to 7:00 PM</p>
            <p>Response Time: Usually within 24 hours for email queries</p>
          </div>
        </section>

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
                Career-first learning platform focused on practical skills, interview readiness,
                and job outcomes through mentor-led training.
              </p>
              <div className="mt-4 inline-flex rounded-full border border-cyan-400/30 bg-slate-900/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                More than teaching skills, we build futures
              </div>
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">Quick Links</p>
              <ul className="mt-4 space-y-3">
                {navItems.map((item) => (
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
                  <a className="font-semibold text-cyan-200 hover:underline" href="mailto:connectints1@gmail.com">
                    connectints1@gmail.com
                  </a>
                </p>
                <p>
                  Phone:{' '}
                  <a className="font-semibold text-cyan-200 hover:underline" href="tel:6303545755">
                    6303545755
                  </a>
                </p>
                <p>Mon-Sat | 9:00 AM to 7:00 PM</p>
              </div>
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-slate-700/70 pt-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} CITS Connectints. All rights reserved.</p>
            <p>Built for practical learning, verification, and placement outcomes.</p>
          </div>
        </footer>
      </main>

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
}

export default App
