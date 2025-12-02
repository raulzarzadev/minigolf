'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { Game } from '@/types'
import { subscribeToGame } from '@/lib/db'
import { getLocalGame, isLocalGame } from '@/lib/localStorage'
import {
  ArrowLeft,
  Dice5,
  Gift,
  Instagram,
  Camera,
  Save,
  Trophy,
  CheckCircle2,
  Loader2
} from 'lucide-react'

const instagramProfile = 'https://www.instagram.com/baja_mini_golf/'

const prizeCatalog = {
  small: {
    label: 'Premio chico',
    description: '1 partida de minigolf gratis para tu próxima visita.',
    accent: 'bg-green-100 text-green-800'
  },
  medium: {
    label: 'Premio mediano',
    description: 'Acceso al muro de escalar y foto en el mural de campeones.',
    accent: 'bg-blue-100 text-blue-800'
  },
  large: {
    label: 'Premio grande',
    description: 'Challenge sorpresa en otra atracción del parque.',
    accent: 'bg-purple-100 text-purple-800'
  }
} as const

type PrizeTier = keyof typeof prizeCatalog

interface RollResult {
  id: string
  tier: PrizeTier
  timestamp: number
}

export default function CelebrationPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>(
    {}
  )
  const [availableRolls, setAvailableRolls] = useState(0)
  const [rollHistory, setRollHistory] = useState<RollResult[]>([])

  const gameId = params.id as string

  useEffect(() => {
    if (!gameId) return

    if (isLocalGame(gameId)) {
      const local = getLocalGame(gameId)
      if (local) {
        setGame({ ...local, createdAt: new Date(local.createdAt) })
      }
      setLoading(false)
      return
    }

    const unsubscribe = subscribeToGame(gameId, (gameData) => {
      setGame(gameData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [gameId])

  const steps = useMemo(
    () => [
      {
        id: 'register',
        title: 'Registrar mi partida',
        description:
          'Sincroniza tu score con tu cuenta para participar en sorteos oficiales.',
        icon: Save,
        onAction: () => {
          if (typeof window === 'undefined') return
          const redirectTo = `/login?redirect=${encodeURIComponent(
            `/game/${gameId}/celebration`
          )}`
          if (user) {
            window.open('/profile', '_blank')
          } else {
            window.open(redirectTo, '_blank')
          }
        }
      },
      {
        id: 'follow',
        title: 'Seguirnos en Instagram',
        description:
          'Dale follow a @bajaminigolf y entérate de los próximos retos.',
        icon: Instagram,
        onAction: () => {
          if (typeof window === 'undefined') return
          window.open(instagramProfile, '_blank')
        }
      },
      {
        id: 'share',
        title: 'Publicar tu foto',
        description:
          'Sube una foto o reel etiquetándonos con #BajaMiniGolf para sumar otro tiro.',
        icon: Camera,
        onAction: async () => {
          if (typeof navigator === 'undefined') return
          try {
            await navigator.clipboard.writeText(
              '📸 Terminé mi partida en Baja Mini Golf. ¡Acepto el reto! #BajaMiniGolf #BajaBlast'
            )
            alert(
              'Texto copiado. Pega el copy al subir tu foto en Instagram 📲'
            )
          } catch {
            // ignore copy failures silently
          }
        }
      }
    ],
    [gameId, user]
  )

  const handleMarkStep = async (stepId: string) => {
    if (completedSteps[stepId]) return
    const step = steps.find((item) => item.id === stepId)
    step?.onAction?.()
    setCompletedSteps((prev) => ({ ...prev, [stepId]: true }))
    setAvailableRolls((prev) => prev + 1)
  }

  const handleRollDice = () => {
    if (availableRolls <= 0) return

    const random = Math.random()
    let tier: PrizeTier
    if (random < 0.55) tier = 'small'
    else if (random < 0.85) tier = 'medium'
    else tier = 'large'

    setRollHistory((prev) => [
      { id: `${tier}-${Date.now()}`, tier, timestamp: Date.now() },
      ...prev
    ])
    setAvailableRolls((prev) => Math.max(0, prev - 1))
  }

  const handleBackToGame = () => {
    router.push(`/game/${gameId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-green-600" />
        </div>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto py-16 px-4 text-center">
          <p className="text-gray-700">
            No encontramos la partida. Vuelve a la lista de juegos.
          </p>
        </div>
      </div>
    )
  }

  const isFinished = game.status === 'finished'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto py-4 px-3 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBackToGame}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver al marcador
          </button>
          <span className="text-xs uppercase tracking-wide text-gray-500">
            Centro de Recompensas
          </span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Partida</p>
              <h2 className="text-lg font-semibold text-gray-900">
                {game.isMultiplayer ? 'Multijugador' : 'Individual'} •{' '}
                {game.holeCount} hoyos
              </h2>
              <p className="text-xs text-gray-500">
                {new Date(game.createdAt).toLocaleDateString('es-MX', {
                  month: 'short',
                  day: 'numeric'
                })}{' '}
                · {game.players.length} jugador
                {game.players.length !== 1 ? 'es' : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Estatus</p>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  isFinished
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                }`}
              >
                {isFinished ? 'Finalizada' : 'Pendiente'}
              </span>
            </div>
          </div>
          {!isFinished && (
            <div className="mt-3 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
              Termina la partida para habilitar los dados.
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs uppercase text-green-600 font-semibold">
                Elige tus pasos
              </p>
              <h3 className="text-base font-semibold text-gray-900">
                Cada acción desbloquea 1 tiro de dados
              </h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Tiros disponibles</p>
              <span className="text-2xl font-bold text-gray-900">
                {availableRolls}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {steps.map((step) => {
              const Icon = step.icon
              const completed = completedSteps[step.id]
              return (
                <div
                  key={step.id}
                  className={`border rounded-2xl px-3 py-3 flex items-center justify-between gap-3 ${
                    completed
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-gray-700" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-gray-900">
                          {step.title}
                        </p>
                        {completed && (
                          <span className="inline-flex items-center text-[11px] font-semibold text-green-700">
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Listo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!isFinished || completed}
                    onClick={() => handleMarkStep(step.id)}
                    className={`text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${
                      completed
                        ? 'border-green-200 text-green-700 bg-white'
                        : isFinished
                        ? 'border-black text-black hover:bg-black hover:text-white'
                        : 'border-gray-200 text-gray-400'
                    }`}
                  >
                    {completed ? '¡Dado ganado!' : 'Quiero mi dado'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-black bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-300">
                Zona de dados
              </p>
              <h3 className="text-xl font-semibold">Tira para ganar</h3>
              <p className="text-sm text-gray-400">
                Premios físicos y experiencias especiales dentro del parque.
              </p>
            </div>
            <Gift className="h-8 w-8 text-green-300" />
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <button
              type="button"
              onClick={handleRollDice}
              disabled={!isFinished || availableRolls === 0}
              className="inline-flex items-center px-4 py-3 rounded-2xl bg-green-500 text-black font-semibold text-sm hover:bg-green-400 disabled:opacity-40"
            >
              <Dice5 className="h-5 w-5 mr-2" /> Tirar dado
            </button>
            <div className="text-xs text-gray-300">
              {availableRolls > 0
                ? `${availableRolls} tiro(s) restante(s)`
                : 'Completa acciones para ganar tiros'}
            </div>
          </div>
          {rollHistory.length > 0 ? (
            <div className="mt-4 space-y-2">
              {rollHistory.map((roll) => {
                const prize = prizeCatalog[roll.tier]
                return (
                  <div
                    key={roll.id}
                    className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold">{prize.label}</p>
                      <p className="text-xs text-gray-300">
                        {prize.description}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${prize.accent}`}
                    >
                      {new Date(roll.timestamp).toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-300">
              Aún no tienes premios mostrados. Completa un paso y tira los dados
              para descubrir tu recompensa.
            </p>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center mb-3">
            <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
            <p className="text-sm font-semibold text-gray-900">
              ¿Cómo reclamo mi premio físico?
            </p>
          </div>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>
              • Muestra este resultado en taquilla dentro de los próximos 30
              minutos.
            </li>
            <li>
              • El staff validará la captura y te entregará el beneficio
              correspondiente.
            </li>
            <li>• Premios sujetos a disponibilidad diaria.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
