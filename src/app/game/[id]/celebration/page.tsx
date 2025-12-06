'use client'

import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Loader2,
  Save,
  Instagram
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { subscribeToGame } from '@/lib/db'
import { getLocalGame, isLocalGame } from '@/lib/localStorage'
import { incrementUserTries } from '@/lib/tries'
import { Game } from '@/types'
import { RewardPrize } from '@/types/rewards'
import RewardLogrosCard from '@/components/RewardLogrosCard'

type RewardStepId = 'register' | 'follow' | 'share'

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
      'Marca el paso y muestra en taquilla que ya nos sigues; el staff valida y te libera la tirada extra.',
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
  tier: RewardPrize
  timestamp: number
  prizeId?: string
  prizeTitle?: string
  prizeDescription?: string
}

type CelebrationState = {
  completedSteps: Partial<Record<RewardStepId, boolean>>
  rollHistory: RollResult[]
}

type CelebrationStorage = Record<string, CelebrationState>

const CELEBRATION_STORAGE_KEY = 'baja-celebration-center'

const readCelebrationStorage = (): CelebrationStorage => {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(CELEBRATION_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CelebrationStorage) : {}
  } catch {
    return {}
  }
}

const writeCelebrationStorage = (payload: CelebrationStorage) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      CELEBRATION_STORAGE_KEY,
      JSON.stringify(payload)
    )
  } catch {
    // ignore storage quota errors
  }
}

const loadCelebrationState = (gameId: string): CelebrationState => {
  const storage = readCelebrationStorage()
  return (
    storage[gameId] ?? {
      completedSteps: {},
      rollHistory: []
    }
  )
}

const persistCelebrationState = (
  gameId: string,
  patch: Partial<CelebrationState>
): CelebrationState => {
  const storage = readCelebrationStorage()
  const current = storage[gameId] ?? {
    completedSteps: {},
    rollHistory: []
  }
  const next: CelebrationState = {
    completedSteps: patch.completedSteps ?? current.completedSteps,
    rollHistory: patch.rollHistory ?? current.rollHistory
  }
  storage[gameId] = next
  writeCelebrationStorage(storage)
  return next
}

export default function CelebrationPage() {
  const params = useParams()
  const router = useRouter()
  const { user, refreshUser, signInWithGoogle } = useAuth()
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  const [availableRolls, setAvailableRolls] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<
    Partial<Record<RewardStepId, boolean>>
  >({})
  const [ready, setReady] = useState(false)

  const spinTimeoutRef = useRef<number | null>(null)

  const gameId = params.id as string

  useEffect(() => {
    if (!gameId) return
    const stored = loadCelebrationState(gameId)
    setCompletedSteps(stored.completedSteps)
    setReady(true)
  }, [gameId])

  useEffect(() => {
    if (typeof user?.tries?.triesLeft === 'number') {
      setAvailableRolls(user.tries.triesLeft)
    }
  }, [user?.tries?.triesLeft])

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

  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) {
        window.clearTimeout(spinTimeoutRef.current)
      }
    }
  }, [])

  const runStepAction = async (stepId: RewardStepId): Promise<boolean> => {
    if (typeof window === 'undefined') return false

    let activeUser = user

    if (!activeUser) {
      try {
        await signInWithGoogle()
        await refreshUser()
        activeUser = user ?? null
      } catch (error) {
        console.error('Error al iniciar sesión para reclamar tirada:', error)
        return false
      }
    }

    if (!activeUser) {
      return false
    }

    try {
      const updated = await incrementUserTries(activeUser.id, 1)
      setAvailableRolls(updated.triesLeft)
      await refreshUser()
    } catch (error) {
      console.error('Error incrementando tirada tras acción:', error)
      return false
    }

    if (stepId === 'register') {
      router.push('/profile')
    } else {
      router.push('/social')
    }

    return true
  }

  const handleMarkStep = async (stepId: RewardStepId) => {
    if (!ready || completedSteps[stepId]) return
    const granted = await runStepAction(stepId)
    if (!granted) {
      return
    }
    const updatedSteps = { ...completedSteps, [stepId]: true }
    setCompletedSteps(updatedSteps)
    persistCelebrationState(gameId, { completedSteps: updatedSteps })
  }

  const isFinished = game?.status === 'finished'

  const handleBackToGame = () => {
    router.push(`/game/${gameId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-green-600" />
        </div>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="min-h-screen">
        <div className="max-w-2xl mx-auto py-16 px-4 text-center">
          <p className="text-gray-700">
            No encontramos la partida. Vuelve a la lista de juegos.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
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
        <RewardLogrosCard />
      </div>
    </div>
  )
}
