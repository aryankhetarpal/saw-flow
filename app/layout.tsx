import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { PlannerProvider } from '@/lib/store'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Nav } from '@/components/nav'
import './globals.css'

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'Sawing Planner — Shop Floor Production Board',
  description:
    'Plan and track SF (Sawing Format) jobs across 30 saws by tonnage zone. Assign, mark ready, route to Machining Department, and print the daily landscape planning sheet.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`bg-background ${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased font-sans">
        <PlannerProvider>
          <TooltipProvider delayDuration={200}>
            <Nav />
            <main className="mx-auto w-full max-w-[1600px] px-4 pb-16 pt-6 md:px-6">{children}</main>
          </TooltipProvider>
        </PlannerProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
