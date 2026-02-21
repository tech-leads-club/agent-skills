import type { Metadata } from 'next'
import Link from 'next/link'
import { ThemeProvider } from '../components/ThemeProvider'
import { ThemeToggle } from '../components/ThemeToggle'
import './global.css'

const SITE_URL = 'https://agent-skills.techleads.club'
const SITE_NAME = 'Agent Skills Marketplace'
const SITE_DESCRIPTION =
  'A curated collection of skills for AI coding agents. Extend Cursor, Claude Code, GitHub Copilot, Windsurf, and more with reusable, packaged instructions.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Agent Skills Marketplace | Tech Leads Club',
    template: '%s | Agent Skills',
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'AI coding agents',
    'agent skills',
    'cursor skills',
    'claude code',
    'github copilot',
    'windsurf',
    'cline',
    'AI assistant plugins',
    'coding automation',
    'tech leads club',
    'developer tools',
  ],
  authors: [{ name: 'Tech Leads Club', url: 'https://github.com/tech-leads-club' }],
  creator: 'Tech Leads Club',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: SITE_NAME,
    title: 'Agent Skills Marketplace | Tech Leads Club',
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 800,
        height: 422,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agent Skills Marketplace | Tech Leads Club',
    description: SITE_DESCRIPTION,
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  alternates: {
    canonical: SITE_URL,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {  
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors">
        <ThemeProvider>
          <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
              <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity min-w-0">
                  <img src="/tlc-logo-dark.svg" alt="Tech Leads Club" className="h-6 sm:h-8 w-auto shrink-0 dark:hidden" />
                  <img src="/white_logo.png" alt="Tech Leads Club" className="h-6 sm:h-8 w-auto shrink-0 hidden dark:block" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-base sm:text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight truncate">Agent Skills</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight hidden sm:block">by Tech Leads Club</span>
                  </div>
                </Link>
                <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                  <Link href="/" className="text-sm sm:text-base text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors">
                    Home
                  </Link>
                  <Link href="/about" className="text-sm sm:text-base text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors hidden sm:block">
                    About
                  </Link>
                  <Link href="/skills" className="text-sm sm:text-base text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors">
                    Skills
                  </Link>
                  <a
                    href="https://github.com/tech-leads-club/agent-skills"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="hidden sm:inline">GitHub</span>
                  </a>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </nav>
          <main>{children}</main>
          <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-16 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <p className="text-center text-gray-600 dark:text-gray-400">
                Built with ❤️ by{' '}
                <a
                  href="https://github.com/tech-leads-club"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  Tech Leads Club
                </a>
              </p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  )
}
