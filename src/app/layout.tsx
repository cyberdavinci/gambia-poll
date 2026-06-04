import type { Metadata } from 'next'
import { DM_Sans, DM_Serif_Display } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600'],
})

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: '400',
})

export const metadata: Metadata = {
  title: 'Gambia Votes 2026 – Who Will Win?',
  description: 'Cast your anonymous vote in the biggest presidential poll for The Gambia. See live results and predict the next president.',
  keywords: ['Gambia', 'election', 'president', 'vote', 'poll', 'UDP', 'NPP', 'GDC', 'politics', '2026'],
  authors: [{ name: 'Gambia Votes' }],
  creator: 'Gambia Votes',
  publisher: 'Gambia Votes',
  metadataBase: new URL('https://gambia-votes.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'en_GM',
    url: 'https://gambia-votes.vercel.app',
    siteName: 'Gambia Votes',
    title: 'Gambia Votes 2026 – Who Will Win?',
    description: 'Cast your anonymous vote in the biggest presidential poll for The Gambia. See live results and predict the next president.',
    images: [
      {
        url: '/gambialogo.jpg',
        width: 1200,
        height: 630,
        alt: 'Gambia Votes – Presidential Poll 2026',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gambia Votes 2026 – Who Will Win?',
    description: 'Cast your anonymous vote in the biggest presidential poll for The Gambia.',
    images: ['/gambialogo.jpg'],
    creator: '@gambiavotes',
  },
  icons: {
    icon: '/gambialogo.jpg',
    shortcut: '/gambialogo.jpg',
    apple: '/gambialogo.jpg',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${dmSerif.variable}`}>{children}</body>
    </html>
  )
}
