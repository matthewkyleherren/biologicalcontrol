import type {Metadata} from 'next'
import {Geist, Geist_Mono} from 'next/font/google'
import {SiteHeader} from '@/components/SiteHeader'
import {SiteFooter} from '@/components/SiteFooter'
import {ThemeProvider} from '@/components/ThemeProvider'
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      data-theme="default"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-paper text-ink antialiased">
        <script dangerouslySetInnerHTML={{__html: THEME_INIT_SCRIPT}} />
        <ThemeProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  )
}
