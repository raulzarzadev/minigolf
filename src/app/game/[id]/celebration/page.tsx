'use client'

import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Gift,
  Instagram,
  Loader2,
  Save,
  Trophy
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { subscribeToGame } from '@/lib/db'
import { getLocalGame, isLocalGame } from '@/lib/localStorage'
import {
  loadRewardState,
  PrizeTier,
  persistRewardState,
  prizeCatalog,
  RewardStepId,
  rollPrizeOutcome,
  setLastInstruction,
  triggerRewardStepAction
} from '@/lib/rewards'
import {
  ROULETTE_SPIN_DURATION_MS,
  rouletteGradient,
  rouletteSegmentAngle,
  rouletteSegments
} from '@/lib/roulette'
import { Game } from '@/types'

type StepConfig = {
  id: RewardStepId
  title: string
  description: string
  icon: typeof Save
}

const stepConfigs: StepConfig[] = [
  {
    id: 'register',
    title: 'Registrar mi partida',
    description:
      'Haz pública tu partida para que pueda mostrarse en el ranking global.',
    icon: Save
  },
  {
    id: 'follow',
    title: 'Seguirnos en Instagram',
    description:
      'Marca el paso y muestra en taquilla que ya nos sigues; el staff valida y te libera el tiro extra.',
    icon: Instagram
  },
  {
    id: 'share',
    title: 'Publicar tu foto',
    description:
      'Publica una foto o reel con #BajaMiniGolf y valida en caja para recibir la tirada adicional.',
    icon: Camera
  }
]

type RollResult = {
  id: string
  tier: PrizeTier | 'none'
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
  const [rewardInitialized, setRewardInitialized] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)
  const [wheelRotation, setWheelRotation] = useState(0)
  const [lastResult, setLastResult] = useState<RollResult['tier'] | null>(null)
  const spinTimeoutRef = useRef<number | null>(null)

  const gameId = params.id as string

  useEffect(() => {
    if (!gameId) return
    const stored = loadRewardState(gameId)
    setCompletedSteps(stored.completedSteps)
    setAvailableRolls(stored.availableRolls)
    setRollHistory(stored.rollHistory)
    setLastResult(stored.rollHistory[0]?.tier ?? null)
    setRewardInitialized(true)
  }, [gameId])

  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) {
        window.clearTimeout(spinTimeoutRef.current)
      }
    }
  }, [])

  const syncRewardState = (
    next: Partial<{
      completedSteps: Record<string, boolean>
      availableRolls: number
      rollHistory: RollResult[]
      lastInstruction: RewardStepId | null
    }>
  ) => {
    if (!gameId) return
    persistRewardState(gameId, next)
  }

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

  const handleMarkStep = async (stepId: RewardStepId) => {
    if (!rewardInitialized || completedSteps[stepId]) return
    triggerRewardStepAction(stepId, { gameId, user })
    const updatedSteps = { ...completedSteps, [stepId]: true }
    const nextRolls = availableRolls + 1
    setCompletedSteps(updatedSteps)
    setAvailableRolls(nextRolls)
    syncRewardState({
      completedSteps: updatedSteps,
      availableRolls: nextRolls,
      lastInstruction: null
    })
    setLastInstruction(gameId, null)
  }

  const handleSpinRoulette = () => {
    if (!rewardInitialized || availableRolls <= 0 || !isFinished || isSpinning)
      return

    setIsSpinning(true)
    setLastResult(null)

    const tier = rollPrizeOutcome()
    const newRoll: RollResult = {
      id: `${tier}-${Date.now()}`,
      tier,
      timestamp: Date.now()
    }

    const segmentIndex = rouletteSegments.findIndex(
      (segment) => segment.tier === tier
    )
    const safeIndex = segmentIndex === -1 ? 0 : segmentIndex
    const extraSpins = 4 + Math.floor(Math.random() * 3)
    const rotationOffset =
      safeIndex * rouletteSegmentAngle + rouletteSegmentAngle / 2

    setWheelRotation((prev) => {
      const normalizedPrev = prev % 360
      const alignmentOffset = rotationOffset - normalizedPrev
      return prev + extraSpins * 360 + alignmentOffset
    })

    if (spinTimeoutRef.current) {
      window.clearTimeout(spinTimeoutRef.current)
    }

    spinTimeoutRef.current = window.setTimeout(() => {
      setRollHistory((prevHistory) => {
        const updatedHistory = [newRoll, ...prevHistory]
        setAvailableRolls((prevRolls) => {
          const nextRolls = Math.max(0, prevRolls - 1)
          syncRewardState({
            rollHistory: updatedHistory,
            availableRolls: nextRolls
          })
          return nextRolls
        })
        return updatedHistory
      })
      setIsSpinning(false)
      setLastResult(tier)
      spinTimeoutRef.current = null
    }, ROULETTE_SPIN_DURATION_MS)
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
  const rouletteHelperMessage = isFinished
    ? availableRolls > 0
      ? `${availableRolls} tirada(s) disponible(s)`
      : 'Completa acciones pendientes para ganar más tiradas'
    : 'Termina la partida para desbloquear las tiradas'
  const lastResultMeta =
    lastResult && lastResult !== 'none' ? prizeCatalog[lastResult] : null
  const rouletteStatusLabel = lastResult
    ? (lastResultMeta?.label ?? 'Sin premio esta vez')
    : 'Listo para girar'
  const rouletteStatusDescription = lastResult
    ? lastResult !== 'none'
      ? (lastResultMeta?.description ?? 'Reclámalo con el staff.')
      : 'Esta vez no salió premio. Inténtalo de nuevo.'
    : 'Pulsa la ruleta cuando tengas tiradas disponibles.'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto py-4 px-3 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
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
              Termina la partida para habilitar las tiradas.
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
                Cada acción desbloquea 1 tirada extra
              </h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Tiradas disponibles</p>
              <span className="text-2xl font-bold text-gray-900">
                {availableRolls}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {stepConfigs.map((step) => {
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
                    {completed ? '¡Tirada ganada!' : 'Quiero mi tirada'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-blue-50 via-slate-50 to-emerald-50 p-4 text-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-700">
                Zona de tiradas
              </p>
              <h3 className="text-xl font-semibold">Gira para ganar</h3>
              <p className="text-sm text-slate-600">
                Premios físicos y experiencias especiales dentro del parque.
              </p>
            </div>
            <Gift className="h-8 w-8 text-emerald-700" />
          </div>
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={handleSpinRoulette}
                disabled={!isFinished || availableRolls === 0 || isSpinning}
                className="relative h-44 w-44 rounded-full focus-visible:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-4 left-1/2 flex -translate-x-1/2 flex-col items-center"
                >
                  <div className="h-5 w-1 rounded bg-white shadow" />
                  <div
                    className="drop-shadow"
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: '9px solid transparent',
                      borderRight: '9px solid transparent',
                      borderTop: '14px solid white'
                    }}
                  />
                </div>
                <div
                  className="absolute inset-0 rounded-full border-4 border-white shadow-lg transition-transform ease-out"
                  style={{
                    backgroundImage: rouletteGradient,
                    transform: `rotate(${wheelRotation}deg)`,
                    transitionDuration: `${ROULETTE_SPIN_DURATION_MS}ms`
                  }}
                />
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <div className="absolute inset-3 rounded-full bg-white/90 backdrop-blur flex flex-col items-center justify-center text-center px-4">
                    <p className="text-[11px] uppercase tracking-wide text-gray-400">
                      Ruleta
                    </p>
                    <p className="text-base font-semibold text-gray-900">
                      {isSpinning ? 'Girando...' : 'Toca para girar'}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {availableRolls} tirada(s)
                    </p>
                  </div>
                </div>
              </button>
              <p className="text-xs text-slate-500 text-center">
                {isFinished
                  ? 'Deja que el staff valide el premio al terminar el giro.'
                  : 'Termina la partida para activar la ruleta.'}
              </p>
            </div>
            <div className="flex-1 space-y-3">
              <p className="text-xs text-slate-500">Tiradas disponibles</p>
              <p className="text-3xl font-bold text-emerald-700">
                {availableRolls}
              </p>
              <p className="text-xs text-slate-500">{rouletteHelperMessage}</p>
              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1">
                <p className="text-xs text-slate-500">Último resultado</p>
                <p className="text-sm font-semibold text-slate-900">
                  {rouletteStatusLabel}
                </p>
                <p className="text-xs text-slate-500">
                  {rouletteStatusDescription}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSpinRoulette}
                disabled={!isFinished || availableRolls === 0 || isSpinning}
                className="w-full inline-flex items-center justify-center px-4 py-3 rounded-2xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-400 disabled:opacity-40"
              >
                {isSpinning ? 'Girando...' : 'Girar ruleta'}
              </button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
            {rouletteSegments.map((segment) => (
              <div
                key={segment.tier}
                className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-2 py-1.5"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="font-semibold text-slate-900">
                  {segment.label}
                </span>
              </div>
            ))}
          </div>
          {rollHistory.length > 0 ? (
            <div className="mt-4 space-y-2">
              {rollHistory.map((roll) => {
                const prize =
                  roll.tier === 'none'
                    ? {
                        label: 'Sin premio',
                        description:
                          'Esta vez no salió premio, vuelve a intentarlo.',
                        accent: 'bg-gray-100 text-gray-600'
                      }
                    : prizeCatalog[roll.tier]
                return (
                  <div
                    key={roll.id}
                    className="flex items-center justify-between bg-white rounded-xl px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {prize.label}
                      </p>
                      <p className="text-xs text-slate-500">
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
              Aún no tienes premios mostrados. Completa un paso y gira la ruleta
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
