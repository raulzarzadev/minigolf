'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Game } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import {
  getAllRewardStates,
  loadRewardState,
  persistRewardState,
  prizeCatalog,
  RewardState,
  RewardStepId,
  rewardStepMeta,
  triggerRewardStepAction,
  setLastInstruction,
  grantAdminRolls,
  rollPrizeOutcome,
  markPrizeDelivered
} from '@/lib/rewards'
import { listPrices, PriceRecord } from '@/lib/prices'
import { CheckCircle2, Dice5, Gift, Loader2, X } from 'lucide-react'

interface RewardLogrosCardProps {
  games: Game[]
}

const RewardLogrosCard: React.FC<RewardLogrosCardProps> = ({ games }) => {
  const [rewardStates, setRewardStates] = useState<RewardState[]>([])
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const [currentState, setCurrentState] = useState<RewardState | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeStep, setActiveStep] = useState<RewardStepId | null>(null)
  const [adminRollInput, setAdminRollInput] = useState('1')
  const [adminStatus, setAdminStatus] = useState<string | null>(null)
  const [prices, setPrices] = useState<PriceRecord[]>([])
  const [pricesLoading, setPricesLoading] = useState(true)
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

  const hydrate = () => {
    const states = getAllRewardStates()
    setRewardStates(states)
    const initial = states.find((state) => state.gameId === selectedGameId)
    const fallback = initial ?? states[0] ?? null
    setSelectedGameId(fallback?.gameId ?? null)
    const resolvedState = fallback ? loadRewardState(fallback.gameId) : null
    setCurrentState(resolvedState)
    setActiveStep(
      resolvedState && resolvedState.lastInstruction
        ? resolvedState.lastInstruction
        : null
    )
    setLoading(false)
  }

  useEffect(() => {
    let isMounted = true
    const fetchPrices = async () => {
      try {
        setPricesLoading(true)
        const records = await listPrices()
        if (isMounted) {
          setPrices(records)
        }
      } catch (error) {
        console.error('Error loading prices', error)
      } finally {
        if (isMounted) {
          setPricesLoading(false)
        }
      }
    }
    fetchPrices()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    hydrate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedGameId) {
      setCurrentState(null)
      return
    }
    const nextState = loadRewardState(selectedGameId)
    setCurrentState(nextState)
  }, [selectedGameId])

  useEffect(() => {
    if (!currentState) {
      setActiveStep(null)
      return
    }
    const pendingInstruction = currentState.lastInstruction
    if (
      pendingInstruction &&
      !currentState.completedSteps[pendingInstruction]
    ) {
      setActiveStep(pendingInstruction)
    } else {
      setActiveStep(null)
    }
  }, [currentState])

  const handleRollFromLogros = () => {
    if (!currentState) return
    const selectedGame = games.find((g) => g.id === currentState.gameId)
    if (!selectedGame || selectedGame.status !== 'finished') return
    if (currentState.availableRolls <= 0) return

    const tier = rollPrizeOutcome()
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
    setLastInstruction(currentState.gameId, stepId)
  }

  const closeInstructions = () => {
    if (!currentState) return
    setActiveStep(null)
    setLastInstruction(currentState.gameId, null)
  }

  const handleStepAction = () => {
    if (!currentState || !activeStep) return
    triggerRewardStepAction(activeStep, {
      gameId: currentState.gameId,
      user
    })
  }

  const handleAdminGrant = () => {
    if (!currentState || !user?.isAdmin) return
    const quantity = Math.max(1, Math.floor(Number(adminRollInput) || 0))
    const updatedState = grantAdminRolls({
      admin: user,
      gameId: currentState.gameId,
      rolls: quantity
    })
    if (!updatedState) return
    setCurrentState(updatedState)
    setRewardStates((prev) =>
      prev.map((state) =>
        state.gameId === updatedState.gameId ? updatedState : state
      )
    )
    setAdminStatus(`+${quantity} dado(s) asignado(s)`)
    setAdminRollInput('1')
    setTimeout(() => setAdminStatus(null), 2500)
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
  const isFinishedGame = selectedGame?.status === 'finished'
  const diceHelperMessage = isFinishedGame
    ? rollsAvailable > 0
      ? `${rollsAvailable} tiro(s) disponible(s)`
      : 'Completa acciones pendientes para ganar más dados'
    : 'Termina esta partida para desbloquear los dados'

  const activePrices = useMemo(
    () => prices.filter((price) => price.isActive),
    [prices]
  )

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
          {!isFinishedGame && (
            <p className="text-[11px] text-gray-500 mt-1">
              Termina la partida antes de usar los dados.
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

      {user?.isAdmin && currentState && (
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

      {/* Catálogo se gestiona en consola admin; aquí solo mostramos precios activos */}

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
          {(Object.keys(rewardStepMeta) as RewardStepId[]).map((stepId) => {
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
                {rewardStepMeta[stepId].label}
              </button>
            )
          })}
        </div>
        {activeStep && !currentState.completedSteps[activeStep] && (
          <div className="border border-green-200 bg-white rounded-xl p-3 mt-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {rewardStepMeta[activeStep].label}
                </p>
                <ul className="text-xs text-gray-600 list-disc list-inside space-y-1 mt-1">
                  {rewardStepMeta[activeStep].instructions.map(
                    (line, index) => (
                      <li key={`${activeStep}-instruction-${index}`}>{line}</li>
                    )
                  )}
                </ul>
                <button
                  type="button"
                  onClick={handleStepAction}
                  className="mt-3 inline-flex items-center text-[11px] font-semibold px-3 py-1.5 rounded-full border border-green-500 text-green-700 hover:bg-green-50"
                >
                  {rewardStepMeta[activeStep].ctaLabel}
                </button>
              </div>
              <button
                type="button"
                onClick={closeInstructions}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Cerrar instrucciones"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-3">
        <p className="text-xs font-semibold text-gray-600 mb-2">
          Logros del reto
        </p>
        <ul className="space-y-1 text-xs">
          {(Object.keys(rewardStepMeta) as RewardStepId[]).map((stepId) => (
            <li
              key={`summary-${stepId}`}
              className="flex items-center justify-between"
            >
              <span className="text-gray-600">
                {rewardStepMeta[stepId].label}
              </span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  currentState.completedSteps[stepId]
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {currentState.completedSteps[stepId] ? 'Listo' : 'Pendiente'}
              </span>
            </li>
          ))}
        </ul>
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
          disabled={!isFinishedGame || rollsAvailable === 0}
          className="inline-flex items-center px-4 py-2 rounded-2xl bg-green-500 text-black font-semibold text-xs hover:bg-green-400 disabled:opacity-40"
        >
          <Dice5 className="h-4 w-4 mr-2" /> Tirar dado
        </button>
        <p className="text-[11px] text-gray-300 mt-2">{diceHelperMessage}</p>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-600 mb-2">
          Premios obtenidos
        </p>
        {currentState.rollHistory.length > 0 ? (
          <div className="space-y-2">
            {currentState.rollHistory.map((roll) => {
              const reward =
                roll.tier === 'none'
                  ? {
                      label: 'Sin premio',
                      description:
                        'No apareció premio en este tiro, intenta nuevamente.',
                      accent: 'bg-gray-100 text-gray-600'
                    }
                  : prizeCatalog[roll.tier]
              return (
                <div
                  key={roll.id}
                  className="flex items-center justify-between border border-gray-200 rounded-xl px-3 py-2 gap-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {reward.label}
                    </p>
                    <p className="text-xs text-gray-500">
                      {reward.description}
                    </p>
                    {roll.delivered && (
                      <span className="mt-1 inline-flex text-[10px] font-semibold text-green-600">
                        Entregado
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${reward.accent}`}
                    >
                      {new Date(roll.timestamp).toLocaleDateString('es-MX', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    {user?.isAdmin &&
                      roll.tier !== 'none' &&
                      !roll.delivered && (
                        <button
                          type="button"
                          onClick={() => {
                            const updatedState = markPrizeDelivered({
                              admin: user,
                              gameId: currentState.gameId,
                              rollId: roll.id
                            })
                            if (updatedState) {
                              setCurrentState(updatedState)
                              setRewardStates((prev) =>
                                prev.map((state) =>
                                  state.gameId === updatedState.gameId
                                    ? updatedState
                                    : state
                                )
                              )
                            }
                          }}
                          className="text-[11px] font-semibold text-green-700 border border-green-500 rounded px-2 py-0.5 hover:bg-green-50"
                        >
                          Marcar entregado
                        </button>
                      )}
                  </div>
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

      <div>
        <p className="text-xs font-semibold text-gray-600 mb-2">
          Premios que puedes ganar
        </p>
        {pricesLoading ? (
          <div className="text-center text-xs text-gray-500 border border-dashed border-gray-300 rounded-xl py-4">
            Cargando catálogo de premios...
          </div>
        ) : activePrices.length > 0 ? (
          <div className="space-y-2">
            {activePrices.map((perk) => (
              <div
                key={perk.id}
                className="border border-gray-200 rounded-xl px-3 py-2 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {perk.title}
                  </p>
                  <p className="text-xs text-gray-500">{perk.description}</p>
                </div>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    perk.tier === 'small'
                      ? 'bg-green-50 text-green-600'
                      : perk.tier === 'medium'
                      ? 'bg-blue-50 text-blue-600'
                      : perk.tier === 'large'
                      ? 'bg-purple-50 text-purple-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {perk.tier === 'bonus' ? 'Bonus' : `Premio ${perk.tier}`}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-xs text-gray-500 border border-dashed border-gray-300 rounded-xl py-4">
            Estamos preparando nuevos premios.
          </div>
        )}
      </div>
    </div>
  )
}

export default RewardLogrosCard
