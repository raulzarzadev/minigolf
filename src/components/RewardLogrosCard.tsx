'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Game } from '@/types'
import {
  getAllRewardStates,
  loadRewardState,
  persistRewardState,
  prizeCatalog,
  PrizeTier,
  RewardState,
  RewardStepId
} from '@/lib/rewards'
import { CheckCircle2, Dice5, Gift, Loader2, X } from 'lucide-react'

interface RewardLogrosCardProps {
  games: Game[]
}

const stepDetails: Record<
  RewardStepId,
  { label: string; instructions: string }
> = {
  register: {
    label: 'Registro',
    instructions:
      'Inicia sesión o crea tu cuenta y abre la partida desde el Centro de Recompensas para vincular tu marcador.'
  },
  follow: {
    label: 'Instagram',
    instructions:
      'Abre @bajaminigolf en Instagram, da follow y muestra tu perfil siguiendo la cuenta para validar el tiro.'
  },
  share: {
    label: 'Compartido',
    instructions:
      'Sube una foto o reel etiquetándonos con #BajaMiniGolf y el copy oficial para desbloquear este dado.'
  }
}

const RewardLogrosCard: React.FC<RewardLogrosCardProps> = ({ games }) => {
  const [rewardStates, setRewardStates] = useState<RewardState[]>([])
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const [currentState, setCurrentState] = useState<RewardState | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeStep, setActiveStep] = useState<RewardStepId | null>(null)

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

  const hydrate = () => {
    const states = getAllRewardStates()
    setRewardStates(states)
    const initial = states.find((state) => state.gameId === selectedGameId)
    const fallback = initial ?? states[0] ?? null
    setSelectedGameId(fallback?.gameId ?? null)
    setCurrentState(fallback ? loadRewardState(fallback.gameId) : null)
    setLoading(false)
  }

  useEffect(() => {
    hydrate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedGameId) {
      setCurrentState(null)
      return
    }
    setCurrentState(loadRewardState(selectedGameId))
    setActiveStep(null)
  }, [selectedGameId])

  useEffect(() => {
    setActiveStep(null)
  }, [currentState?.gameId])

  const handleRollFromLogros = () => {
    if (!currentState || currentState.availableRolls <= 0) return

    const random = Math.random()
    let tier: PrizeTier
    if (random < 0.55) tier = 'small'
    else if (random < 0.85) tier = 'medium'
    else tier = 'large'

    const newRoll = {
      id: `${tier}-${Date.now()}`,
      tier,
      timestamp: Date.now()
    }
    const updatedState = persistRewardState(currentState.gameId, {
      availableRolls: Math.max(0, currentState.availableRolls - 1),
      rollHistory: [newRoll, ...currentState.rollHistory]
    })

    setCurrentState(updatedState)
    setRewardStates((prev) =>
      prev.map((state) =>
        state.gameId === updatedState.gameId ? updatedState : state
      )
    )
  }

  const handleStepInfo = (stepId: RewardStepId) => {
    if (!currentState) return
    if (currentState.completedSteps[stepId]) return
    setActiveStep(stepId)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-green-600 mx-auto" />
      </div>
    )
  }

  if (rewardStates.length === 0 || !currentState) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 text-center text-sm text-gray-600">
        Completa una partida y visita la celebración para desbloquear premios.
      </div>
    )
  }

  const selectedGame = games.find((g) => g.id === currentState.gameId)
  const rollsAvailable = currentState.availableRolls

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-green-600 font-semibold uppercase">
            Logros
          </p>
          <h4 className="text-sm font-semibold text-gray-900">
            Tus dados y premios
          </h4>
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

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">Partida</p>
          <p className="text-sm font-medium text-gray-900">
            {selectedGame
              ? `${
                  selectedGame.isMultiplayer ? 'Multijugador' : 'Individual'
                } · ${selectedGame.holeCount} hoyos`
              : `ID ${currentState.gameId.slice(0, 6)}`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Dados disponibles</p>
          <span className="text-2xl font-bold text-gray-900">
            {rollsAvailable}
          </span>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-3 space-y-2">
        <p className="text-xs font-semibold text-gray-600">
          Acciones desbloqueadas
        </p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(stepDetails) as RewardStepId[]).map((stepId) => {
            const completed = currentState.completedSteps[stepId]
            return (
              <button
                type="button"
                key={stepId}
                onClick={() => handleStepInfo(stepId)}
                disabled={completed}
                className={`inline-flex items-center text-[11px] font-semibold px-2 py-1 rounded-full border transition ${
                  completed
                    ? 'border-green-200 bg-green-50 text-green-700 cursor-default'
                    : 'border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-700'
                }`}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {stepDetails[stepId].label}
              </button>
            )
          })}
        </div>
        {activeStep && !currentState.completedSteps[activeStep] && (
          <div className="border border-green-200 bg-white rounded-xl p-3 mt-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {stepDetails[activeStep].label}
                </p>
                <p className="text-xs text-gray-600">
                  {stepDetails[activeStep].instructions}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveStep(null)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Cerrar instrucciones"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-black bg-gradient-to-r from-gray-900 via-gray-800 to-black p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs uppercase text-gray-400">Zona de dados</p>
            <p className="text-base font-semibold">Continúa tirando</p>
            <p className="text-xs text-gray-400">
              Puedes seguir reclamando premios desde tus logros.
            </p>
          </div>
          <Gift className="h-6 w-6 text-green-300" />
        </div>
        <button
          type="button"
          onClick={handleRollFromLogros}
          disabled={rollsAvailable === 0}
          className="inline-flex items-center px-4 py-2 rounded-2xl bg-green-500 text-black font-semibold text-xs hover:bg-green-400 disabled:opacity-40"
        >
          <Dice5 className="h-4 w-4 mr-2" /> Tirar dado
        </button>
        <p className="text-[11px] text-gray-300 mt-2">
          {rollsAvailable > 0
            ? `${rollsAvailable} tiro(s) disponible(s)`
            : 'Completa acciones pendientes para ganar más dados'}
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-600 mb-2">
          Premios obtenidos
        </p>
        {currentState.rollHistory.length > 0 ? (
          <div className="space-y-2">
            {currentState.rollHistory.map((roll) => {
              const reward = prizeCatalog[roll.tier]
              return (
                <div
                  key={roll.id}
                  className="flex items-center justify-between border border-gray-200 rounded-xl px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {reward.label}
                    </p>
                    <p className="text-xs text-gray-500">
                      {reward.description}
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${reward.accent}`}
                  >
                    {new Date(roll.timestamp).toLocaleDateString('es-MX', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center text-xs text-gray-500 border border-dashed border-gray-300 rounded-xl py-4">
            Aún no has tirado dados en esta partida.
          </div>
        )}
      </div>
    </div>
  )
}

export default RewardLogrosCard
