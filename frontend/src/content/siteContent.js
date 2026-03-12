// Shared content schema and local fallback values.
// Used by:
// - App.jsx as the initial public-site content state
// - services/siteContent.js as the Firestore merge/fallback layer
// - AdminPanel.jsx as the default editor shape if Firestore is empty
const defaultCourses = [
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

const defaultImpactStats = [
  { label: 'Students Guided', value: '1000+' },
  { label: 'Live Sessions', value: '250+' },
  { label: 'Mentor Support', value: '1:1 Access' },
  { label: 'Industry Projects', value: 'Real Case Studies' },
]

const defaultCourseIncludes = [
  'Live instructor-led classes',
  'Interview preparation with mock rounds',
  'Resume and LinkedIn optimization',
  'Hands-on assignments with feedback',
]

const defaultUpcomingBatches = [
  { track: 'Oracle EBS by CITS', mode: 'Online Live', duration: '12 Weeks' },
  { track: 'Versant Mock Test Practice by CITS', mode: 'Online Live', duration: '4 Weeks' },
  { track: 'Quality Analyst', mode: 'Online Live', duration: '10 Weeks' },
  { track: 'ServiceNow by CITS', mode: 'Online Live', duration: '12 Weeks' },
  { track: 'Incident Management', mode: 'Online Live', duration: '10 Weeks' },
]

const defaultVerificationSteps = [
  'Send your certificate ID to connectints1@gmail.com',
  'Include your full name and course name in the email',
  'Our team validates your record and responds with confirmation',
]

const defaultBlogPreviews = [
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

const defaultRoadmapSteps = [
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

const defaultPlacedStudents = [
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

const defaultNavItems = [
  { label: 'Courses', href: '#courses' },
  { label: 'About Us', href: '#about-us' },
  { label: 'Founder & Co-Founder', href: '#leadership' },
  { label: 'Placed Students', href: '#placed-students' },
  { label: 'Roadmap', href: '#roadmap' },
  { label: 'Upcoming Batches', href: '#upcoming-batches' },
  { label: 'Verify Your Certificate', href: '#verify-certificate' },
  { label: 'Blogs', href: '#blogs' },
]

const defaultSearchTargets = [
  { id: 'courses', label: 'Courses', keywords: ['course', 'servicenow', 'oracle', 'versant', 'incident', 'quality', 'qa', 'quality analyst'] },
  { id: 'about-us', label: 'About Us', keywords: ['about', 'cits', 'story', 'mission'] },
  { id: 'leadership', label: 'Founder & Co-Founder', keywords: ['founder', 'cofounder', 'leadership', 'tharun', 'surya'] },
  { id: 'placed-students', label: 'Placed Students', keywords: ['placed', 'placement', 'students', 'hired', 'job'] },
  { id: 'roadmap', label: 'Roadmap', keywords: ['roadmap', 'steps', 'enroll', 'enrollment', 'skill development'] },
  { id: 'upcoming-batches', label: 'Upcoming Batches', keywords: ['batch', 'upcoming', 'enrollment'] },
  { id: 'verify-certificate', label: 'Verify Your Certificate', keywords: ['verify', 'certificate', 'validation'] },
  { id: 'blogs', label: 'Blogs', keywords: ['blog', 'insights', 'career'] },
]

const defaultContact = {
  whatsappNumber: '916303545755',
  email: 'connectints1@gmail.com',
  phone: '+91 6303545755',
  alternatePhone: '+91 8247097984',
  supportHours: 'Mon-Sat | 9:00 AM to 7:00 PM',
}

const defaultAbout = {
  kicker: 'About CITS',
  title: 'More than teaching skills, we build futures.',
  paragraphs: [
    'In 2025, two friends attended a job interview with great hopes, but they were rejected. That day became a turning point in their lives. With empty pockets, hunger, and sleepless nights, they struggled without stable jobs or income.',
    'Instead of giving up, they transformed that struggle into a powerful idea: Connectints, built to create opportunities and support others in building careers. Today, CITS is growing as an EdTech community built by dreamers across India.',
    'Along with MSME registration, CITS also carries AICTE approval, ISO 21001:2018, and Start-up India recognition.',
  ],
  approvals: ['AICTE Approved', 'ISO 21001:2018', 'Start-up India', 'MSME Registered'],
  leadershipIntro: 'The ideologies behind CITS are shaped by resilience, practical thinking, and the mission to reduce unemployment through skill-first training.',
}

const defaultLeadershipMembers = [
  {
    roleLabel: 'Founder & CEO',
    name: 'Tharun Kumar',
    education: 'B.Tech in Computer Science Engineering',
    specialization: 'Storytelling, mentorship, employability strategy, and real-world execution',
    description: 'More than a CEO, Tharun wears many hats: a farmer connected to his roots, a filmmaker and storyteller, a scriptwriter and director, a psychologist who understands people, and a corporate professional who values real-world experience.',
    quote: "I was born in hunger, and I don't want to see anyone suffer from it.",
    instagramUrl: 'https://www.instagram.com/tharun_sparkss?igsh=MXA3bDl0NnNpNGx2Yw==',
    image: '/images/tharun.png',
    imagePath: '',
    alt: 'Tharun Kumar',
  },
  {
    roleLabel: 'Co-Founder & CTO',
    name: 'Jyothi Prasad Surya',
    education: 'Engineering background in technology and systems',
    specialization: 'Program design, technical strategy, and leadership support systems',
    description: "Surya, son of a hardworking food vendor, played a significant role in shaping Tharun's journey. His encouragement, ideas, and sleepless brainstorming sessions helped transform intent into initiatives focused on reaching and helping people.",
    quote: 'More than our own lives, we often spoke about the growing issue of unemployment.',
    instagramUrl: 'https://www.instagram.com/sj__surya_?igsh=MTZ1aWJsMWdxa2o5aA==',
    image: '/images/surya.jpg',
    imagePath: '',
    alt: 'Jyothi Prasad Surya',
  },
]

const defaultReferralBanner = {
  kicker: 'Referral Program',
  text: 'Refer Friends. Help Them Learn. Earn Rewards with CITS.',
}

const defaultFooter = {
  brandCopy: 'Career-first learning platform focused on practical skills, interview readiness, and job outcomes through mentor-led training.',
  badgeText: 'More than teaching skills, we build futures',
  responseTimeNote: 'Response Time: Usually within 24 hours for email queries.',
  copyrightText: 'CITS Connectints. All rights reserved.',
  builtForText: 'Built for practical learning, verification, and placement outcomes.',
}

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const pickArray = (value, fallback) => (Array.isArray(value) ? value : fallback)

export const defaultSiteContent = {
  about: defaultAbout,
  blogPreviews: defaultBlogPreviews,
  contact: defaultContact,
  courseIncludes: defaultCourseIncludes,
  courses: defaultCourses,
  footer: defaultFooter,
  impactStats: defaultImpactStats,
  leadershipMembers: defaultLeadershipMembers,
  navItems: defaultNavItems,
  placedStudents: defaultPlacedStudents,
  referralBanner: defaultReferralBanner,
  roadmapSteps: defaultRoadmapSteps,
  searchTargets: defaultSearchTargets,
  upcomingBatches: defaultUpcomingBatches,
  verificationSteps: defaultVerificationSteps,
}

// Merge Firestore data with a safe local shape so missing fields never break rendering.
// The public site and chatbot always consume this merged object instead of raw DB data.
export const mergeSiteContent = (remoteContent = {}) => ({
  about: isPlainObject(remoteContent.about)
    ? {
      ...defaultSiteContent.about,
      ...remoteContent.about,
      approvals: pickArray(remoteContent.about?.approvals, defaultSiteContent.about.approvals),
      paragraphs: pickArray(remoteContent.about?.paragraphs, defaultSiteContent.about.paragraphs),
    }
    : defaultSiteContent.about,
  blogPreviews: pickArray(remoteContent.blogPreviews, defaultSiteContent.blogPreviews),
  contact: isPlainObject(remoteContent.contact)
    ? { ...defaultSiteContent.contact, ...remoteContent.contact }
    : defaultSiteContent.contact,
  courseIncludes: pickArray(remoteContent.courseIncludes, defaultSiteContent.courseIncludes),
  courses: pickArray(remoteContent.courses, defaultSiteContent.courses),
  footer: isPlainObject(remoteContent.footer)
    ? { ...defaultSiteContent.footer, ...remoteContent.footer }
    : defaultSiteContent.footer,
  impactStats: pickArray(remoteContent.impactStats, defaultSiteContent.impactStats),
  leadershipMembers: pickArray(remoteContent.leadershipMembers, defaultSiteContent.leadershipMembers),
  navItems: pickArray(remoteContent.navItems, defaultSiteContent.navItems),
  placedStudents: pickArray(remoteContent.placedStudents, defaultSiteContent.placedStudents),
  referralBanner: isPlainObject(remoteContent.referralBanner)
    ? { ...defaultSiteContent.referralBanner, ...remoteContent.referralBanner }
    : defaultSiteContent.referralBanner,
  roadmapSteps: pickArray(remoteContent.roadmapSteps, defaultSiteContent.roadmapSteps),
  searchTargets: pickArray(remoteContent.searchTargets, defaultSiteContent.searchTargets),
  upcomingBatches: pickArray(remoteContent.upcomingBatches, defaultSiteContent.upcomingBatches),
  verificationSteps: pickArray(remoteContent.verificationSteps, defaultSiteContent.verificationSteps),
})
