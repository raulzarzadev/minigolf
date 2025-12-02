'use client'

import { Flag, Target, TrendingUp, Trophy } from 'lucide-react'
import { FC, useEffect, useState } from 'react'
import { getUserGames } from '@/lib/db'
import { User } from '@/types'

interface UserStatsProps {
  user: User
}

export interface UserStatistics {
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

const UserStats: FC<UserStatsProps> = ({ user }) => {
  const [stats, setStats] = useState<UserStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>(
    'month'
  )

  useEffect(() => {
    const loadUserStats = async () => {
      try {
        getUserStats({ userId: user.id })
          .then((stats) => setStats(stats))
          .catch((error) => {
            console.error('Error fetching user stats:', error)
            setStats(null)
          })
      } catch (error) {
        console.error('Error loading user stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserStats()
  }, [user.id])

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

  return (
    <div className="space-y-4">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold text-gray-900">Estadísticas</h3>
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          {(['week', 'month', 'year', 'all'] as const).map((range) => (
            <button
              type="button"
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
          <MainUserStats stats={stats} />
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
        </>
      )}
    </div>
  )
}

export default UserStats

export type StatsList =
  | 'totalGame'
  | 'averagePerHole'
  | 'winRate'
  | 'holesInOne'
  | 'bestGame'

export const MainUserStats = ({
  stats,
  list = []
}: {
  stats?: UserStatistics | null
  list?: StatsList[]
}) => {
  if (stats === undefined)
    return (
      <div>
        <div className="text-center py-8">
          <div className="text-gray-500">Cargando estadísticas...</div>
        </div>
      </div>
    )
  if (!stats) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">
          No se pudieron cargar las estadísticas
        </div>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      {(list.length === 0 || list.includes('totalGame')) && (
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Trophy className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <div className="text-lg font-bold text-gray-900">
                {stats.totalGames}
              </div>
              <div className="text-xs text-gray-500">Partidas jugadas</div>
            </div>
          </div>
        </div>
      )}

      {(list.length === 0 || list.includes('averagePerHole')) && (
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
      )}

      {(list.length === 0 || list.includes('winRate')) && (
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
      )}

      {(list.length === 0 || list.includes('holesInOne')) && (
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center space-x-2">
            <div className="bg-green-100 rounded-lg p-2">
              <Target className="h-4 w-4 text-green-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-bold text-gray-900">
                {stats.holesInOne}
              </div>
              <div className="text-xs text-gray-500">Hole-in-1</div>
            </div>
          </div>
        </div>
      )}

      {(list.length === 0 || list.includes('bestGame')) && (
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center space-x-2">
            <div className="bg-purple-100 rounded-lg p-2">
              <Flag className="h-4 w-4 text-purple-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-bold text-gray-900">
                {stats.bestGame || '--'}
              </div>
              <div className="text-xs text-gray-500">Mejor</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export const getUserStats = async ({
  userId
}: {
  userId: string
}): Promise<UserStatistics> => {
  const games = await getUserGames(userId)

  const finishedGames = games.filter((game) => game.status === 'finished')

  let totalStrokes = 0
  let totalHoles = 0
  let holesInOne = 0
  let gamesWon = 0
  let totalGameTime = 0
  let individualGames = 0
  let multiplayerGames = 0
  const recentGameResults: number[] = []

  finishedGames.forEach((game) => {
    const userPlayer = game.players.find((p) => p.userId === userId)
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
      const duration = game.finishedAt.getTime() - game.createdAt.getTime()
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
    const userPlayer = game.players.find((p) => p.userId === userId)
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

  const favoriteGameType: 'individual' | 'multiplayer' | null =
    multiplayerGames > individualGames
      ? 'multiplayer'
      : individualGames > multiplayerGames
      ? 'individual'
      : null

  const winRate =
    finishedGames.length > 0 ? (gamesWon / finishedGames.length) * 100 : 0
  const stats = {
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
  }

  return stats
}
