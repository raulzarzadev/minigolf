'use client'

import { Clock, Users } from 'lucide-react'
import Link from 'next/link'
import { FC } from 'react'
import { useActiveGame } from '@/hooks/useActiveGame'

const ActiveGameBanner: FC = () => {
  const { activeGame } = useActiveGame(60000)

  if (!activeGame) {
    return null
  }

  const label = activeGame.isMultiplayer
    ? 'Partida multijugador'
    : 'Partida individual'
  const badgeLabel = activeGame.isLocal ? 'Guardada aquí' : 'Online'
  const playerLabel = `${activeGame.playerCount} jugador${
    activeGame.playerCount !== 1 ? 'es' : ''
  }`

  return (
    <div className="px-3 sm:px-6 lg:px-8 mt-2">
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-orange-500 via-orange-400 to-yellow-400 text-white shadow-xl">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),transparent_60%)]" />
        <div className="relative p-5 space-y-4">
          <div className="flex items-start gap-4">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/25 backdrop-blur-sm">
              <Clock className="h-7 w-7 text-white" />
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-300 animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-white" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
                Tienes una partida en curso
              </p>
              <p className="text-lg font-semibold leading-tight">{label}</p>
              <p className="text-sm text-white/90 flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>
                  {playerLabel} · {activeGame.holeCount} hoyos · {badgeLabel}
                </span>
              </p>
            </div>
          </div>

          <Link
            href={`/game/${activeGame.id}`}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-white/95 px-6 py-3 text-base font-semibold text-orange-600 shadow-md transition-all hover:bg-white touch-manipulation"
          >
            Continuar partida
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ActiveGameBanner
