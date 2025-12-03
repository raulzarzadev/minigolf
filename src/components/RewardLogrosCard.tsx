'use client'

import { CheckCircle2, Gift, Loader2 } from 'lucide-react'
import { FC, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { consumeUserTirada, incrementUserTiradasPendientes } from '@/lib/db'
import {
  getAllRewardStates,
  loadRewardState,
  markPrizeDelivered,
  PrizeTier,
  persistRewardState,
  prizeCatalog,
  RewardPrize,
  RewardRoll,
  RewardState,
  rollPrizeOutcome
} from '@/lib/rewards'
import {
  ROULETTE_SPIN_DURATION_MS,
  rouletteGradient,
  rouletteSegmentAngle,
  rouletteSegments
} from '@/lib/roulette'
import { Game } from '@/types'

interface RewardLogrosCardProps {
  games: Game[]
}

const RewardLogrosCard: FC<RewardLogrosCardProps> = ({ games }) => {
  const [rewardStates, setRewardStates] = useState<RewardState[]>([])
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const [currentState, setCurrentState] = useState<RewardState | null>(null)
  const [loading, setLoading] = useState(true)
  const [adminRollInput, setAdminRollInput] = useState('1')
  const [adminStatus, setAdminStatus] = useState<string | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [wheelRotation, setWheelRotation] = useState(0)
  const [lastResult, setLastResult] = useState<RewardPrize | null>(null)
  const spinTimeoutRef = useRef<number | null>(null)
  const { user, isAdmin, refreshUser } = useAuth()

  const gameOptions = useMemo(() => {
    return rewardStates.map((state) => {
      const game = games.find((g) => g.id === state.gameId)
      const dateLabel = game
        ? new Date(game.createdAt).toLocaleDateString('es-MX', {
            month: 'short',
            day: 'numeric'
          })
        : 'Partida'
      const players = game?.players.length || 1
      return {
        value: state.gameId,
        label: `${dateLabel} · ${players} jugador${players !== 1 ? 'es' : ''}`
      }
    })
  }, [games, rewardStates])

  useEffect(() => {
    const states = getAllRewardStates()
    setRewardStates(states)

    if (states.length > 0) {
      const fallback = states[0]
      setSelectedGameId(fallback.gameId)
      setCurrentState(loadRewardState(fallback.gameId))
      setLoading(false)
      return
    }

    const fallbackId = user ? `global-${user.id}` : 'global'
    const fallbackState = loadRewardState(fallbackId)
    setRewardStates([fallbackState])
    setSelectedGameId(fallbackId)
    setCurrentState(fallbackState)
    setLoading(false)
  }, [user?.id, user])

  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) {
        window.clearTimeout(spinTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!selectedGameId) {
      setCurrentState(null)
      return
    }
    setCurrentState(loadRewardState(selectedGameId))
    setLastResult(null)
  }, [selectedGameId])

  const rollHistory = currentState?.rollHistory ?? []

  const pendingPrizes = useMemo(
    () =>
      rollHistory.filter(
        (roll): roll is RewardRoll & { tier: PrizeTier } =>
          roll.tier !== 'none' && !roll.delivered
      ),
    [rollHistory]
  )

  const claimedPrizes = useMemo(
    () =>
      rollHistory.filter(
        (roll): roll is RewardRoll & { tier: PrizeTier } =>
          roll.tier !== 'none' && Boolean(roll.delivered)
      ),
    [rollHistory]
  )

  const selectedGame = currentState
    ? games.find((game) => game.id === currentState.gameId)
    : undefined
  const rollsAvailable =
    user?.tiradas?.pendientes ?? currentState?.availableRolls ?? 0
  const isFinishedGame = selectedGame
    ? selectedGame.status === 'finished'
    : true
  const rouletteHelperMessage = isFinishedGame
    ? rollsAvailable > 0
      ? `${rollsAvailable} tirada(s) disponible(s)`
      : 'Completa acciones pendientes para ganar más tiradas'
    : 'Termina esta partida para desbloquear las tiradas'
  const lastResultMeta =
    lastResult && lastResult !== 'none' ? prizeCatalog[lastResult] : null
  const rouletteStatusLabel = lastResult
    ? (lastResultMeta?.label ?? 'Sin premio esta vez')
    : 'Listo para girar'
  const rouletteStatusDescription = lastResult
    ? lastResult !== 'none'
      ? (lastResultMeta?.description ?? 'Reclámalo con el staff.')
      : 'Esta vez no tocó premio, vuelve a intentarlo.'
    : 'Pulsa la ruleta cuando tengas tiradas disponibles.'

  const handleSpinRoulette = () => {
    if (
      !currentState ||
      !isFinishedGame ||
      rollsAvailable <= 0 ||
      isSpinning ||
      !user
    ) {
      return
    }

    setIsSpinning(true)
    setLastResult(null)

    const tier = rollPrizeOutcome()
    const newRoll: RewardRoll = {
      id: `${tier}-${Date.now()}`,
      tier,
      timestamp: Date.now(),
      delivered: false
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

    const activeGameId = currentState.gameId

    if (spinTimeoutRef.current) {
      window.clearTimeout(spinTimeoutRef.current)
    }

    spinTimeoutRef.current = window.setTimeout(async () => {
      try {
        const latestState = loadRewardState(activeGameId)
        const updatedState = persistRewardState(activeGameId, {
          availableRolls: Math.max(0, latestState.availableRolls - 1),
          rollHistory: [newRoll, ...latestState.rollHistory]
        })

        setCurrentState(updatedState)
        setRewardStates((prev) =>
          prev.map((state) =>
            state.gameId === updatedState.gameId ? updatedState : state
          )
        )

        await consumeUserTirada(user.id, 1)
        await refreshUser()
      } catch (error) {
        console.error('Error consumiendo tirada tras girar ruleta:', error)
      } finally {
        setIsSpinning(false)
        setLastResult(tier)
        spinTimeoutRef.current = null
      }
    }, ROULETTE_SPIN_DURATION_MS)
  }

  const handleAdminGrant = async () => {
    if (!currentState || !user || !isAdmin) return
    const rollsToGrant = Math.max(1, Math.floor(Number(adminRollInput) || 0))

    try {
      const updatedTiradas = await incrementUserTiradasPendientes(
        user.id,
        rollsToGrant
      )

      const updatedState = persistRewardState(currentState.gameId, {
        availableRolls: updatedTiradas.pendientes
      })

      setCurrentState(updatedState)
      setRewardStates((prev) =>
        prev.map((state) =>
          state.gameId === updatedState.gameId ? updatedState : state
        )
      )

      setAdminRollInput('1')
      setAdminStatus(`+${rollsToGrant} tirada(s) asignada(s)`)
      await refreshUser()
    } catch (error) {
      console.error('Error asignando tiradas manuales:', error)
      setAdminStatus('No se pudo asignar tiradas')
    } finally {
      setTimeout(() => setAdminStatus(null), 2500)
    }
  }

  const handleMarkDelivered = (rollId: string) => {
    if (!currentState || isAdmin) return
    const updatedState = markPrizeDelivered({
      admin: user,
      gameId: currentState.gameId,
      rollId
    })
    if (!updatedState) return

    setCurrentState(updatedState)
    setRewardStates((prev) =>
      prev.map((state) =>
        state.gameId === updatedState.gameId ? updatedState : state
      )
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-green-600 mx-auto" />
      </div>
    )
  }

  if (!currentState) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 text-center text-sm text-gray-600">
        Completa una partida y visita la celebración para desbloquear premios.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">Logros</h4>
          {!isFinishedGame && (
            <p className="text-[11px] text-gray-500 mt-1">
              Termina la partida y completa acciones para ganar tiradas y
              premios.
            </p>
          )}
        </div>
        {rewardStates.length > 1 && (
          <select
            value={selectedGameId ?? ''}
            onChange={(event) => setSelectedGameId(event.target.value)}
            disabled={isSpinning}
            className="text-xs border border-gray-300 rounded-lg px-2 py-1 disabled:opacity-50"
          >
            {gameOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {isAdmin && (
        <div className="flex flex-wrap items-center gap-2 border border-dashed border-gray-200 rounded-lg p-2 text-xs">
          <span className="font-semibold text-gray-700">Modo staff</span>
          <input
            type="number"
            min={1}
            value={adminRollInput}
            onChange={(event) => setAdminRollInput(event.target.value)}
            className="w-16 border border-gray-300 rounded px-2 py-1"
          />
          <button
            type="button"
            onClick={handleAdminGrant}
            className="px-3 py-1 rounded bg-black text-white font-semibold"
          >
            Dar tiradas
          </button>
          {adminStatus && (
            <span className="text-green-600 font-medium">{adminStatus}</span>
          )}
        </div>
      )}

      <div className="space-y-4">
        <div className="rounded-2xl border border-gray-200 p-4 space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleSpinRoulette}
                disabled={!isFinishedGame || rollsAvailable === 0 || isSpinning}
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
                      {isSpinning ? 'Girando...' : 'Tocar para girar'}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {rollsAvailable} tirada(s)
                    </p>
                  </div>
                </div>
              </button>
              <p className="text-[11px] text-gray-500 text-center">
                {isFinishedGame
                  ? 'Deja que el staff valide el premio al terminar el giro.'
                  : 'Termina la partida para activar la ruleta.'}
              </p>
            </div>

            <div className="flex-1 space-y-2">
              <p className="text-xs text-gray-500">Tiradas disponibles</p>
              <p className="text-3xl font-bold text-gray-900">
                {rollsAvailable}
              </p>
              <p className="text-[11px] text-gray-500">
                {rouletteHelperMessage}
              </p>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Último resultado</p>
                <p className="text-sm font-semibold text-gray-900">
                  {rouletteStatusLabel}
                </p>
                <p className="text-[11px] text-gray-500">
                  {rouletteStatusDescription}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSpinRoulette}
                disabled={!isFinishedGame || rollsAvailable === 0 || isSpinning}
                className="w-full inline-flex items-center justify-center px-4 py-2 rounded-2xl bg-green-500 text-black font-semibold text-xs hover:bg-green-400 disabled:opacity-40"
              >
                {isSpinning ? 'Girando...' : 'Girar ruleta'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600">
            {rouletteSegments.map((segment) => (
              <div
                key={segment.tier}
                className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white px-2 py-1.5"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="font-semibold text-gray-900">
                  {segment.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-yellow-900">
              Premios por reclamar
            </p>
            <Gift className="h-4 w-4 text-yellow-700" />
          </div>
          {pendingPrizes.length > 0 ? (
            <div className="space-y-2">
              {pendingPrizes.map((roll) => {
                const reward = prizeCatalog[roll.tier]
                return (
                  <div
                    key={roll.id}
                    className="flex items-start justify-between gap-3 rounded-xl bg-white border border-yellow-100 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {reward?.label ?? 'Premio sorpresa'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {reward?.description ?? 'Reclámalo con el staff.'}
                      </p>
                      <span className="text-[11px] text-gray-400">
                        Ganado el{' '}
                        {new Date(roll.timestamp).toLocaleDateString('es-MX', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleMarkDelivered(roll.id)}
                        className="text-[11px] font-semibold text-yellow-900 border border-yellow-400 rounded px-2 py-0.5 hover:bg-yellow-100"
                      >
                        Marcar entregado
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-yellow-900">
              No tienes premios pendientes por reclamar.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-green-900">
              Premios que ya reclamaste
            </p>
            <CheckCircle2 className="h-4 w-4 text-green-700" />
          </div>
          {claimedPrizes.length > 0 ? (
            <div className="space-y-2">
              {claimedPrizes.map((roll) => {
                const reward = prizeCatalog[roll.tier]
                const deliveredDate = roll.deliveredAt ?? roll.timestamp
                return (
                  <div
                    key={roll.id}
                    className="flex items-center justify-between rounded-xl bg-white border border-green-100 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {reward?.label ?? 'Premio reclamado'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {reward?.description ?? ''}
                      </p>
                      <span className="text-[11px] text-gray-400">
                        Entregado el{' '}
                        {new Date(deliveredDate).toLocaleDateString('es-MX', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <span className="inline-flex items-center text-[11px] font-semibold text-green-700">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Entregado
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-green-900">
              Aún no has reclamado premios.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default RewardLogrosCard
