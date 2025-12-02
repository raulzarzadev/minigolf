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
      <div className="rounded-2xl bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-400 text-white shadow-lg">
        <div className="p-4 flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Clock className="h-6 w-6 text-white" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-300 animate-ping"></span>
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-white"></span>
            </div>
            <div className="text-sm">
              <p className="text-xs uppercase tracking-wide text-white/80">
                Tienes una partida en curso
              </p>
              <p className="text-base font-semibold">{label}</p>
              <p className="text-xs text-white/80 flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                <span>
                  {playerLabel} · {activeGame.holeCount} hoyos · {badgeLabel}
                </span>
              </p>
            </div>
          </div>
          <Link
            href={`/game/${activeGame.id}`}
            className="inline-flex items-center justify-center px-4 py-2 bg-white text-orange-600 font-semibold rounded-xl shadow-sm hover:bg-orange-50 active:scale-95 transition-all text-sm touch-manipulation"
          >
            Continuar partida
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ActiveGameBanner
