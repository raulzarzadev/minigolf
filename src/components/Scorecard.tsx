'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Game, Player } from '@/types'
import { updatePlayerScore, calculateGameStats, updateGame } from '@/lib/db'
import { updateLocalGame, isLocalGame } from '@/lib/localStorage'
import { Minus, Plus, Trophy, Target, Clock, CheckCircle } from 'lucide-react'

interface ScorecardProps {
  game: Game
  currentPlayer?: Player
  canEdit?: boolean
  onScoreUpdate?: () => void
  onGameUpdate?: (game: Game) => void // Para actualizar partidas locales
}

const Scorecard: React.FC<ScorecardProps> = ({
  game,
  currentPlayer,
  canEdit = false,
  onScoreUpdate,
  onGameUpdate
}) => {
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [autoAdvanceHole, setAutoAdvanceHole] = useState(true)
  const [activeControl, setActiveControl] = useState<{
    playerId: string
    holeIndex: number
  } | null>(null)
  const [stickyOffset, setStickyOffset] = useState(72)
  const isLocal = isLocalGame(game.id)
  const stickyControlsRef = useRef<HTMLDivElement | null>(null)
  const pendingScrollRef = useRef(false)

  const getDefaultHoleIndex = useCallback(() => {
    return Math.min(Math.max(game.currentHole - 1, 0), game.holeCount - 1)
  }, [game.currentHole, game.holeCount])

  const focusHole = useCallback(
    (playerId: string, holeIndex?: number, shouldScroll = false) => {
      if (shouldScroll) {
        pendingScrollRef.current = true
      }

      setActiveControl((prev) => {
        const fallbackHole =
          typeof holeIndex === 'number'
            ? holeIndex
            : prev?.holeIndex ?? getDefaultHoleIndex()

        return {
          playerId,
          holeIndex: Math.min(Math.max(fallbackHole, 0), game.holeCount - 1)
        }
      })
    },
    [getDefaultHoleIndex, game.holeCount]
  )

  const activePlayer = useMemo(() => {
    if (!activeControl) return null
    return (
      game.players.find((player) => player.id === activeControl.playerId) ||
      null
    )
  }, [activeControl, game.players])

  // Auto-advance to next hole when all players complete current hole
  useEffect(() => {
    if (!autoAdvanceHole || !canEdit || game.status !== 'in_progress') return

    const currentHoleIndex = game.currentHole - 1
    const allPlayersCompletedCurrentHole = game.players.every((player) => {
      const scores = game.scores[player.id] || []
      return scores[currentHoleIndex] > 0
    })

    if (allPlayersCompletedCurrentHole && game.currentHole < game.holeCount) {
      // Auto-advance to next hole
      setTimeout(() => {
        if (isLocal) {
          // Local game: update locally
          const updatedGame = { ...game, currentHole: game.currentHole + 1 }
          updateLocalGame(game.id, { currentHole: game.currentHole + 1 })
          onGameUpdate?.(updatedGame)
        } else {
          // Server game: update on server
          updateGame(game.id, { currentHole: game.currentHole + 1 })
        }
      }, 1500) // Small delay for better UX
    }
  }, [
    game.scores,
    game.currentHole,
    game.players,
    canEdit,
    autoAdvanceHole,
    game.id,
    game.status,
    game.holeCount,
    isLocal,
    onGameUpdate,
    game
  ])

  const updateScore = async (
    playerId: string,
    holeIndex: number,
    newScore: number
  ) => {
    if (newScore < 0) return

    setIsUpdating(`${playerId}-${holeIndex}`)
    try {
      if (isLocal) {
        // Local game: update locally
        const newScores = { ...game.scores }
        if (!newScores[playerId]) {
          newScores[playerId] = Array(game.holeCount).fill(0)
        }
        newScores[playerId][holeIndex] = newScore

        const updatedGame = { ...game, scores: newScores }
        updateLocalGame(game.id, { scores: newScores })
        onGameUpdate?.(updatedGame)
        onScoreUpdate?.()
      } else {
        // Server game: update on server
        await updatePlayerScore(game.id, playerId, holeIndex, newScore)
        onScoreUpdate?.()
      }
    } catch (error) {
      console.error('Error updating score:', error)
    } finally {
      setIsUpdating(null)
    }
  }

  const getPlayerScore = (playerId: string, holeIndex: number): number => {
    return game.scores[playerId]?.[holeIndex] || 0
  }

  const getTotalScore = (playerId: string): number => {
    const scores = game.scores[playerId] || []
    return scores.reduce((total, score) => total + score, 0)
  }

  const getCompletedHoles = (playerId: string): number => {
    const scores = game.scores[playerId] || []
    return scores.filter((score) => score > 0).length
  }

  const canEditScore = useCallback(
    (playerId: string): boolean => {
      if (!canEdit) return false

      // For local games (isLocal is true), anyone can edit any score
      if (isLocal) return true

      // For server games, require authentication
      if (!currentPlayer) return false

      // Creator can edit all scores, players can only edit their own
      return (
        game.createdBy === currentPlayer.userId || playerId === currentPlayer.id
      )
    },
    [canEdit, currentPlayer, game.createdBy, isLocal]
  )

  const editablePlayers = useMemo(
    () => game.players.filter((player) => canEditScore(player.id)),
    [game.players, canEditScore]
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    const calculateOffset = () => {
      const fallbackSpacing = window.matchMedia('(max-width: 639px)').matches
        ? 8
        : 12
      const nav = document.querySelector('nav')
      if (!nav) {
        setStickyOffset(fallbackSpacing)
        return
      }

      const rect = nav.getBoundingClientRect()
      const navBottom = Math.max(rect.bottom, 0)
      const newOffset = (navBottom > 0 ? navBottom : 0) + fallbackSpacing
      setStickyOffset((prev) =>
        Math.abs(prev - newOffset) < 0.5 ? prev : newOffset
      )
    }

    calculateOffset()
    window.addEventListener('scroll', calculateOffset, { passive: true })
    window.addEventListener('resize', calculateOffset)

    return () => {
      window.removeEventListener('scroll', calculateOffset)
      window.removeEventListener('resize', calculateOffset)
    }
  }, [])

  useEffect(() => {
    if (!canEdit || game.status === 'finished') {
      setActiveControl(null)
      return
    }

    setActiveControl((prev) => {
      if (
        prev &&
        canEditScore(prev.playerId) &&
        prev.holeIndex < game.holeCount
      ) {
        return prev
      }

      const fallbackPlayer = game.players.find((player) =>
        canEditScore(player.id)
      )

      if (!fallbackPlayer) return null

      return {
        playerId: fallbackPlayer.id,
        holeIndex: Math.min(
          Math.max(game.currentHole - 1, 0),
          game.holeCount - 1
        )
      }
    })
  }, [
    canEdit,
    canEditScore,
    game.currentHole,
    game.holeCount,
    game.players,
    game.status
  ])

  useEffect(() => {
    if (!pendingScrollRef.current || !activeControl) return
    pendingScrollRef.current = false

    if (typeof window === 'undefined') return
    const isMobile = window.matchMedia('(max-width: 639px)').matches
    if (!isMobile) return

    const target = stickyControlsRef.current
    if (!target) return

    const targetTop = target.getBoundingClientRect().top + window.scrollY - 16
    window.scrollTo({ top: Math.max(targetTop, 0), behavior: 'smooth' })
  }, [activeControl])

  const renderHoleInputs = (player: Player) => {
    const holes = Array.from({ length: game.holeCount }, (_, i) => i)
    const currentHoleIndex = game.currentHole - 1
    const allowEditing = canEditScore(player.id) && game.status !== 'finished'

    return (
      <div className="grid grid-cols-4 xs:grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-9 gap-2">
        {holes.map((holeIndex) => {
          const score = getPlayerScore(player.id, holeIndex)
          const isUpdatingThisHole = isUpdating === `${player.id}-${holeIndex}`
          const canEditThisScore = canEditScore(player.id)
          const isCurrentHole = holeIndex === currentHoleIndex
          const isCompletedHole = score > 0
          const isFutureHole = holeIndex > currentHoleIndex
          const isSelectedHole =
            activeControl?.playerId === player.id &&
            activeControl.holeIndex === holeIndex
          const allowSelection = allowEditing && canEditThisScore

          const handleSelectHole = () => {
            if (!allowSelection) return
            focusHole(player.id, holeIndex, true)
          }

          return (
            <div
              key={holeIndex}
              className={`text-center ${
                allowSelection ? 'cursor-pointer select-none' : ''
              }`}
              role={allowSelection ? 'button' : undefined}
              tabIndex={allowSelection ? 0 : undefined}
              aria-pressed={allowSelection ? isSelectedHole : undefined}
              onClick={handleSelectHole}
              onKeyDown={(event) => {
                if (!allowSelection) return
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  handleSelectHole()
                }
              }}
            >
              <div
                className={`text-xs mb-1 flex items-center justify-center ${
                  isCurrentHole
                    ? 'text-green-600 font-semibold'
                    : 'text-gray-500'
                }`}
              >
                {isCurrentHole && <Clock className="h-2.5 w-2.5 mr-0.5" />}
                {isCompletedHole && !isCurrentHole && (
                  <CheckCircle className="h-2.5 w-2.5 mr-0.5 text-green-500" />
                )}
                <span className="text-xs font-medium">H{holeIndex + 1}</span>
              </div>
              {canEditThisScore ? (
                <div
                  className={`flex flex-col items-center justify-center space-y-1 rounded-2xl p-2 border transition-all duration-200 ${
                    isSelectedHole
                      ? 'bg-white ring-2 ring-green-500 shadow-lg'
                      : isCurrentHole
                      ? 'bg-green-50 border-green-200'
                      : isFutureHole
                      ? 'bg-gray-50 border-dashed border-gray-200 opacity-70'
                      : 'bg-gray-50 border-transparent'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      updateScore(player.id, holeIndex, Math.max(0, score - 1))
                    }
                    disabled={isUpdatingThisHole || score <= 0}
                    className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg font-bold active:scale-95 transition-all touch-manipulation"
                    aria-label={`Restar golpe del hoyo ${holeIndex + 1}`}
                  >
                    <Minus size={18} />
                  </button>
                  <div className="w-full h-8 flex items-center justify-center font-bold text-lg min-w-0">
                    {isUpdatingThisHole ? '⋯' : score || '-'}
                  </div>
                  <button
                    type="button"
                    onClick={() => updateScore(player.id, holeIndex, score + 1)}
                    disabled={isUpdatingThisHole}
                    className="w-10 h-10 rounded-full bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg font-bold active:scale-95 transition-all touch-manipulation"
                    aria-label={`Sumar golpe al hoyo ${holeIndex + 1}`}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              ) : (
                <div
                  className={`h-16 flex items-center justify-center font-bold text-lg rounded-2xl ${
                    isCurrentHole
                      ? 'bg-gray-50 border border-black'
                      : 'bg-white'
                  }`}
                >
                  {score || '-'}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderStickyControlPad = () => {
    if (game.status === 'finished') {
      return (
        <div className="text-center text-xs text-gray-400">
          La partida ha finalizado
        </div>
      )
    }

    if (!activeControl || !canEditScore(activeControl.playerId)) {
      return (
        <div className="text-center text-xs text-gray-500">
          Selecciona un hoyo para usar el control rápido
        </div>
      )
    }

    const { playerId, holeIndex } = activeControl
    const player = game.players.find((p) => p.id === playerId)
    if (!player) return null

    const score = getPlayerScore(playerId, holeIndex)
    const isUpdatingThisHole = isUpdating === `${playerId}-${holeIndex}`
    const quickSetValues = [0, 1, 2, 3, 4, 5, 6]

    const applyScore = (value: number) => {
      updateScore(playerId, holeIndex, Math.max(0, value))
    }

    const adjustScore = (delta: number) => {
      applyScore(score + delta)
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Control táctil rápido</span>
          <span>
            Hoyo {holeIndex + 1} • {player.name}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => adjustScore(-1)}
            disabled={isUpdatingThisHole || score <= 0}
            className="flex-1 h-14 rounded-2xl bg-white border border-gray-200 text-3xl font-bold text-gray-700 active:scale-95 transition-all touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Restar golpe"
          >
            −
          </button>
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="text-4xl font-bold text-gray-900 tracking-tight">
              {isUpdatingThisHole ? '⋯' : score || 0}
            </div>
            <div className="text-[11px] text-gray-500 uppercase tracking-wide">
              Golpes
            </div>
          </div>
          <button
            type="button"
            onClick={() => adjustScore(1)}
            disabled={isUpdatingThisHole}
            className="flex-1 h-14 rounded-2xl bg-green-600 text-white text-3xl font-bold active:scale-95 transition-all touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Sumar golpe"
          >
            +
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickSetValues.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => applyScore(value)}
              disabled={isUpdatingThisHole}
              className={`px-3 py-2 rounded-full border text-sm font-semibold active:scale-95 transition-all touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed ${
                value === score
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-white text-gray-800'
              }`}
            >
              {value}
            </button>
          ))}
          <button
            type="button"
            onClick={() => applyScore(score + 2)}
            disabled={isUpdatingThisHole}
            className="px-3 py-2 rounded-full border border-green-200 bg-green-50 text-sm font-semibold text-green-700 active:scale-95 transition-all touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
          >
            +2
          </button>
          <button
            type="button"
            onClick={() => applyScore(score + 3)}
            disabled={isUpdatingThisHole}
            className="px-3 py-2 rounded-full border border-green-200 bg-green-50 text-sm font-semibold text-green-700 active:scale-95 transition-all touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
          >
            +3
          </button>
        </div>
      </div>
    )
  }

  const renderPlayerSwitcher = () => {
    if (editablePlayers.length === 0 || game.status === 'finished') return null

    return (
      <div
        className="sm:hidden sticky z-20 -mx-1"
        ref={stickyControlsRef}
        style={{ top: stickyOffset }}
      >
        <div className="px-1">
          <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur shadow-md p-3 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <span>Panel rápido</span>
              {activePlayer && activeControl ? (
                <span className="text-green-700">
                  H{activeControl.holeIndex + 1} • {activePlayer.name}
                </span>
              ) : (
                <span className="text-gray-400">Selecciona un hoyo</span>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {game.players.map((player) => {
                const isEditable = canEditScore(player.id)
                const isActive = activeControl?.playerId === player.id

                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() =>
                      isEditable && focusHole(player.id, undefined, true)
                    }
                    disabled={!isEditable || game.status === 'finished'}
                    className={`min-w-[96px] px-3 py-2 rounded-xl border text-left text-sm font-semibold transition-all active:scale-95 ${
                      isActive
                        ? 'bg-black text-white border-black'
                        : isEditable
                        ? 'bg-white text-gray-800 border-gray-200'
                        : 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed'
                    }`}
                  >
                    <div className="truncate">{player.name}</div>
                    <div className="text-[11px] font-normal opacity-80">
                      {getCompletedHoles(player.id)} / {game.holeCount} hoyos
                    </div>
                  </button>
                )
              })}
            </div>
            {renderStickyControlPad()}
          </div>
        </div>
      </div>
    )
  }

  const renderPlayerStats = (player: Player) => {
    const scores = game.scores[player.id] || []
    const completedHoles = getCompletedHoles(player.id)
    const totalScore = getTotalScore(player.id)

    if (completedHoles === 0) {
      return (
        <div className="text-center text-gray-500 text-sm py-2">
          Sin golpes registrados
        </div>
      )
    }

    const stats = calculateGameStats(scores.filter((s) => s > 0))

    return (
      <div className="grid grid-cols-2 gap-2 text-center text-sm">
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="font-bold text-xl text-green-600">{totalScore}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
        <div className="p-3 bg-white border-2 border-green-500 rounded-lg">
          <div className="font-bold text-xl text-green-600">
            {completedHoles}
          </div>
          <div className="text-xs text-gray-500">Hoyos</div>
        </div>
        <div className="p-3 bg-green-600 rounded-lg">
          <div className="font-bold text-xl text-white">
            {stats.averagePerHole}
          </div>
          <div className="text-xs text-green-100">Promedio</div>
        </div>
        <div className="p-3 bg-gray-100 rounded-lg">
          <div className="font-bold text-xl text-black">{stats.holesInOne}</div>
          <div className="text-xs text-gray-500">Hole-in-1</div>
        </div>
      </div>
    )
  }

  const getLeaderboard = () => {
    const playerScores = game.players
      .map((player) => ({
        player,
        totalScore: getTotalScore(player.id),
        completedHoles: getCompletedHoles(player.id)
      }))
      .filter((p) => p.completedHoles > 0)
      .sort((a, b) => {
        // Sort by completed holes first, then by total score
        if (a.completedHoles !== b.completedHoles) {
          return b.completedHoles - a.completedHoles
        }
        return a.totalScore - b.totalScore
      })

    return playerScores
  }

  const leaderboard = getLeaderboard()

  return (
    <div className="space-y-3">
      {renderPlayerSwitcher()}
      {/* Game Info */}
      <div className="bg-white rounded-lg p-3 border-2 border-green-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-black truncate">
              {game.isMultiplayer
                ? 'Partida Multijugador'
                : 'Partida Individual'}
            </h2>
            <p className="text-sm text-gray-600">
              {game.holeCount} hoyos • {game.players.length} jugador
              {game.players.length > 1 ? 'es' : ''}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-black">
              Hoyo {game.currentHole}
            </div>
            <div className="text-xs text-gray-600">
              {game.status === 'finished' ? 'Terminada' : 'En progreso'}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Progreso</span>
            <span>
              {game.currentHole} de {game.holeCount}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(game.currentHole / game.holeCount) * 100}%`
              }}
            ></div>
          </div>
        </div>

        {/* Auto-advance toggle for game creator */}
        {canEdit && game.isMultiplayer && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-gray-700">
              Avanzar hoyo automáticamente
            </span>
            <button
              onClick={() => setAutoAdvanceHole(!autoAdvanceHole)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoAdvanceHole ? 'bg-green-500' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoAdvanceHole ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        )}
      </div>

      {/* Leaderboard - Only show if multiple players and some scores */}
      {game.isMultiplayer && leaderboard.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center text-sm">
            <Trophy className="h-4 w-4 text-green-600 mr-2" />
            Clasificación
          </h3>
          <div className="space-y-2">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.player.id}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0
                        ? 'bg-black text-white'
                        : index === 1
                        ? 'bg-gray-300 text-black'
                        : index === 2
                        ? 'bg-gray-200 text-black'
                        : 'bg-gray-100 text-black'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">
                      {entry.player.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {entry.completedHoles} de {game.holeCount} hoyos
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{entry.totalScore}</div>
                  <div className="text-xs text-gray-500">golpes</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Players Scorecards */}
      <div className="space-y-3">
        {game.players.map((player) => (
          <div
            key={player.id}
            className="bg-white rounded-lg border border-gray-200 p-3"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    player.isGuest ? 'bg-gray-100' : 'bg-black text-white'
                  }`}
                >
                  <span className="font-medium text-sm">
                    {player.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-base truncate">
                    {player.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {player.isGuest ? 'Invitado' : 'Usuario registrado'}
                    {currentPlayer?.id === player.id && ' (Tú)'}
                  </div>
                </div>
              </div>
              {canEditScore(player.id) && (
                <div className="text-xs text-black bg-gray-100 px-2 py-1 rounded flex-shrink-0">
                  <Target className="h-3 w-3 inline mr-1" />
                  Editable
                </div>
              )}
            </div>

            {/* Hole inputs */}
            <div className="mb-3">{renderHoleInputs(player)}</div>

            {/* Player stats */}
            <div className="pt-3 border-t border-gray-200">
              {renderPlayerStats(player)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Scorecard
