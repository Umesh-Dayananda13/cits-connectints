import { useEffect, useState } from 'react'
import './index.css'

const courses = [
  { fee: '34999', title: 'ServiceNow by CITS' },
  { fee: '34999', title: 'Incident Management' },
]

const navItems = ['Courses', 'About Us', 'Upcoming Batches', 'Verify Your Certificate', 'Blogs']

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isLoading) return

    const nodes = document.querySelectorAll('[data-reveal]')
    if (!nodes.length) return

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
      { threshold: 0.16, rootMargin: '0px 0px -40px 0px' },
    )

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
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

  return (
    <div className="page-enter min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <header
          data-reveal
          className="reveal delay-1 overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-100 text-slate-900 shadow-xl"
        >
          <nav className="flex flex-wrap items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6">
            <img
              src="/images/logo-style-4.svg"
              alt="CITS logo with slogan"
              className="h-12 w-auto max-w-[220px] object-contain sm:h-14 sm:max-w-[320px]"
            />

            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="ml-auto rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold lg:hidden"
            >
              {mobileMenuOpen ? 'Close' : 'Menu'}
            </button>

            <div className="order-3 flex w-full items-center rounded-md border border-slate-300 bg-white px-3 py-2 lg:order-none lg:ml-2 lg:max-w-sm lg:flex-1">
              <input
                type="text"
                placeholder="Search"
                className="w-full bg-transparent text-sm outline-none"
              />
              <span className="text-indigo-700">&#9906;</span>
            </div>

            <ul className="hidden items-center gap-5 text-sm font-medium lg:flex">
              {navItems.map((item) => (
                <li key={item}>
                  <a href="#" className="transition hover:text-indigo-700">
                    {item}
                  </a>
                </li>
              ))}
            </ul>

            <button className="hidden rounded-md bg-indigo-700 px-6 py-2 text-sm font-semibold text-yellow-300 hover:bg-indigo-800 lg:block">
              Login
            </button>

            {mobileMenuOpen && (
              <div className="order-4 mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 lg:hidden">
                <ul className="space-y-2 text-sm font-medium">
                  {navItems.map((item) => (
                    <li key={item}>
                      <a href="#" className="block rounded-md px-2 py-2 hover:bg-slate-100">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
                <button className="mt-3 w-full rounded-md bg-indigo-700 px-4 py-2 text-sm font-semibold text-yellow-300">
                  Login
                </button>
              </div>
            )}
          </nav>
        </header>

        <section
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
            <div className="flex flex-wrap gap-3 text-xs text-slate-200 sm:text-sm">
              <span data-reveal className="reveal delay-3 rounded-full border border-amber-400/70 px-4 py-2">AICTE Approved</span>
              <span data-reveal className="reveal delay-4 rounded-full border border-amber-400/70 px-4 py-2">ISO 21001:2018</span>
              <span data-reveal className="reveal delay-5 rounded-full border border-amber-400/70 px-4 py-2">Start-up India</span>
              <span data-reveal className="reveal delay-6 rounded-full border border-amber-400/70 px-4 py-2">MSME Registered</span>
            </div>
          </div>
        </section>

        <section
          data-reveal
          className="reveal delay-3 rounded-2xl border border-slate-700/70 bg-slate-900/60 p-6 sm:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Leadership</p>
          <h3 className="mt-2 text-2xl font-bold text-white">Founder &amp; Co-Founder</h3>
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
          data-reveal
          className="reveal delay-4 rounded-2xl border border-slate-700/70 bg-slate-900/60 p-6 sm:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Courses</p>
          <h2 className="mt-2 text-2xl font-bold text-white">CITS Learning Tracks</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {courses.map((course, index) => (
              <div
                key={course.title}
                data-reveal
                className={`reveal ${index === 0 ? 'delay-5' : 'delay-6'} rounded-xl border border-slate-600/70 bg-slate-800/70 p-4`}
              >
                <p className="text-sm text-slate-300">Course Fee</p>
                <p className="mt-1 text-2xl font-black text-cyan-300">Rs {course.fee}</p>
                <p className="mt-2 text-lg font-semibold text-white">{course.title}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          data-reveal
          className="reveal delay-5 rounded-2xl border border-slate-700/70 bg-slate-900/60 p-6 sm:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Contact</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Get In Touch</h2>
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
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
