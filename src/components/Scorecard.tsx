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
      <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 gap-2">
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
                  isCurrentHole
                    ? 'text-green-600 font-semibold'
                    : 'text-gray-500'
                }`}
              >
                {isCurrentHole && <Clock className="h-3 w-3 mr-1" />}
                {isCompletedHole && !isCurrentHole && (
                  <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                )}
                Hoyo {holeIndex + 1}
              </div>
              {canEditThisScore ? (
                <div
                  className={`flex items-center justify-center space-x-1 rounded-lg p-1 ${
                    isCurrentHole
                      ? 'bg-green-50 border-2 border-green-200'
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
                    className="w-6 h-6 rounded bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Minus size={12} />
                  </button>
                  <div className="w-8 h-6 flex items-center justify-center font-medium">
                    {isUpdatingThisHole ? '...' : score || '-'}
                  </div>
                  <button
                    onClick={() => updateScore(player.id, holeIndex, score + 1)}
                    disabled={isUpdatingThisHole}
                    className="w-6 h-6 rounded bg-green-100 text-green-600 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              ) : (
                <div
                  className={`h-8 flex items-center justify-center font-medium text-lg ${
                    isCurrentHole
                      ? 'bg-green-50 border-2 border-green-200 rounded-lg'
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
        <div className="text-center text-gray-500 text-sm">
          Sin golpes registrados
        </div>
      )
    }

    const stats = calculateGameStats(scores.filter((s) => s > 0))

    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
        <div>
          <div className="font-semibold text-lg text-green-600">
            {totalScore}
          </div>
          <div className="text-gray-500">Total</div>
        </div>
        <div>
          <div className="font-semibold text-lg">{completedHoles}</div>
          <div className="text-gray-500">Hoyos</div>
        </div>
        <div>
          <div className="font-semibold text-lg">{stats.averagePerHole}</div>
          <div className="text-gray-500">Promedio</div>
        </div>
        <div>
          <div className="font-semibold text-lg">{stats.holesInOne}</div>
          <div className="text-gray-500">Holes-in-one</div>
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
    <div className="space-y-6">
      {/* Game Info */}
      <div className="bg-green-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-green-800">
              {game.isMultiplayer
                ? 'Partida Multijugador'
                : 'Partida Individual'}
            </h2>
            <p className="text-green-600">
              {game.holeCount} hoyos • {game.players.length} jugador
              {game.players.length > 1 ? 'es' : ''}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-700">
              Hoyo {game.currentHole}
            </div>
            <div className="text-sm text-green-600">
              {game.status === 'finished' ? 'Terminada' : 'En progreso'}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-sm text-green-600 mb-1">
            <span>Progreso</span>
            <span>
              {game.currentHole} de {game.holeCount}
            </span>
          </div>
          <div className="w-full bg-green-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(game.currentHole / game.holeCount) * 100}%`
              }}
            ></div>
          </div>
        </div>

        {/* Auto-advance toggle for game creator */}
        {canEdit && game.isMultiplayer && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-green-700">
              Avanzar hoyo automáticamente
            </span>
            <button
              onClick={() => setAutoAdvanceHole(!autoAdvanceHole)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoAdvanceHole ? 'bg-green-600' : 'bg-gray-200'
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
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
            Clasificación
          </h3>
          <div className="space-y-2">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.player.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0
                        ? 'bg-yellow-100 text-yellow-600'
                        : index === 1
                        ? 'bg-gray-100 text-gray-600'
                        : index === 2
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{entry.player.name}</div>
                    <div className="text-sm text-gray-500">
                      {entry.completedHoles} de {game.holeCount} hoyos
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{entry.totalScore}</div>
                  <div className="text-sm text-gray-500">golpes</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Players Scorecards */}
      <div className="space-y-6">
        {game.players.map((player) => (
          <div
            key={player.id}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    player.isGuest ? 'bg-gray-100' : 'bg-green-100'
                  }`}
                >
                  <span className="font-medium text-lg">
                    {player.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-lg">{player.name}</div>
                  <div className="text-sm text-gray-500">
                    {player.isGuest ? 'Invitado' : 'Usuario registrado'}
                    {currentPlayer?.id === player.id && ' (Tú)'}
                  </div>
                </div>
              </div>
              {canEditScore(player.id) && (
                <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                  <Target className="h-3 w-3 inline mr-1" />
                  Editable
                </div>
              )}
            </div>

            {/* Hole inputs */}
            {renderHoleInputs(player)}

            {/* Player stats */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              {renderPlayerStats(player)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Scorecard
