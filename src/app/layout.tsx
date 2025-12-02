import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import LogoPreloader from '@/components/LogoPreloader'
import { AuthProvider } from '@/contexts/AuthContext'
import './globals.css'
import { ReactNode } from 'react'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'Baja Mini Golf',
  description:
    'Administra partidas de Baja Mini Golf y torneos digitales en La Paz, Baja California Sur.',
  keywords: [
    'baja mini golf',
    'torneos digitales',
    'La Paz',
    'Baja California Sur',
    'juegos de mesa',
    'administración de partidas',
    'mini golf',
    'minigolf',
    'entretenimiento',
    'cita de juego'
  ],
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png'
  },
  openGraph: {
    title: 'Baja Mini Golf',
    description:
      'Administra partidas de Baja Mini Golf y torneos digitales en La Paz, Baja California Sur.',
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
    locale: 'es_Mx',
    type: 'website'
  }
}

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="es">
      <head>
        <link
          rel="preload"
          href="/logo-baja-mini-golf.png"
          as="image"
          type="image/png"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#059669" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LogoPreloader />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
