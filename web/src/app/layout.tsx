import type {Metadata, Viewport} from 'next'
import {Geist, Geist_Mono, Newsreader} from 'next/font/google'
import {ClerkProvider} from '@clerk/nextjs'
import {Analytics} from '@vercel/analytics/next'
import {SiteHeader} from '@/components/shell/SiteHeader'
import {SiteFooter} from '@/components/shell/SiteFooter'
import {BottomTabs} from '@/components/shell/BottomTabs'
import {UnreadProvider} from '@/components/shell/UnreadProvider'
import {THEME_CLEANUP_SCRIPT} from '@/lib/themes'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-story-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Biological Control Folklore',
    template: '%s · biologicalcontrol.org',
  },
  description:
    'A community folklore archive for everyone who lived the IITA Biological Control Programme — staff, families, and national-programme friends. Find each other. Share a story.',
  metadataBase: new URL('https://biologicalcontrol.org'),
}

/** `viewport-fit: cover` so the bottom tab bar can clear the home indicator. */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f5f5f5',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} h-full`}
      >
        <body className="flex min-h-full flex-col bg-paper text-ink antialiased">
          <script dangerouslySetInnerHTML={{__html: THEME_CLEANUP_SCRIPT}} />
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:m-2 focus:rounded focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">
            Skip to content
          </a>
          <UnreadProvider>
            <SiteHeader />
            <div id="main" className="app-main has-tabbar">
              {children}
            </div>
            <SiteFooter />
            <BottomTabs />
          </UnreadProvider>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
