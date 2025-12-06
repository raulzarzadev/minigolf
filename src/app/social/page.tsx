'use client'
import { ArrowLeft, Copy, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import {
  Facebook,
  GoogleMaps,
  Instagram,
  ReviewsOutline,
  Tripadvisor
} from '@/components/icons'

const socials = [
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Comparte una historia o reel con #BajaMiniGolf.',
    actionLabel: 'Abrir Instagram',
    href: 'https://instagram.com/bajaminigolf',
    accent: 'bg-gradient-to-r from-pink-500 to-yellow-400 text-white',
    icon: Instagram
  },
  {
    id: 'facebook',
    name: 'Facebook',
    description: 'Publica en tu muro y cuéntanos tu score.',
    actionLabel: 'Abrir Facebook',
    href: 'https://www.facebook.com/bajaminigolf',
    accent: 'bg-blue-600 text-white',
    icon: Facebook
  },
  {
    id: 'google-maps',
    name: 'Google Maps',
    description: 'Visítanos y conoce nuestra ubicación.',
    actionLabel: 'Ver en Maps',
    href: 'https://maps.app.goo.gl/NuP78WQzBeULyK397',
    accent: 'bg-green-600 text-white',
    icon: GoogleMaps
  },
  {
    id: 'google-review',
    name: 'Deja tu opinión',
    description: 'Comparte tu experiencia en Google Maps.',
    actionLabel: 'Dejar reseña',
    href: 'https://g.page/r/CXxixU3dPuehEBM/review',
    accent: 'bg-amber-500 text-white',
    icon: ReviewsOutline
  },
  {
    id: 'tripadvisor',
    name: 'TripAdvisor',
    description: 'Lee opiniones de otros visitantes.',
    actionLabel: 'Ver en TripAdvisor',
    href: 'https://www.tripadvisor.com.mx/Attraction_Review-g150771-d24023819-Reviews-Baja_Mini_Golf-La_Paz_Baja_California.html',
    accent: 'bg-emerald-700 text-white',
    icon: Tripadvisor
  }
]

const defaultCaption =
  'Jugando mini golf en #BajaMiniGolf 🎉 ¡Ven y reta a tus amigos! @bajaminigolf'

export default function SocialPage() {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(defaultCaption)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (error) {
      console.error('No se pudo copiar el texto', error)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </button>
          <span className="text-xs uppercase tracking-wide text-gray-500">
            Redes sociales
          </span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-green-700 uppercase">
                Comparte y gana
              </p>
              <h1 className="text-lg font-semibold text-gray-900">
                Publica en tus redes para ganar premios
              </h1>
              <p className="text-sm text-gray-600">
                Copia el texto sugerido y abre la red que prefieras.Siguenos y
                uestra la publicación al staff para validar.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700"
            >
              <Copy className="h-4 w-4" />{' '}
              {copied ? '¡Copiado!' : 'Copiar texto'}
            </button>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
            {defaultCaption}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {socials.map((social) => (
            <div
              key={social.id}
              className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {social?.icon && <social.icon className="h-8 w-8" />}

                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {social.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {social.description}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Link
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50"
                >
                  <ExternalLink className="h-4 w-4" /> {social.actionLabel}
                </Link>
                <span className="text-[11px] text-gray-500">
                  Se abre en nueva pestaña
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
