import type {Metadata, Viewport} from 'next'
import {Geist, Geist_Mono} from 'next/font/google'
import {ClerkProvider} from '@clerk/nextjs'
import {SiteHeader} from '@/components/shell/SiteHeader'
import {SiteFooter} from '@/components/shell/SiteFooter'
import {BottomTabs} from '@/components/shell/BottomTabs'
import {UnreadProvider} from '@/components/shell/UnreadProvider'
import {ThemeProvider} from '@/components/ThemeProvider'
import {ThemeChrome} from '@/components/ThemeChrome'
import {THEME_INIT_SCRIPT} from '@/lib/themes'
import './globals.css'
import './themes.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
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
  themeColor: '#f7f7f4',
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
        data-theme="default"
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} h-full`}
      >
        <body className="flex min-h-full flex-col bg-paper text-ink antialiased">
          <script dangerouslySetInnerHTML={{__html: THEME_INIT_SCRIPT}} />
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:m-2 focus:rounded focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">
            Skip to content
          </a>
          <ThemeProvider>
            <UnreadProvider>
              <ThemeChrome slot="top" />
              <SiteHeader />
              <div id="main" className="app-main has-tabbar">
                {children}
              </div>
              <SiteFooter />
              <ThemeChrome slot="bottom" />
              <BottomTabs />
            </UnreadProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
