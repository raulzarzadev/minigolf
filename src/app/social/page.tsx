'use client'
import { ArrowLeft, Copy, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'

const socials = [
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Comparte una historia o reel con #BajaMiniGolf.',
    actionLabel: 'Abrir Instagram',
    href: 'https://instagram.com/bajaminigolf'
  },
  // {
  //   id: 'tiktok',
  //   name: 'TikTok',
  //   description: 'Sube un clip corto de tu partida y etiqueta @bajaminigolf.',
  //   actionLabel: 'Abrir TikTok',
  //   href: 'https://www.tiktok.com/'
  // },
  {
    id: 'facebook',
    name: 'Facebook',
    description: 'Publica en tu muro y cuéntanos tu score.',
    actionLabel: 'Abrir Facebook',
    href: 'https://www.facebook.com/bajaminigolf'
  }
  // {
  //   id: 'x',
  //   name: 'X (Twitter)',
  //   description: 'Comparte un tweet con el hashtag y menciónanos.',
  //   actionLabel: 'Tweetear',
  //   href: 'https://twitter.com/intent/tweet?text=Jugando%20mini%20golf%20en%20%23BajaMiniGolf%20%F0%9F%8E%81%20%40bajaminigolf'
  // }
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
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {social.name}
                  </p>
                  <p className="text-xs text-gray-600">{social.description}</p>
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
