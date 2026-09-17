export type Project = {
  slug: string;
  name: string;
  category: string;
  description: string;
  technologies: string[];
  accent: string;
  github: string | null;
  demo: string | null;
  image: string | null;
  imageAlt: string;
  verified: boolean;
};

// Sources: https://github.com/vabxsen and each project's README, checked 2026-09-15.
// Null demo URLs mean the project has no verified web demo. Add real screenshots
// to public/projects and set image + imageAlt to replace the labeled interface studies.
export const profile = {
  name: 'Vaibhav Sen',
  role: 'Developer & UI/UX Designer',
  introduction:
    'I turn complex ideas into simple, thoughtful digital experiences. Designed with intent. Built with care.',
  bio: 'I’m Vaibhav — a developer with a designer’s eye. I design and build web, mobile, desktop, and AI-powered products, thinking about how they work and how they feel in equal measure.',
  philosophy:
    'From the first wireframe to the final interaction, I care about the details that make software feel effortless. My sweet spot is where thoughtful interfaces meet dependable engineering.',
  email: 'cheeseburst06@gmail.com',
  github: 'https://github.com/vabxsen',
  linkedin: null as string | null,
};

export const navigation = [
  { label: 'Work', href: '#work' },
  { label: 'About', href: '#about' },
  { label: 'Journey', href: '#journey' },
];
export const projects: Project[] = [
  {
    slug: 'kimi',
    name: 'Kimi',
    category: 'Small rituals. A brighter every day.',
    description:
      'A native Android habit tracker with daily rituals, streaks, a reflection journal, and progress insights. Built with a colorful, considered interface.',
    technologies: ['Kotlin', 'Jetpack Compose', 'Firebase'],
    accent: '#bca4eb',
    github: 'https://github.com/vabxsen/Kimi',
    demo: null,
    image: '/projects/kimi-today.png',
    imageAlt: 'Kimi Android Today screen with habits, streaks, and daily progress in dark mode',
    verified: true,
  },
  {
    slug: 'budgie',
    name: 'Budgie',
    category: 'A clearer picture of your subscriptions.',
    description:
      'An Android subscription manager for recurring payments, renewal reminders, budgets, and spending insights, with a companion web prototype.',
    technologies: ['Kotlin', 'Jetpack Compose', 'WorkManager', 'React'],
    accent: '#dfd39b',
    github: 'https://github.com/vabxsen/budgie',
    demo: null,
    image: '/projects/budgie-home.jpg',
    imageAlt:
      'Budgie subscription dashboard showing recurring spend, annual outlook, and upcoming payments',
    verified: true,
  },
  {
    slug: 'scoop',
    name: 'Scoop',
    category: 'Your media. Your device.',
    description:
      'A local-first Android downloader for images, video, and audio. No account, backend, ads, or analytics.',
    technologies: ['Kotlin', 'Jetpack Compose', 'Material 3', 'Room'],
    accent: '#f2a479',
    github: 'https://github.com/vabxsen/Scoop',
    demo: 'https://vabxsen.github.io/Scoop/',
    image: null,
    imageAlt: 'Scoop Android app screenshots',
    verified: true,
  },
  {
    slug: 'dailynx',
    name: 'Dailynx',
    category: 'Small habits. Lasting progress.',
    description:
      'An installable habit tracker with streaks, XP, sleep tracking, and an optional AI coach to help build consistency.',
    technologies: ['React', 'TypeScript', 'Firebase', 'Gemini'],
    accent: '#a99ae9',
    github: 'https://github.com/vabxsen/Dailynx',
    demo: 'https://dailynx.web.app',
    image: null,
    imageAlt: 'Dailynx habit tracker interface study',
    verified: true,
  },
  {
    slug: 'pricepilot',
    name: 'PricePilot',
    category: 'Know the right moment to buy.',
    description:
      'Track product prices, explore their history, and set target alerts. A price tracker designed to run on free infrastructure tiers.',
    technologies: ['React', 'TypeScript', 'Firebase', 'Cloudflare Workers'],
    accent: '#8bd0b0',
    github: 'https://github.com/vabxsen/PricePilot',
    demo: 'https://pricepilot.web.app',
    image: null,
    imageAlt: 'PricePilot price history interface study',
    verified: true,
  },
  {
    slug: 'pindrop',
    name: 'PinDrop',
    category: 'Location sharing. Permission first.',
    description:
      'Consent-based sharing links with explicit opt-in, live location delivery, and a dashboard for managing responses.',
    technologies: ['React', 'Express', 'PostgreSQL', 'Socket.IO'],
    accent: '#85b4e3',
    github: 'https://github.com/vabxsen/PinDrop',
    demo: 'https://pindrop-locationtracker.firebaseapp.com',
    image: null,
    imageAlt: 'PinDrop location consent interface study',
    verified: true,
  },
  {
    slug: 'nexrig',
    name: 'NexRig',
    category: 'Plan the build. Check every part.',
    description:
      'A PC build planner with real-time compatibility checks, power estimates, and side-by-side build comparisons.',
    technologies: ['React', 'TypeScript', 'Zustand', 'Firebase'],
    accent: '#c1b5eb',
    github: 'https://github.com/vabxsen/Nexrig',
    demo: 'https://nexrig.web.app',
    image: null,
    imageAlt: 'NexRig component picker interface study',
    verified: true,
  },
  {
    slug: 'doclee',
    name: 'Doclee',
    category: 'Powerful PDF tools. Private by design.',
    description:
      'Convert, edit, and organize PDFs in your browser. On-device processing keeps your documents in your hands.',
    technologies: ['React', 'TypeScript', 'pdf-lib', 'PWA'],
    accent: '#d5b67d',
    github: 'https://github.com/vabxsen/Doclee',
    demo: 'https://doclee.web.app',
    image: null,
    imageAlt: 'Doclee PDF toolkit interface study',
    verified: true,
  },
  {
    slug: 'gecko-ai',
    name: 'Gecko AI',
    category: 'Exploring native AI experiences.',
    description:
      'An Android project exploring AI-powered experiences in Kotlin. Follow its development in the public repository.',
    technologies: ['Kotlin', 'Android'],
    accent: '#add28c',
    github: 'https://github.com/vabxsen/gecko',
    demo: null,
    image: null,
    imageAlt: 'Gecko AI concept interface study',
    verified: true,
  },
  {
    slug: 'native-ai',
    name: 'Native AI',
    category: 'A little help. Just a word away.',
    description:
      'A Python desktop voice assistant for everyday commands, system monitoring, and conversations powered by Claude.',
    technologies: ['Python', 'Tkinter', 'SpeechRecognition', 'Claude'],
    accent: '#a5bbeb',
    github: 'https://github.com/vabxsen/Native-Ai',
    demo: null,
    image: null,
    imageAlt: 'Native AI voice assistant interface study',
    verified: true,
  },
];

// Display these projects first, in this order. All others remain under Show More.
export const featuredProjectSlugs = ['scoop', 'kimi', 'budgie'] as const;

export const stack = [
  {
    label: 'Interfaces',
    description: 'From structure to interaction.',
    items: ['React', 'Next.js', 'TypeScript', 'JavaScript', 'Tailwind CSS'],
  },
  {
    label: 'Beyond the browser',
    description: 'Useful software, across platforms.',
    items: ['Python', 'Firebase', 'Android', 'Jetpack Compose'],
  },
  {
    label: 'Design & delivery',
    description: 'The details, all the way through.',
    items: ['Figma', 'UI/UX Design', 'Git', 'GitHub'],
  },
];

export type JourneyEntry = {
  period: string;
  title: string;
  organization: string;
  description: string;
};
// Add verified education, internships, employment and open-source milestones here.
// Empty history renders an honest editorial "approach" timeline, without invented dates.
export const journey: JourneyEntry[] = [
  {
    period: 'FOUNDATION',
    title: 'Making everyday tasks simpler',
    organization: 'PYTHON & AUTOMATION',
    description:
      'Started with Python automation and computer vision: drowsiness detection, QR tools, and text-to-speech.',
  },
  {
    period: 'PRODUCTS',
    title: 'From scripts to full experiences',
    organization: 'WEB & INTERFACE DESIGN',
    description:
      'Building with TypeScript, React, and Firebase — from daily habits and PDF tools to price tracking and PC planning.',
  },
  {
    period: 'EXPLORING',
    title: 'Beyond the browser',
    organization: 'ANDROID, DESKTOP & AI',
    description:
      'Extending the work into native Android with Scoop and Gecko, and desktop voice interaction with Native AI.',
  },
];
export const approach = [
  {
    period: '01',
    title: 'Understand the problem',
    organization: 'CONTEXT FIRST',
    description: 'Start with the people, the constraints, and the reason a product needs to exist.',
  },
  {
    period: '02',
    title: 'Design the experience',
    organization: 'CLARITY OVER CLUTTER',
    description:
      'Give every screen a purpose. Make the important things obvious and the small things feel right.',
  },
  {
    period: '03',
    title: 'Build, learn, refine',
    organization: 'CARE IN THE CRAFT',
    description: 'Bring the design to life, test the details, and keep improving the experience.',
  },
];
export type Repository = {
  name: string;
  description: string;
  url: string;
  language: string;
  activity?: string;
};
export const repositories: Repository[] = [
  {
    name: 'Scoop',
    description:
      'On-device media downloads with a native Android interface. Built in the open, with contribution guidelines and release notes.',
    url: 'https://github.com/vabxsen/Scoop',
    language: 'Kotlin',
    activity: 'Updated Sep 2026',
  },
  {
    name: 'Python Roadmap',
    description:
      'A shared learning path from Python fundamentals to advanced topics, for students and independent learners.',
    url: 'https://github.com/vabxsen/Advanced-Python-Roadmap-by-vabxsen',
    language: 'Python',
    activity: 'Updated Jul 2026',
  },
  {
    name: 'Doclee',
    description:
      'A browser-first PDF toolkit. Explore the document pipeline, offline support, and client-side processing.',
    url: 'https://github.com/vabxsen/Doclee',
    language: 'TypeScript',
    activity: 'Updated Jul 2026',
  },
];
