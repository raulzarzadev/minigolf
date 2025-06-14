'use client'

import React, { useState, useEffect } from 'react'
import { User } from '@/types'
import { getUserGames } from '@/lib/db'
import { Trophy, Target, TrendingUp, Star, Award } from 'lucide-react'

interface UserStatsProps {
  user: User
}

interface UserStatistics {
  totalGames: number
  gamesWon: number
  totalStrokes: number
  totalHoles: number
  averagePerHole: number
  bestGame: number
  holesInOne: number
  averageGameTime: number
  favoriteGameType: 'individual' | 'multiplayer' | null
  winRate: number
  recentForm: number[]
}

const UserStats: React.FC<UserStatsProps> = ({ user }) => {
  const [stats, setStats] = useState<UserStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>(
    'month'
  )

  useEffect(() => {
    const loadUserStats = async () => {
      try {
        const games = await getUserGames(user.id)

        // Filter games by time range
        const now = new Date()
        const filteredGames = games.filter((game) => {
          const gameDate = new Date(game.createdAt)
          const diffTime = now.getTime() - gameDate.getTime()
          const diffDays = diffTime / (1000 * 60 * 60 * 24)

          switch (timeRange) {
            case 'week':
              return diffDays <= 7
            case 'month':
              return diffDays <= 30
            case 'year':
              return diffDays <= 365
            default:
              return true
          }
        })

        const finishedGames = filteredGames.filter(
          (game) => game.status === 'finished'
        )

        if (finishedGames.length === 0) {
          setStats({
            totalGames: 0,
            gamesWon: 0,
            totalStrokes: 0,
            totalHoles: 0,
            averagePerHole: 0,
            bestGame: 0,
            holesInOne: 0,
            averageGameTime: 0,
            favoriteGameType: null,
            winRate: 0,
            recentForm: []
          })
          setLoading(false)
          return
        }

        let totalStrokes = 0
        let totalHoles = 0
        let holesInOne = 0
        let gamesWon = 0
        let totalGameTime = 0
        let individualGames = 0
        let multiplayerGames = 0
        const recentGameResults: number[] = []

        finishedGames.forEach((game) => {
          const userPlayer = game.players.find((p) => p.userId === user.id)
          if (!userPlayer) return

          const playerScores = game.scores[userPlayer.id] || []
          const validScores = playerScores.filter((score) => score > 0)

          totalStrokes += validScores.reduce((sum, score) => sum + score, 0)
          totalHoles += validScores.length
          holesInOne += validScores.filter((score) => score === 1).length

          // Check if user won this game (lowest score in multiplayer)
          if (game.isMultiplayer) {
            const allPlayerTotals = game.players.map((player) => {
              const scores = game.scores[player.id] || []
              return scores.reduce((sum, score) => sum + score, 0)
            })
            const userTotal = totalStrokes
            const minScore = Math.min(...allPlayerTotals)
            if (userTotal === minScore) {
              gamesWon++
            }
            multiplayerGames++
          } else {
            // For individual games, consider "winning" as completing the game
            if (validScores.length === game.holeCount) {
              gamesWon++
            }
            individualGames++
          }

          // Calculate game duration
          if (game.finishedAt) {
            const duration =
              game.finishedAt.getTime() - game.createdAt.getTime()
            totalGameTime += duration
          }

          // Recent form (last 10 games)
          if (recentGameResults.length < 10) {
            const gameScore =
              validScores.length > 0
                ? validScores.reduce((sum, score) => sum + score, 0) /
                  validScores.length
                : 0
            recentGameResults.push(gameScore)
          }
        })

        const averagePerHole = totalHoles > 0 ? totalStrokes / totalHoles : 0
        const bestGame = finishedGames.reduce((best, game) => {
          const userPlayer = game.players.find((p) => p.userId === user.id)
          if (!userPlayer) return best

          const playerScores = game.scores[userPlayer.id] || []
          const validScores = playerScores.filter((score) => score > 0)
          const gameAverage =
            validScores.length > 0
              ? validScores.reduce((sum, score) => sum + score, 0) /
                validScores.length
              : 0

          return gameAverage > 0 && (best === 0 || gameAverage < best)
            ? gameAverage
            : best
        }, 0)

        const averageGameTime =
          finishedGames.length > 0 ? totalGameTime / finishedGames.length : 0

        const favoriteGameType =
          multiplayerGames > individualGames
            ? 'multiplayer'
            : individualGames > multiplayerGames
            ? 'individual'
            : null

        const winRate =
          finishedGames.length > 0 ? (gamesWon / finishedGames.length) * 100 : 0

        setStats({
          totalGames: finishedGames.length,
          gamesWon,
          totalStrokes,
          totalHoles,
          averagePerHole: Math.round(averagePerHole * 100) / 100,
          bestGame: Math.round(bestGame * 100) / 100,
          holesInOne,
          averageGameTime: averageGameTime / (1000 * 60), // Convert to minutes
          favoriteGameType,
          winRate: Math.round(winRate * 10) / 10,
          recentForm: recentGameResults.reverse()
        })
      } catch (error) {
        console.error('Error loading user stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserStats()
  }, [user.id, timeRange])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">
          No se pudieron cargar las estadísticas
        </div>
      </div>
    )
  }

  const getAchievements = () => {
    const achievements = []

    if (stats.holesInOne >= 1) {
      achievements.push({
        name: 'Ace!',
        description: `${stats.holesInOne} hole${
          stats.holesInOne > 1 ? 's' : ''
        }-in-one`,
        icon: Star,
        color: 'text-yellow-600 bg-yellow-100'
      })
    }

    if (stats.totalGames >= 10) {
      achievements.push({
        name: 'Veterano',
        description: `${stats.totalGames} partidas jugadas`,
        icon: Award,
        color: 'text-blue-600 bg-blue-100'
      })
    }

    if (stats.winRate >= 70) {
      achievements.push({
        name: 'Ganador',
        description: `${stats.winRate}% de victorias`,
        icon: Trophy,
        color: 'text-green-600 bg-green-100'
      })
    }

    if (stats.averagePerHole <= 2.5) {
      achievements.push({
        name: 'Precisión',
        description: `Promedio de ${stats.averagePerHole} por hoyo`,
        icon: Target,
        color: 'text-purple-600 bg-purple-100'
      })
    }

    return achievements
  }

  const achievements = getAchievements()

  return (
    <div className="space-y-4">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold text-gray-900">Estadísticas</h3>
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          {(['week', 'month', 'year', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-2 py-1 text-xs touch-manipulation ${
                timeRange === range
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {range === 'week' && 'Sem'}
              {range === 'month' && 'Mes'}
              {range === 'year' && 'Año'}
              {range === 'all' && 'Todo'}
            </button>
          ))}
        </div>
      </div>

      {stats.totalGames === 0 ? (
        <div className="text-center py-8">
          <Trophy className="h-8 w-8 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-medium text-gray-900 mb-2">
            No hay estadísticas aún
          </h3>
          <p className="text-gray-500 text-sm">
            Completa algunas partidas para ver tus estadísticas aquí
          </p>
        </div>
      ) : (
        <>
          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <div className="text-lg font-bold text-gray-900">
                    {stats.totalGames}
                  </div>
                  <div className="text-xs text-gray-500">Partidas jugadas</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <div className="text-lg font-bold text-gray-900">
                    {stats.averagePerHole}
                  </div>
                  <div className="text-xs text-gray-500">Promedio por hoyo</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <div className="text-lg font-bold text-gray-900">
                    {stats.winRate}%
                  </div>
                  <div className="text-xs text-gray-500">Tasa de victoria</div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <h4 className="font-semibold text-gray-900 mb-3 text-sm">
              Estadísticas detalladas
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Golpes totales</span>
                <span className="font-medium">{stats.totalStrokes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hoyos jugados</span>
                <span className="font-medium">{stats.totalHoles}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Holes-in-one</span>
                <span className="font-medium">{stats.holesInOne}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mejor promedio</span>
                <span className="font-medium">{stats.bestGame || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tiempo promedio</span>
                <span className="font-medium">
                  {stats.averageGameTime > 0
                    ? `${Math.round(stats.averageGameTime)} min`
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tipo favorito</span>
                <span className="font-medium">
                  {stats.favoriteGameType === 'multiplayer'
                    ? 'Multi'
                    : stats.favoriteGameType === 'individual'
                    ? 'Individual'
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <h4 className="font-semibold text-gray-900 mb-3 text-sm">Logros</h4>
            {achievements.length > 0 ? (
              <div className="space-y-2">
                {achievements.map((achievement, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-lg ${achievement.color}`}>
                      <achievement.icon className="h-3 w-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 text-xs">
                        {achievement.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {achievement.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-3">
                <Award className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                <p className="text-xs">
                  ¡Sigue jugando para desbloquear logros!
                </p>
              </div>
            )}
          </div>

          {/* Recent Form */}
          {stats.recentForm.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">
                Forma reciente
              </h4>
              <div className="flex items-center space-x-1">
                {stats.recentForm.slice(0, 5).map((score, index) => (
                  <div
                    key={index}
                    className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium ${
                      score <= 2
                        ? 'bg-green-100 text-green-600'
                        : score <= 3
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {score.toFixed(1)}
                  </div>
                ))}
                <div className="text-xs text-gray-500 ml-2">
                  Promedio por hoyo (últimas partidas)
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default UserStats
