'use client'

import React, { useState, useEffect } from 'react'
import { Game, Player } from '@/types'
import { updatePlayerScore, calculateGameStats, updateGame } from '@/lib/db'
import { Minus, Plus, Trophy, Target, Clock, CheckCircle } from 'lucide-react'

interface ScorecardProps {
  game: Game
  currentPlayer?: Player
  canEdit?: boolean
  onScoreUpdate?: () => void
}

const Scorecard: React.FC<ScorecardProps> = ({
  game,
  currentPlayer,
  canEdit = false,
  onScoreUpdate
}) => {
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [autoAdvanceHole, setAutoAdvanceHole] = useState(true)

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
        updateGame(game.id, { currentHole: game.currentHole + 1 })
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
    game.holeCount
  ])

  const updateScore = async (
    playerId: string,
    holeIndex: number,
    newScore: number
  ) => {
    if (newScore < 0) return

    setIsUpdating(`${playerId}-${holeIndex}`)
    try {
      await updatePlayerScore(game.id, playerId, holeIndex, newScore)
      onScoreUpdate?.()
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

  const canEditScore = (playerId: string): boolean => {
    if (!canEdit) return false
    if (!currentPlayer) return false

    // Creator can edit all scores, players can only edit their own
    return (
      game.createdBy === currentPlayer.userId || playerId === currentPlayer.id
    )
  }

  const renderHoleInputs = (player: Player) => {
    const holes = Array.from({ length: game.holeCount }, (_, i) => i)
    const currentHoleIndex = game.currentHole - 1

    return (
      <div className="grid grid-cols-4 xs:grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-9 gap-1">
        {holes.map((holeIndex) => {
          const score = getPlayerScore(player.id, holeIndex)
          const isUpdatingThisHole = isUpdating === `${player.id}-${holeIndex}`
          const canEditThisScore = canEditScore(player.id)
          const isCurrentHole = holeIndex === currentHoleIndex
          const isCompletedHole = score > 0
          const isFutureHole = holeIndex > currentHoleIndex

          return (
            <div key={holeIndex} className="text-center">
              <div
                className={`text-xs mb-1 flex items-center justify-center ${
                  isCurrentHole ? 'text-black font-semibold' : 'text-gray-500'
                }`}
              >
                {isCurrentHole && <Clock className="h-2.5 w-2.5 mr-0.5" />}
                {isCompletedHole && !isCurrentHole && (
                  <CheckCircle className="h-2.5 w-2.5 mr-0.5 text-gray-600" />
                )}
                <span className="text-xs font-medium">H{holeIndex + 1}</span>
              </div>
              {canEditThisScore ? (
                <div
                  className={`flex flex-col items-center justify-center space-y-1 rounded-lg p-1 ${
                    isCurrentHole
                      ? 'bg-gray-50 border-2 border-black'
                      : isFutureHole
                      ? 'bg-gray-50 opacity-60'
                      : 'bg-gray-50'
                  }`}
                >
                  <button
                    onClick={() =>
                      updateScore(player.id, holeIndex, Math.max(0, score - 1))
                    }
                    disabled={isUpdatingThisHole || score <= 0}
                    className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center active:scale-95 transition-all touch-manipulation"
                  >
                    <Minus size={12} />
                  </button>
                  <div className="w-full h-6 flex items-center justify-center font-bold text-base min-w-0">
                    {isUpdatingThisHole ? '⋯' : score || '-'}
                  </div>
                  <button
                    onClick={() => updateScore(player.id, holeIndex, score + 1)}
                    disabled={isUpdatingThisHole}
                    className="w-6 h-6 rounded-full bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center active:scale-95 transition-all touch-manipulation"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              ) : (
                <div
                  className={`h-16 flex items-center justify-center font-bold text-lg ${
                    isCurrentHole
                      ? 'bg-gray-50 border-2 border-black rounded-lg'
                      : ''
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
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="font-bold text-xl text-black">{totalScore}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
        <div className="p-3 bg-white border-2 border-black rounded-lg">
          <div className="font-bold text-xl text-black">{completedHoles}</div>
          <div className="text-xs text-gray-500">Hoyos</div>
        </div>
        <div className="p-3 bg-black rounded-lg">
          <div className="font-bold text-xl text-white">
            {stats.averagePerHole}
          </div>
          <div className="text-xs text-gray-300">Promedio</div>
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
      {/* Game Info */}
      <div className="bg-white rounded-lg p-3 border-2 border-black">
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
              className="bg-black h-2 rounded-full transition-all duration-300"
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
                autoAdvanceHole ? 'bg-black' : 'bg-gray-200'
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
            <Trophy className="h-4 w-4 text-black mr-2" />
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
