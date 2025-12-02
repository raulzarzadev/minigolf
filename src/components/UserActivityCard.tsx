'use client'
import { Calendar, Target, TrendingUp, Trophy, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getAllUserGames } from '@/lib/db'
import { User } from '@/types'

interface ActivityStats {
  gamesThisWeek: number
  gamesThisMonth: number
  bestScore: number | null
  recentAverage: number | null
  multiplayerGames: number
  longestStreak: number
  currentStreak: number
  averageGameDuration: number
}

interface UserActivityCardProps {
  user: User
}

export default function UserActivityCard({ user }: UserActivityCardProps) {
  const [stats, setStats] = useState<ActivityStats>({
    gamesThisWeek: 0,
    gamesThisMonth: 0,
    bestScore: null,
    recentAverage: null,
    multiplayerGames: 0,
    longestStreak: 0,
    currentStreak: 0,
    averageGameDuration: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const calculateStats = async () => {
      try {
        setLoading(true)
        const userGames = await getAllUserGames(user.id)
        const finishedGames = userGames.filter(
          (game) => game.status === 'finished'
        )

        if (finishedGames.length === 0) {
          setLoading(false)
          return
        }

        // Calcular fechas
        const now = new Date()
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        // Juegos esta semana y mes
        const gamesThisWeek = finishedGames.filter(
          (game) => game.finishedAt && game.finishedAt >= oneWeekAgo
        ).length

        const gamesThisMonth = finishedGames.filter(
          (game) => game.finishedAt && game.finishedAt >= oneMonthAgo
        ).length

        // Obtener puntuaciones del usuario
        const userScores = finishedGames
          .map((game) => {
            const scores = game.scores[user.id]
            return scores ? scores.reduce((a, b) => a + b, 0) : null
          })
          .filter((score) => score !== null) as number[]

        // Mejor puntuación (menor es mejor)
        const bestScore = userScores.length > 0 ? Math.min(...userScores) : null

        // Promedio reciente (últimos 5 juegos)
        const recentScores = userScores.slice(0, 5)
        const recentAverage =
          recentScores.length > 0
            ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length
            : null

        // Juegos multijugador
        const multiplayerGames = finishedGames.filter(
          (game) => game.isMultiplayer
        ).length

        // Calcular rachas (días consecutivos jugando)
        const playDates = finishedGames
          .map((game) => game.finishedAt?.toDateString())
          .filter(Boolean)
          .filter((date, index, array) => array.indexOf(date) === index) // Eliminar duplicados
          .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())

        let currentStreak = 0
        let longestStreak = 0
        let tempStreak = 0

        for (let i = 0; i < playDates.length; i++) {
          const currentDate = new Date(playDates[i]!)
          const expectedDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)

          if (currentDate.toDateString() === expectedDate.toDateString()) {
            if (i === 0) currentStreak++
            tempStreak++
            longestStreak = Math.max(longestStreak, tempStreak)
          } else {
            tempStreak = 0
          }
        }

        // Duración promedio de juegos (estimada)
        const averageGameDuration =
          finishedGames.length > 0
            ? Math.round(finishedGames[0].holeCount * 2.5) // Estimación: 2.5 min por hoyo
            : 0

        setStats({
          gamesThisWeek,
          gamesThisMonth,
          bestScore,
          recentAverage,
          multiplayerGames,
          longestStreak,
          currentStreak,
          averageGameDuration
        })
      } catch (error) {
        console.error('Error calculating user stats:', error)
      } finally {
        setLoading(false)
      }
    }

    calculateStats()
  }, [user.id])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Tu actividad
        </h2>
        <div className="animate-pulse">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-16"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded h-4"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h2 className="text-base font-semibold text-gray-900 mb-4">
        Tu actividad
      </h2>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center p-3 bg-green-600 rounded-lg">
          <div className="text-lg font-bold text-white">{user.gamesPlayed}</div>
          <div className="text-xs text-green-100 mt-1">Total partidas</div>
        </div>

        <div className="text-center p-3 bg-blue-100 rounded-lg">
          <div className="text-lg font-bold text-blue-800">
            {user.averageScore > 0 ? user.averageScore.toFixed(1) : '--'}
          </div>
          <div className="text-xs text-blue-600 mt-1">Promedio general</div>
        </div>

        <div className="text-center p-3 bg-purple-100 rounded-lg">
          <div className="text-lg font-bold text-purple-800">
            {stats.bestScore !== null ? stats.bestScore : '--'}
          </div>
          <div className="text-xs text-purple-600 mt-1">Mejor puntuación</div>
        </div>

        <div className="text-center p-3 bg-orange-100 rounded-lg">
          <div className="text-lg font-bold text-orange-800">
            {stats.recentAverage !== null
              ? stats.recentAverage.toFixed(1)
              : '--'}
          </div>
          <div className="text-xs text-orange-600 mt-1">Últimos 5 juegos</div>
        </div>
      </div>

      {/* Actividad detallada */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-600" />
            <span className="text-sm text-gray-700">Esta semana</span>
          </div>
          <span className="text-sm font-medium text-gray-900">
            {stats.gamesThisWeek} partidas
          </span>
        </div>

        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-gray-600" />
            <span className="text-sm text-gray-700">Este mes</span>
          </div>
          <span className="text-sm font-medium text-gray-900">
            {stats.gamesThisMonth} partidas
          </span>
        </div>

        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-gray-600" />
            <span className="text-sm text-gray-700">Multijugador</span>
          </div>
          <span className="text-sm font-medium text-gray-900">
            {stats.multiplayerGames} partidas
          </span>
        </div>

        {stats.currentStreak > 0 && (
          <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">Racha actual</span>
            </div>
            <span className="text-sm font-medium text-green-900">
              {stats.currentStreak} días
            </span>
          </div>
        )}

        {stats.longestStreak > 1 && (
          <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-700">Mejor racha</span>
            </div>
            <span className="text-sm font-medium text-yellow-900">
              {stats.longestStreak} días
            </span>
          </div>
        )}
      </div>

      {/* Mensaje motivacional */}
      {user.gamesPlayed === 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-center">
          <p className="text-sm text-blue-700">
            ¡Empieza tu primera partida para ver tus estadísticas! 🏌️‍♂️
          </p>
        </div>
      )}

      {stats.gamesThisWeek === 0 && user.gamesPlayed > 0 && (
        <div className="mt-4 p-3 bg-amber-50 rounded-lg text-center">
          <p className="text-sm text-amber-700">
            ¡No has jugado esta semana! ¿Qué tal una partida rápida? ⛳
          </p>
        </div>
      )}

      {stats.currentStreak >= 3 && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg text-center">
          <p className="text-sm text-green-700">
            ¡Increíble racha de {stats.currentStreak} días! Sigue así 🔥
          </p>
        </div>
      )}
    </div>
  )
}
