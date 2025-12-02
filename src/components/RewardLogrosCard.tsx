'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Game } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import {
  getAllRewardStates,
  loadRewardState,
  persistRewardState,
  prizeCatalog,
  PrizeTier,
  RewardRoll,
  RewardState,
  grantAdminRolls,
  rollPrizeOutcome,
  markPrizeDelivered
} from '@/lib/rewards'
import { CheckCircle2, Dice5, Gift, Loader2 } from 'lucide-react'

interface RewardLogrosCardProps {
  games: Game[]
}

const RewardLogrosCard: React.FC<RewardLogrosCardProps> = ({ games }) => {
  const [rewardStates, setRewardStates] = useState<RewardState[]>([])
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const [currentState, setCurrentState] = useState<RewardState | null>(null)
  const [loading, setLoading] = useState(true)
  const [adminRollInput, setAdminRollInput] = useState('1')
  const [adminStatus, setAdminStatus] = useState<string | null>(null)
  const { user } = useAuth()

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
    const fallback = states[0] ?? null
    const fallbackId = fallback?.gameId ?? null
    setSelectedGameId(fallbackId)
    setCurrentState(fallbackId ? loadRewardState(fallbackId) : null)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!selectedGameId) {
      setCurrentState(null)
      return
    }
    setCurrentState(loadRewardState(selectedGameId))
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
  const rollsAvailable = currentState?.availableRolls ?? 0
  const isFinishedGame = selectedGame?.status === 'finished'
  const diceHelperMessage = isFinishedGame
    ? rollsAvailable > 0
      ? `${rollsAvailable} tiro(s) disponible(s)`
      : 'Completa acciones pendientes para ganar más dados'
    : 'Termina esta partida para desbloquear los dados'

  const handleRollFromLogros = () => {
    if (!currentState || !isFinishedGame || rollsAvailable <= 0) return

    const tier = rollPrizeOutcome()
    const newRoll: RewardRoll = {
      id: `${tier}-${Date.now()}`,
      tier,
      timestamp: Date.now(),
      delivered: false
    }

    const updatedState = persistRewardState(currentState.gameId, {
      availableRolls: Math.max(0, rollsAvailable - 1),
      rollHistory: [newRoll, ...currentState.rollHistory]
    })

    setCurrentState(updatedState)
    setRewardStates((prev) =>
      prev.map((state) =>
        state.gameId === updatedState.gameId ? updatedState : state
      )
    )
  }

  const handleAdminGrant = () => {
    if (!currentState || !user?.isAdmin) return
    const rollsToGrant = Math.max(1, Math.floor(Number(adminRollInput) || 0))
    const updatedState = grantAdminRolls({
      admin: user,
      gameId: currentState.gameId,
      rolls: rollsToGrant
    })
    if (!updatedState) return

    setCurrentState(updatedState)
    setRewardStates((prev) =>
      prev.map((state) =>
        state.gameId === updatedState.gameId ? updatedState : state
      )
    )
    setAdminRollInput('1')
    setAdminStatus(`+${rollsToGrant} dado(s) asignado(s)`)
    setTimeout(() => setAdminStatus(null), 2500)
  }

  const handleMarkDelivered = (rollId: string) => {
    if (!currentState || !user?.isAdmin) return
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
              Termina la partida y completa acciones para ganar tiros de dado y
              premios.
            </p>
          )}
        </div>
        {rewardStates.length > 1 && (
          <select
            value={selectedGameId ?? ''}
            onChange={(event) => setSelectedGameId(event.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2 py-1"
          >
            {gameOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {user?.isAdmin && (
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
            Dar dados
          </button>
          {adminStatus && (
            <span className="text-green-600 font-medium">{adminStatus}</span>
          )}
        </div>
      )}

      <div className="space-y-4">
        <div className="rounded-2xl border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-gray-500">Dados disponibles</p>
            <p className="text-3xl font-bold text-gray-900">{rollsAvailable}</p>
            <p className="text-[11px] text-gray-500">{diceHelperMessage}</p>
          </div>
          <button
            type="button"
            onClick={handleRollFromLogros}
            disabled={!isFinishedGame || rollsAvailable === 0}
            className="inline-flex items-center px-4 py-2 rounded-2xl bg-green-500 text-black font-semibold text-xs hover:bg-green-400 disabled:opacity-40"
          >
            <Dice5 className="h-4 w-4 mr-2" /> Tirar dado
          </button>
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
                    {user?.isAdmin && (
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
