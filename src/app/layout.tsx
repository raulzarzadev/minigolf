import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'Plataforma de Minigolf',
  description: 'Administra partidas de minigolf y torneos digitales',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png'
  },
  openGraph: {
    title: 'Plataforma de Minigolf',
    description: 'Administra partidas de minigolf y torneos digitales',
    url: 'https://baja-minigolf.vercel.app',
    siteName: 'Baja Mini Golf',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Baja Mini Golf'
      }
    ],
    locale: 'es_ES',
    type: 'website'
  }
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
