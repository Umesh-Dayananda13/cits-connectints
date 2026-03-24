import { useEffect, useRef, useState } from 'react'
import { defaultSiteContent } from '../content/siteContent'
import {
  deleteSiteImage,
  loadSiteContentOnce,
  saveSiteContent,
  siteContentDocPath,
  uploadSiteImage,
} from '../services/siteContent'
import { getAdminPurchases } from '../services/payment'
import { getAdminUsers } from '../services/userProfiles'

// AdminPanel is the content editor for /admin.
// Used by App.jsx and writes to Firestore document siteContent/main.
// Image uploads go through Cloudinary, then the saved URL/path are stored back in Firestore.

const adminTabs = [
  { id: 'general', label: 'General' },
  { id: 'courses', label: 'Courses' },
  { id: 'placements', label: 'Placements' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'sections', label: 'Sections' },
  { id: 'payments', label: 'Payments' },
  { id: 'users', label: 'Users' },
  { id: 'advanced', label: 'Advanced JSON' },
]

const createEmptyCourse = () => ({
  fee: '',
  image: '',
  imagePath: '',
  tagline: '',
  title: '',
})

const createEmptyPlacement = () => ({
  batch: '',
  company: '',
  companyImage: '',
  companyImagePath: '',
  name: '',
  package: '',
  personImage: '',
  personImagePath: '',
  role: '',
})

const createEmptyLeader = () => ({
  alt: '',
  description: '',
  education: '',
  image: '',
  imagePath: '',
  instagramUrl: '',
  name: '',
  quote: '',
  roleLabel: '',
  specialization: '',
})

const createEmptyStat = () => ({ label: '', value: '' })
const createEmptyNavItem = () => ({ href: '', label: '' })
const createEmptySearchTarget = () => ({ id: '', keywords: [], label: '' })
const createEmptyRoadmapStep = () => ({ accent: '', description: '', icon: '', number: '', title: '' })
const createEmptyBatch = () => ({ duration: '', mode: '', track: '' })
const createEmptyBlog = () => ({ summary: '', title: '' })

const cloneValue = (value) => JSON.parse(JSON.stringify(value))
const toLines = (items) => items.join('\n')
const toLineArray = (value) => value.split('\n').map((item) => item.trim()).filter(Boolean)
const toCommaArray = (value) => value.split(',').map((item) => item.trim()).filter(Boolean)
const findDuplicateValue = (items) => {
  const seen = new Set()

  for (const item of items) {
    if (seen.has(item)) return item
    seen.add(item)
  }

  return ''
}

const formatPurchaseAmount = (amount, currency = 'USD') => {
  const numericAmount = Number(amount)
  if (!Number.isFinite(numericAmount)) return '-'

  const normalizedCurrency = String(currency || 'USD').toUpperCase()

  try {
    return new Intl.NumberFormat('en-US', {
      currency: normalizedCurrency,
      style: 'currency',
    }).format(numericAmount)
  } catch {
    return `${numericAmount} ${normalizedCurrency}`
  }
}

const formatDateTime = (value) => {
  if (!value) return '-'

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) return value

  return parsedDate.toLocaleString()
}

const formatSessionId = (value) => {
  if (!value) return '-'
  if (value.length <= 36) return value

  return `${value.slice(0, 18)}...${value.slice(-10)}`
}

function Field({ label, children, hint }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</span>
      {children}
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </label>
  )
}

function TextInput(props) {
  return (
    <input
      {...props}
      className={`rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 ${props.className || ''}`}
    />
  )
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className={`min-h-28 rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 ${props.className || ''}`}
    />
  )
}

function FileUploadInput({ buttonLabel, isUploading, progress = 0, onFileSelect }) {
  const inputRef = useRef(null)
  const [selectedName, setSelectedName] = useState('')
  const normalizedProgress = Number.isFinite(progress) ? Math.min(100, Math.max(0, progress)) : 0

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          setSelectedName(file?.name || '')
          onFileSelect?.(file)
          event.target.value = ''
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="inline-flex w-fit items-center rounded-full border border-cyan-400/25 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isUploading ? 'Uploading...' : buttonLabel}
      </button>
      <span className="text-xs text-slate-400">
        {selectedName || 'No file selected. Upload starts immediately after selection.'}
      </span>
      {isUploading ? (
        <div className="space-y-1">
          <div
            className="h-2 overflow-hidden rounded-full bg-slate-800"
            role="progressbar"
            aria-label="Image upload progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={normalizedProgress}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-[width] duration-200"
              style={{ width: `${normalizedProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
            <span>Upload Progress</span>
            <span>{normalizedProgress}%</span>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function SectionShell({ title, description, children }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function ItemShell({ title, children, onRemove }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-200">{title}</p>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-full border border-rose-400/25 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20"
          >
            Delete
          </button>
        ) : null}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function AdminPanel({ onLogout, userEmail }) {
  // This screen is rendered only on the /admin route from App.jsx.
  // It edits the shared Firestore document siteContent/main and manages the
  // Cloudinary-backed image fields consumed later by the public /home page.
  const [activeTab, setActiveTab] = useState('general')
  const [contentDraft, setContentDraft] = useState(null)
  const [advancedJson, setAdvancedJson] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveNotice, setSaveNotice] = useState('')
  // Payments tab state. Kept separate from content editor state to avoid coupling
  // CMS save flow with payment-reporting flow.
  const [paymentRecords, setPaymentRecords] = useState([])
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(false)
  const [paymentsError, setPaymentsError] = useState('')
  const [paymentsLoadedOnce, setPaymentsLoadedOnce] = useState(false)
  // Users tab state is isolated so profile reporting does not affect CMS edit lifecycle.
  // Future production change: this can evolve into paginated search/filter state.
  const [userProfiles, setUserProfiles] = useState([])
  const [isUsersLoading, setIsUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState('')
  const [usersLoadedOnce, setUsersLoadedOnce] = useState(false)
  const [uploadProgressByKey, setUploadProgressByKey] = useState({})
  const activeUploadCount = Object.keys(uploadProgressByKey).length
  const isUploadInProgress = activeUploadCount > 0

  useEffect(() => {
    let isMounted = true

    loadSiteContentOnce()
      .then((content) => {
        if (!isMounted) return

        setContentDraft(cloneValue(content))
        setAdvancedJson(JSON.stringify(content, null, 2))
      })
      .catch((error) => {
        console.error('Admin content load failed', error)
        if (isMounted) {
          setContentDraft(cloneValue(defaultSiteContent))
          setAdvancedJson(JSON.stringify(defaultSiteContent, null, 2))
          setSaveNotice('Could not load Firestore content. Loaded local defaults instead.')
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    // Lazy-load payments only when the Payments tab is opened for the first time.
    // Future production change: replace this with paginated/infinite loading.
    if (activeTab !== 'payments' || paymentsLoadedOnce) return undefined

    let isMounted = true
    setIsPaymentsLoading(true)
    setPaymentsError('')

    getAdminPurchases({ limit: 200 })
      .then((records) => {
        if (!isMounted) return
        setPaymentRecords(records)
      })
      .catch((error) => {
        console.error('Admin payments load failed', error)
        if (isMounted) {
          setPaymentsError(error?.message || 'Could not load payment records.')
          setPaymentRecords([])
        }
      })
      .finally(() => {
        if (!isMounted) return
        setIsPaymentsLoading(false)
        setPaymentsLoadedOnce(true)
      })

    return () => {
      isMounted = false
    }
  }, [activeTab, paymentsLoadedOnce])

  useEffect(() => {
    // Lazy-load user profiles only when the Users tab is opened.
    // This avoids unnecessary admin API calls during content-only editing sessions.
    if (activeTab !== 'users' || usersLoadedOnce) return undefined

    let isMounted = true
    setIsUsersLoading(true)
    setUsersError('')

    getAdminUsers({ limit: 500 })
      .then((profiles) => {
        if (!isMounted) return
        setUserProfiles(profiles)
      })
      .catch((error) => {
        console.error('Admin users load failed', error)
        if (isMounted) {
          setUsersError(error?.message || 'Could not load user profiles.')
          setUserProfiles([])
        }
      })
      .finally(() => {
        if (!isMounted) return
        setIsUsersLoading(false)
        setUsersLoadedOnce(true)
      })

    return () => {
      isMounted = false
    }
  }, [activeTab, usersLoadedOnce])

  const syncDraft = (updater) => {
    setContentDraft((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      setAdvancedJson(JSON.stringify(next, null, 2))
      return next
    })
    if (saveNotice) setSaveNotice('')
  }

  const updateRootField = (field, value) => {
    syncDraft((prev) => ({ ...prev, [field]: value }))
  }

  const updateNestedField = (rootKey, field, value) => {
    syncDraft((prev) => ({
      ...prev,
      [rootKey]: {
        ...prev[rootKey],
        [field]: value,
      },
    }))
  }

  const updateArrayItem = (rootKey, index, field, value) => {
    syncDraft((prev) => ({
      ...prev,
      [rootKey]: prev[rootKey].map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      )),
    }))
  }

  const addArrayItem = (rootKey, factory) => {
    syncDraft((prev) => ({
      ...prev,
      [rootKey]: [...prev[rootKey], factory()],
    }))
  }

  const removeArrayItem = async (rootKey, index, imagePathFields = []) => {
    const entry = contentDraft[rootKey][index]

    await Promise.all(
      imagePathFields
        .map((field) => entry?.[field])
        .filter(Boolean)
        .map((filePath) => deleteSiteImage(filePath)),
    )

    syncDraft((prev) => ({
      ...prev,
      [rootKey]: prev[rootKey].filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const handleListChange = (rootKey, value) => {
    updateRootField(rootKey, toLineArray(value))
  }

  const handleNestedListChange = (rootKey, field, value) => {
    updateNestedField(rootKey, field, toLineArray(value))
  }

  const getUploadKey = (rootKey, index, urlField) => `${rootKey}-${index}-${urlField}`

  const setUploadProgress = (uploadKey, progress) => {
    setUploadProgressByKey((prev) => ({
      ...prev,
      [uploadKey]: progress,
    }))
  }

  const clearUploadProgress = (uploadKey) => {
    setUploadProgressByKey((prev) => {
      if (!(uploadKey in prev)) return prev

      const next = { ...prev }
      delete next[uploadKey]
      return next
    })
  }

  const getUploadProgress = (rootKey, index, urlField) => uploadProgressByKey[getUploadKey(rootKey, index, urlField)]

  const handleUpload = async ({ rootKey, index, urlField, pathField, folder, file }) => {
    if (!file) return

    // rootKey/index point to the exact item being edited in the admin form.
    // urlField is what the public site renders, and pathField is what we keep
    // for later Cloudinary cleanup if the image is replaced or deleted.
    const uploadKey = getUploadKey(rootKey, index, urlField)
    const oldPath = contentDraft[rootKey][index]?.[pathField]

    setUploadProgress(uploadKey, 0)
    setSaveNotice('')

    try {
      const { path, url } = await uploadSiteImage(file, folder, {
        onProgress: (progress) => setUploadProgress(uploadKey, progress),
      })
      updateArrayItem(rootKey, index, urlField, url)
      updateArrayItem(rootKey, index, pathField, path)
      setSaveNotice('Image uploaded. Click Save All Changes to publish it on the site.')

      if (oldPath && oldPath !== path) {
        await deleteSiteImage(oldPath)
      }
    } catch (error) {
      console.error('Image upload failed', error)
      setSaveNotice(error instanceof Error ? error.message : 'Image upload failed. Check Cloudinary backend configuration.')
    } finally {
      clearUploadProgress(uploadKey)
    }
  }

  const handleSave = async () => {
    if (isUploadInProgress) {
      setSaveNotice(
        activeUploadCount > 1
          ? 'Wait for all current image uploads to finish before saving.'
          : 'Wait for the current image upload to finish before saving.',
      )
      return
    }

    const missingCourseTitleIndex = contentDraft.courses.findIndex((course) => !course.title?.trim())
    if (missingCourseTitleIndex !== -1) {
      setSaveNotice(`Course ${missingCourseTitleIndex + 1} needs a title before saving.`)
      return
    }

    const duplicateCourseTitle = findDuplicateValue(
      contentDraft.courses
        .map((course) => course.title?.trim().toLowerCase())
        .filter(Boolean),
    )

    if (duplicateCourseTitle) {
      setSaveNotice(`Course title "${duplicateCourseTitle}" is duplicated. Use a unique title so the public list renders correctly.`)
      return
    }

    setIsSaving(true)
    setSaveNotice('')

    try {
      await saveSiteContent(contentDraft)
      setAdvancedJson(JSON.stringify(contentDraft, null, 2))
      setSaveNotice(`Saved to ${siteContentDocPath}.`)
    } catch (error) {
      console.error('Admin save failed', error)
      setSaveNotice('Save failed. Check Firestore rules and admin setup.')
    } finally {
      setIsSaving(false)
    }
  }

  const applyAdvancedJson = () => {
    try {
      const parsed = JSON.parse(advancedJson)
      syncDraft(parsed)
      setSaveNotice('Advanced JSON applied locally. Save to persist.')
    } catch {
      setSaveNotice('JSON is invalid. Fix the syntax before applying.')
    }
  }

  const handleRefreshPayments = () => {
    // Trigger re-fetch by resetting the "loaded" flag.
    if (isPaymentsLoading) return
    setPaymentsLoadedOnce(false)
  }

  const handleRefreshUsers = () => {
    // Trigger user-list re-fetch by clearing the lazy-load flag.
    if (isUsersLoading) return
    setUsersLoadedOnce(false)
  }

  if (isLoading || !contentDraft) {
    return (
      <div className="loader-screen">
        <div className="loader-copy">
          <p className="loader-text">Loading Admin</p>
          <p className="loader-detail">Preparing the site content editor.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/70 p-6 shadow-2xl shadow-cyan-950/30">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Admin Panel</p>
              <h1 className="mt-2 text-3xl font-black text-white">Manage site content and uploads</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">
                This editor saves to Firestore document <span className="font-semibold text-cyan-200">{siteContentDocPath}</span>.
                Uploaded images go to Cloudinary and their URLs are written back into the same content document.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
                Signed in as {userEmail || 'unknown user'}
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || isUploadInProgress}
                className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUploadInProgress
                  ? activeUploadCount > 1
                    ? `Uploading ${activeUploadCount} images...`
                    : 'Uploading image...'
                  : isSaving
                    ? 'Saving...'
                    : 'Save All Changes'}
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="rounded-full border border-slate-700 bg-slate-900/80 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-300/60 hover:text-cyan-100"
              >
                Logout
              </button>
            </div>
          </div>

          {saveNotice ? (
            <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
              {saveNotice}
            </div>
          ) : null}
        </header>

        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
            <nav className="space-y-2">
              {adminTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                    activeTab === tab.id
                      ? 'bg-cyan-400 text-slate-950'
                      : 'bg-slate-950/70 text-slate-200 hover:border-cyan-300/40 hover:text-cyan-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="space-y-6">
            {activeTab === 'general' ? (
              <>
                <SectionShell
                  title="Contact and Footer"
                  description="Manage the contact details used in the footer, chatbot, and WhatsApp shortcuts."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Email">
                      <TextInput value={contentDraft.contact.email} onChange={(event) => updateNestedField('contact', 'email', event.target.value)} />
                    </Field>
                    <Field label="Phone">
                      <TextInput value={contentDraft.contact.phone} onChange={(event) => updateNestedField('contact', 'phone', event.target.value)} />
                    </Field>
                    <Field label="Alternate Phone">
                      <TextInput value={contentDraft.contact.alternatePhone} onChange={(event) => updateNestedField('contact', 'alternatePhone', event.target.value)} />
                    </Field>
                    <Field label="WhatsApp Number" hint="Numbers only, without spaces or plus sign.">
                      <TextInput value={contentDraft.contact.whatsappNumber} onChange={(event) => updateNestedField('contact', 'whatsappNumber', event.target.value)} />
                    </Field>
                    <Field label="Support Hours">
                      <TextInput value={contentDraft.contact.supportHours} onChange={(event) => updateNestedField('contact', 'supportHours', event.target.value)} />
                    </Field>
                    <Field label="Response Time Note">
                      <TextInput value={contentDraft.footer.responseTimeNote} onChange={(event) => updateNestedField('footer', 'responseTimeNote', event.target.value)} />
                    </Field>
                  </div>
                  <div className="grid gap-4">
                    <Field label="Footer Brand Copy">
                      <TextArea value={contentDraft.footer.brandCopy} onChange={(event) => updateNestedField('footer', 'brandCopy', event.target.value)} />
                    </Field>
                    <Field label="Footer Badge Text">
                      <TextInput value={contentDraft.footer.badgeText} onChange={(event) => updateNestedField('footer', 'badgeText', event.target.value)} />
                    </Field>
                    <Field label="Footer Bottom Line">
                      <TextInput value={contentDraft.footer.builtForText} onChange={(event) => updateNestedField('footer', 'builtForText', event.target.value)} />
                    </Field>
                  </div>
                </SectionShell>

                <SectionShell
                  title="About and Global Copy"
                  description="Edit the large about section and global lists used across the site."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="About Kicker">
                      <TextInput value={contentDraft.about.kicker} onChange={(event) => updateNestedField('about', 'kicker', event.target.value)} />
                    </Field>
                    <Field label="About Title">
                      <TextInput value={contentDraft.about.title} onChange={(event) => updateNestedField('about', 'title', event.target.value)} />
                    </Field>
                  </div>
                  <Field label="About Paragraphs" hint="One paragraph per line.">
                    <TextArea value={toLines(contentDraft.about.paragraphs)} onChange={(event) => handleNestedListChange('about', 'paragraphs', event.target.value)} />
                  </Field>
                  <Field label="Approval Badges" hint="One badge per line.">
                    <TextArea value={toLines(contentDraft.about.approvals)} onChange={(event) => handleNestedListChange('about', 'approvals', event.target.value)} />
                  </Field>
                  <Field label="Leadership Intro">
                    <TextArea value={contentDraft.about.leadershipIntro} onChange={(event) => updateNestedField('about', 'leadershipIntro', event.target.value)} />
                  </Field>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Referral Banner Kicker">
                      <TextInput value={contentDraft.referralBanner.kicker} onChange={(event) => updateNestedField('referralBanner', 'kicker', event.target.value)} />
                    </Field>
                    <Field label="Referral Banner Text">
                      <TextInput value={contentDraft.referralBanner.text} onChange={(event) => updateNestedField('referralBanner', 'text', event.target.value)} />
                    </Field>
                  </div>
                  <Field label="Course Includes" hint="One line per benefit.">
                    <TextArea value={toLines(contentDraft.courseIncludes)} onChange={(event) => handleListChange('courseIncludes', event.target.value)} />
                  </Field>
                  <Field label="Verification Steps" hint="One line per step.">
                    <TextArea value={toLines(contentDraft.verificationSteps)} onChange={(event) => handleListChange('verificationSteps', event.target.value)} />
                  </Field>
                </SectionShell>
              </>
            ) : null}

            {activeTab === 'courses' ? (
              <SectionShell
                title="Courses"
                description="Add, edit, delete, and upload course images."
              >
                <div className="space-y-4">
                  {contentDraft.courses.map((course, index) => {
                    const courseUploadProgress = getUploadProgress('courses', index, 'image')

                    return (
                      <ItemShell
                        key={`course-${index}`}
                        title={course.title || `Course ${index + 1}`}
                        onRemove={() => removeArrayItem('courses', index, ['imagePath'])}
                      >
                        <div className="grid gap-4 md:grid-cols-2">
                          <Field label="Title">
                            <TextInput value={course.title} onChange={(event) => updateArrayItem('courses', index, 'title', event.target.value)} />
                          </Field>
                          <Field label="Fee">
                            <TextInput value={course.fee} onChange={(event) => updateArrayItem('courses', index, 'fee', event.target.value)} />
                          </Field>
                          <Field label="Tagline">
                            <TextInput value={course.tagline || ''} onChange={(event) => updateArrayItem('courses', index, 'tagline', event.target.value)} />
                          </Field>
                          <Field label="Image URL">
                            <TextInput value={course.image || ''} onChange={(event) => updateArrayItem('courses', index, 'image', event.target.value)} />
                          </Field>
                          <Field label="Upload Course Image">
                            <FileUploadInput
                              buttonLabel="Choose Course Image"
                              isUploading={courseUploadProgress !== undefined}
                              progress={courseUploadProgress}
                              onFileSelect={(file) => handleUpload({
                                // Final Cloudinary folder: cits-admin/courses
                                file,
                                folder: 'courses',
                                index,
                                pathField: 'imagePath',
                                rootKey: 'courses',
                                urlField: 'image',
                              })}
                            />
                          </Field>
                        </div>
                        {course.image ? <img src={course.image} alt={course.title || 'Course preview'} className="h-40 rounded-2xl border border-slate-800 object-cover" /> : null}
                      </ItemShell>
                    )
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => addArrayItem('courses', createEmptyCourse)}
                  className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
                >
                  Add Course
                </button>
              </SectionShell>
            ) : null}

            {activeTab === 'placements' ? (
              <SectionShell
                title="Placed Students"
                description="Manage placement stories and upload both student and company logos."
              >
                <div className="space-y-4">
                  {contentDraft.placedStudents.map((student, index) => {
                    const studentUploadProgress = getUploadProgress('placedStudents', index, 'personImage')
                    const companyUploadProgress = getUploadProgress('placedStudents', index, 'companyImage')

                    return (
                      <ItemShell
                        key={`student-${index}`}
                        title={student.name || `Student ${index + 1}`}
                        onRemove={() => removeArrayItem('placedStudents', index, ['personImagePath', 'companyImagePath'])}
                      >
                        <div className="grid gap-4 md:grid-cols-2">
                          <Field label="Name">
                            <TextInput value={student.name} onChange={(event) => updateArrayItem('placedStudents', index, 'name', event.target.value)} />
                          </Field>
                          <Field label="Role">
                            <TextInput value={student.role} onChange={(event) => updateArrayItem('placedStudents', index, 'role', event.target.value)} />
                          </Field>
                          <Field label="Company">
                            <TextInput value={student.company} onChange={(event) => updateArrayItem('placedStudents', index, 'company', event.target.value)} />
                          </Field>
                          <Field label="Package">
                            <TextInput value={student.package} onChange={(event) => updateArrayItem('placedStudents', index, 'package', event.target.value)} />
                          </Field>
                          <Field label="Batch">
                            <TextInput value={student.batch} onChange={(event) => updateArrayItem('placedStudents', index, 'batch', event.target.value)} />
                          </Field>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <Field label="Student Image URL">
                            <TextInput value={student.personImage || ''} onChange={(event) => updateArrayItem('placedStudents', index, 'personImage', event.target.value)} />
                          </Field>
                          <Field label="Company Image URL">
                            <TextInput value={student.companyImage || ''} onChange={(event) => updateArrayItem('placedStudents', index, 'companyImage', event.target.value)} />
                          </Field>
                          <Field label="Upload Student Image">
                            <FileUploadInput
                              buttonLabel="Choose Student Image"
                              isUploading={studentUploadProgress !== undefined}
                              progress={studentUploadProgress}
                              onFileSelect={(file) => handleUpload({
                                // Final Cloudinary folder: cits-admin/placed-students/person
                                file,
                                folder: 'placed-students/person',
                                index,
                                pathField: 'personImagePath',
                                rootKey: 'placedStudents',
                                urlField: 'personImage',
                              })}
                            />
                          </Field>
                          <Field label="Upload Company Logo">
                            <FileUploadInput
                              buttonLabel="Choose Company Logo"
                              isUploading={companyUploadProgress !== undefined}
                              progress={companyUploadProgress}
                              onFileSelect={(file) => handleUpload({
                                // Final Cloudinary folder: cits-admin/placed-students/company
                                file,
                                folder: 'placed-students/company',
                                index,
                                pathField: 'companyImagePath',
                                rootKey: 'placedStudents',
                                urlField: 'companyImage',
                              })}
                            />
                          </Field>
                        </div>
                      </ItemShell>
                    )
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => addArrayItem('placedStudents', createEmptyPlacement)}
                  className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
                >
                  Add Placement Story
                </button>
              </SectionShell>
            ) : null}

            {activeTab === 'leadership' ? (
              <SectionShell
                title="Leadership"
                description="Manage founder and co-founder cards, including uploaded images."
              >
                <div className="space-y-4">
                  {contentDraft.leadershipMembers.map((member, index) => {
                    const leaderUploadProgress = getUploadProgress('leadershipMembers', index, 'image')

                    return (
                      <ItemShell
                        key={`leader-${index}`}
                        title={member.name || `Leader ${index + 1}`}
                        onRemove={() => removeArrayItem('leadershipMembers', index, ['imagePath'])}
                      >
                        <div className="grid gap-4 md:grid-cols-2">
                          <Field label="Role Label">
                            <TextInput value={member.roleLabel} onChange={(event) => updateArrayItem('leadershipMembers', index, 'roleLabel', event.target.value)} />
                          </Field>
                          <Field label="Name">
                            <TextInput value={member.name} onChange={(event) => updateArrayItem('leadershipMembers', index, 'name', event.target.value)} />
                          </Field>
                          <Field label="Education">
                            <TextInput value={member.education} onChange={(event) => updateArrayItem('leadershipMembers', index, 'education', event.target.value)} />
                          </Field>
                          <Field label="Specialization">
                            <TextInput value={member.specialization} onChange={(event) => updateArrayItem('leadershipMembers', index, 'specialization', event.target.value)} />
                          </Field>
                          <Field label="Instagram URL">
                            <TextInput value={member.instagramUrl || ''} onChange={(event) => updateArrayItem('leadershipMembers', index, 'instagramUrl', event.target.value)} />
                          </Field>
                          <Field label="Alt Text">
                            <TextInput value={member.alt || ''} onChange={(event) => updateArrayItem('leadershipMembers', index, 'alt', event.target.value)} />
                          </Field>
                        </div>
                        <Field label="Description">
                          <TextArea value={member.description} onChange={(event) => updateArrayItem('leadershipMembers', index, 'description', event.target.value)} />
                        </Field>
                        <Field label="Quote">
                          <TextInput value={member.quote} onChange={(event) => updateArrayItem('leadershipMembers', index, 'quote', event.target.value)} />
                        </Field>
                        <div className="grid gap-4 md:grid-cols-2">
                          <Field label="Image URL">
                            <TextInput value={member.image || ''} onChange={(event) => updateArrayItem('leadershipMembers', index, 'image', event.target.value)} />
                          </Field>
                          <Field label="Upload Leader Image">
                            <FileUploadInput
                              buttonLabel="Choose Leader Image"
                              isUploading={leaderUploadProgress !== undefined}
                              progress={leaderUploadProgress}
                              onFileSelect={(file) => handleUpload({
                                // Final Cloudinary folder: cits-admin/leadership
                                file,
                                folder: 'leadership',
                                index,
                                pathField: 'imagePath',
                                rootKey: 'leadershipMembers',
                                urlField: 'image',
                              })}
                            />
                          </Field>
                        </div>
                      </ItemShell>
                    )
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => addArrayItem('leadershipMembers', createEmptyLeader)}
                  className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
                >
                  Add Leader
                </button>
              </SectionShell>
            ) : null}

            {activeTab === 'sections' ? (
              <>
                <SectionShell title="Impact Stats" description="Editable stat cards in the about section.">
                  <div className="space-y-4">
                    {contentDraft.impactStats.map((stat, index) => (
                      <ItemShell key={`stat-${index}`} title={stat.label || `Stat ${index + 1}`} onRemove={() => removeArrayItem('impactStats', index)}>
                        <div className="grid gap-4 md:grid-cols-2">
                          <Field label="Label">
                            <TextInput value={stat.label} onChange={(event) => updateArrayItem('impactStats', index, 'label', event.target.value)} />
                          </Field>
                          <Field label="Value">
                            <TextInput value={stat.value} onChange={(event) => updateArrayItem('impactStats', index, 'value', event.target.value)} />
                          </Field>
                        </div>
                      </ItemShell>
                    ))}
                  </div>
                  <button type="button" onClick={() => addArrayItem('impactStats', createEmptyStat)} className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20">
                    Add Stat
                  </button>
                </SectionShell>

                <SectionShell title="Navigation and Search" description="Menu links and search keywords for section jumps.">
                  <div className="space-y-4">
                    {contentDraft.navItems.map((item, index) => (
                      <ItemShell key={`nav-${index}`} title={item.label || `Link ${index + 1}`} onRemove={() => removeArrayItem('navItems', index)}>
                        <div className="grid gap-4 md:grid-cols-2">
                          <Field label="Label">
                            <TextInput value={item.label} onChange={(event) => updateArrayItem('navItems', index, 'label', event.target.value)} />
                          </Field>
                          <Field label="Href">
                            <TextInput value={item.href} onChange={(event) => updateArrayItem('navItems', index, 'href', event.target.value)} />
                          </Field>
                        </div>
                      </ItemShell>
                    ))}
                  </div>
                  <button type="button" onClick={() => addArrayItem('navItems', createEmptyNavItem)} className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20">
                    Add Nav Item
                  </button>

                  <div className="mt-6 space-y-4">
                    {contentDraft.searchTargets.map((target, index) => (
                      <ItemShell key={`search-${index}`} title={target.label || `Search Target ${index + 1}`} onRemove={() => removeArrayItem('searchTargets', index)}>
                        <div className="grid gap-4 md:grid-cols-2">
                          <Field label="ID">
                            <TextInput value={target.id} onChange={(event) => updateArrayItem('searchTargets', index, 'id', event.target.value)} />
                          </Field>
                          <Field label="Label">
                            <TextInput value={target.label} onChange={(event) => updateArrayItem('searchTargets', index, 'label', event.target.value)} />
                          </Field>
                        </div>
                        <Field label="Keywords" hint="Comma-separated keywords.">
                          <TextInput
                            value={(target.keywords || []).join(', ')}
                            onChange={(event) => updateArrayItem('searchTargets', index, 'keywords', toCommaArray(event.target.value))}
                          />
                        </Field>
                      </ItemShell>
                    ))}
                  </div>
                  <button type="button" onClick={() => addArrayItem('searchTargets', createEmptySearchTarget)} className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20">
                    Add Search Target
                  </button>
                </SectionShell>

                <SectionShell title="Roadmap, Batches, and Blogs" description="Manage text-based sections without leaving the admin panel.">
                  <div className="space-y-4">
                    {contentDraft.roadmapSteps.map((step, index) => (
                      <ItemShell key={`roadmap-${index}`} title={step.title || `Roadmap Step ${index + 1}`} onRemove={() => removeArrayItem('roadmapSteps', index)}>
                        <div className="grid gap-4 md:grid-cols-2">
                          <Field label="Number"><TextInput value={step.number} onChange={(event) => updateArrayItem('roadmapSteps', index, 'number', event.target.value)} /></Field>
                          <Field label="Title"><TextInput value={step.title} onChange={(event) => updateArrayItem('roadmapSteps', index, 'title', event.target.value)} /></Field>
                          <Field label="Icon"><TextInput value={step.icon} onChange={(event) => updateArrayItem('roadmapSteps', index, 'icon', event.target.value)} /></Field>
                          <Field label="Accent"><TextInput value={step.accent} onChange={(event) => updateArrayItem('roadmapSteps', index, 'accent', event.target.value)} /></Field>
                        </div>
                        <Field label="Description"><TextArea value={step.description} onChange={(event) => updateArrayItem('roadmapSteps', index, 'description', event.target.value)} /></Field>
                      </ItemShell>
                    ))}
                  </div>
                  <button type="button" onClick={() => addArrayItem('roadmapSteps', createEmptyRoadmapStep)} className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20">
                    Add Roadmap Step
                  </button>

                  <div className="mt-6 space-y-4">
                    {contentDraft.upcomingBatches.map((batch, index) => (
                      <ItemShell key={`batch-${index}`} title={batch.track || `Batch ${index + 1}`} onRemove={() => removeArrayItem('upcomingBatches', index)}>
                        <div className="grid gap-4 md:grid-cols-3">
                          <Field label="Track"><TextInput value={batch.track} onChange={(event) => updateArrayItem('upcomingBatches', index, 'track', event.target.value)} /></Field>
                          <Field label="Mode"><TextInput value={batch.mode} onChange={(event) => updateArrayItem('upcomingBatches', index, 'mode', event.target.value)} /></Field>
                          <Field label="Duration"><TextInput value={batch.duration} onChange={(event) => updateArrayItem('upcomingBatches', index, 'duration', event.target.value)} /></Field>
                        </div>
                      </ItemShell>
                    ))}
                  </div>
                  <button type="button" onClick={() => addArrayItem('upcomingBatches', createEmptyBatch)} className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20">
                    Add Batch
                  </button>

                  <div className="mt-6 space-y-4">
                    {contentDraft.blogPreviews.map((blog, index) => (
                      <ItemShell key={`blog-${index}`} title={blog.title || `Blog ${index + 1}`} onRemove={() => removeArrayItem('blogPreviews', index)}>
                        <Field label="Title"><TextInput value={blog.title} onChange={(event) => updateArrayItem('blogPreviews', index, 'title', event.target.value)} /></Field>
                        <Field label="Summary"><TextArea value={blog.summary} onChange={(event) => updateArrayItem('blogPreviews', index, 'summary', event.target.value)} /></Field>
                      </ItemShell>
                    ))}
                  </div>
                  <button type="button" onClick={() => addArrayItem('blogPreviews', createEmptyBlog)} className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20">
                    Add Blog Preview
                  </button>
                </SectionShell>
              </>
            ) : null}

            {activeTab === 'payments' ? (
              <SectionShell
                title="Payment Records"
                description="Shows users who completed Stripe checkout and were verified by the backend."
              >
                {/* Payments monitor for admins.
                    Source can be Firestore-first with Stripe fallback handled in backend. */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-400">
                    {isPaymentsLoading
                      ? 'Loading latest payment records...'
                      : `Loaded ${paymentRecords.length} payment record${paymentRecords.length === 1 ? '' : 's'}.`}
                  </p>
                  <button
                    type="button"
                    onClick={handleRefreshPayments}
                    disabled={isPaymentsLoading}
                    className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPaymentsLoading ? 'Refreshing...' : 'Refresh Payments'}
                  </button>
                </div>

                {paymentsError ? (
                  <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                    {paymentsError}
                  </div>
                ) : null}

                {!isPaymentsLoading && !paymentsError && paymentRecords.length === 0 ? (
                  <div className="rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
                    No payment records found yet.
                  </div>
                ) : null}

                {paymentRecords.length > 0 ? (
                  <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70">
                    <table className="min-w-[1080px] table-fixed text-left text-sm">
                      <thead className="bg-slate-900/90 text-xs uppercase tracking-[0.14em] text-slate-400">
                        <tr>
                          <th className="w-[13rem] px-4 py-3 whitespace-nowrap">Purchased At</th>
                          <th className="w-[18rem] px-4 py-3 whitespace-nowrap">User</th>
                          <th className="w-[13rem] px-4 py-3 whitespace-nowrap">Course</th>
                          <th className="w-[8rem] px-4 py-3 whitespace-nowrap">Amount</th>
                          <th className="w-[7rem] px-4 py-3 whitespace-nowrap">Status</th>
                          <th className="w-[23rem] px-4 py-3 whitespace-nowrap">Session</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentRecords.map((purchase, index) => (
                          <tr key={`${purchase.path || purchase.id || 'purchase'}-${index}`} className="border-t border-slate-800">
                            <td className="px-4 py-3 align-top text-slate-200">{formatDateTime(purchase.purchasedAtIso)}</td>
                            <td className="px-4 py-3 align-top text-slate-200">
                              <p>{purchase.userEmail || '-'}</p>
                              <p className="mt-1 break-all text-xs text-slate-400">{purchase.userId || '-'}</p>
                            </td>
                            <td className="px-4 py-3 align-top text-slate-200">
                              <p>{purchase.courseTitle || purchase.courseId || '-'}</p>
                              {purchase.courseTitle && purchase.courseId ? <p className="mt-1 break-words text-xs text-slate-400">{purchase.courseId}</p> : null}
                            </td>
                            <td className="px-4 py-3 align-top text-slate-200">{formatPurchaseAmount(purchase.amount, purchase.currency)}</td>
                            <td className="px-4 py-3 align-top text-slate-200">{purchase.paymentStatus || '-'}</td>
                            <td className="px-4 py-3 align-top">
                              <p
                                className="truncate font-mono text-xs text-cyan-200"
                                title={purchase.stripeSessionId || '-'}
                              >
                                {formatSessionId(purchase.stripeSessionId)}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </SectionShell>
            ) : null}

            {activeTab === 'users' ? (
              <SectionShell
                title="Registered Users"
                description="Shows account details captured during create-account signup."
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-400">
                    {isUsersLoading
                      ? 'Loading registered user profiles...'
                      : `Loaded ${userProfiles.length} user profile${userProfiles.length === 1 ? '' : 's'}.`}
                  </p>
                  <button
                    type="button"
                    onClick={handleRefreshUsers}
                    disabled={isUsersLoading}
                    className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isUsersLoading ? 'Refreshing...' : 'Refresh Users'}
                  </button>
                </div>

                {usersError ? (
                  <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                    {usersError}
                  </div>
                ) : null}

                {!isUsersLoading && !usersError && userProfiles.length === 0 ? (
                  <div className="rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
                    No user profiles found yet.
                  </div>
                ) : null}

                {userProfiles.length > 0 ? (
                  <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70">
                    <table className="min-w-[980px] table-fixed text-left text-sm">
                      <thead className="bg-slate-900/90 text-xs uppercase tracking-[0.14em] text-slate-400">
                        <tr>
                          <th className="w-[15rem] px-4 py-3 whitespace-nowrap">Name</th>
                          <th className="w-[20rem] px-4 py-3 whitespace-nowrap">Email</th>
                          <th className="w-[14rem] px-4 py-3 whitespace-nowrap">Phone</th>
                          <th className="w-[14rem] px-4 py-3 whitespace-nowrap">Created</th>
                          <th className="w-[14rem] px-4 py-3 whitespace-nowrap">Updated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userProfiles.map((profile, index) => (
                          <tr key={`${profile.userId || profile.id || 'user'}-${index}`} className="border-t border-slate-800">
                            <td className="px-4 py-3 align-top text-slate-200">{profile.name || '-'}</td>
                            <td className="px-4 py-3 align-top text-slate-200 break-all">{profile.email || '-'}</td>
                            <td className="px-4 py-3 align-top text-slate-200">{profile.phone || '-'}</td>
                            <td className="px-4 py-3 align-top text-slate-300">{formatDateTime(profile.profileCreatedAtIso || profile.createdAtIso)}</td>
                            <td className="px-4 py-3 align-top text-slate-300">{formatDateTime(profile.profileUpdatedAtIso || profile.updatedAtIso)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </SectionShell>
            ) : null}

            {activeTab === 'advanced' ? (
              <SectionShell
                title="Advanced JSON"
                description="Fallback editor for the full Firestore content document. Use this for fields not covered by the structured tabs."
              >
                <Field label="Raw JSON">
                  <TextArea className="min-h-[34rem] font-mono text-xs leading-6" value={advancedJson} onChange={(event) => setAdvancedJson(event.target.value)} spellCheck={false} />
                </Field>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={applyAdvancedJson}
                    className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
                  >
                    Apply JSON to Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdvancedJson(JSON.stringify(contentDraft, null, 2))}
                    className="rounded-full border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/60 hover:text-cyan-100"
                  >
                    Reset JSON from Current Draft
                  </button>
                </div>
              </SectionShell>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminPanel
