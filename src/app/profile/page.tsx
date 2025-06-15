'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getUserGames } from '@/lib/db'
import { Game } from '@/types'
import Navbar from '@/components/Navbar'
import UserStats from '@/components/UserStats'
import DiscreteUsernameEditor from '@/components/DiscreteUsernameEditor'
import Link from 'next/link'
import {
  User,
  Trophy,
  Target,
  Clock,
  Play,
  Flag,
  TrendingUp
} from 'lucide-react'

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const [userGames, setUserGames] = useState<Game[]>([])
  const [gamesLoading, setGamesLoading] = useState(true)

  useEffect(() => {
    const loadUserGames = async () => {
      if (!user) return

      try {
        const games = await getUserGames(user.id)
        setUserGames(games)
      } catch (error) {
        console.error('Error loading user games:', error)
      } finally {
        setGamesLoading(false)
      }
    }

    if (user) {
      loadUserGames()
    }
  }, [user])

  const calculateStats = () => {
    const completedGames = userGames.filter(
      (game) => game.status === 'finished'
    )
    const totalGames = userGames.length
    const inProgressGames = userGames.filter(
      (game) => game.status === 'in_progress'
    ).length

    let totalStrokes = 0
    let totalHoles = 0
    let bestGame = Infinity
    let holesInOne = 0

    completedGames.forEach((game) => {
      const playerScores = game.scores[user!.id] || []
      const gameStrokes = playerScores.reduce((sum, score) => sum + score, 0)
      const completedHoles = playerScores.filter((score) => score > 0).length

      if (completedHoles > 0) {
        totalStrokes += gameStrokes
        totalHoles += completedHoles

        if (completedHoles === game.holeCount && gameStrokes < bestGame) {
          bestGame = gameStrokes
        }

        holesInOne += playerScores.filter((score) => score === 1).length
      }
    })

    const averageScore =
      totalHoles > 0 ? (totalStrokes / totalHoles).toFixed(1) : '0.0'

    return {
      totalGames,
      completedGames: completedGames.length,
      inProgressGames,
      averageScore,
      bestGame: bestGame === Infinity ? null : bestGame,
      holesInOne,
      totalStrokes,
      totalHoles
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
        </div>
      </div>
    )
  }

  const stats = calculateStats()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">
                {user.name}
              </h1>
              {/* <p className="text-sm text-gray-400 font-mono truncate">
                @{user.username}
              </p> */}
              <DiscreteUsernameEditor />

              {/* <p className="text-sm text-gray-600 truncate">{user.email}</p>
              <p className="text-xs text-gray-500">
                Miembro desde{' '}
                {new Date(user.createdAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'short'
                })}
              </p> */}
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">
                {stats.totalGames}
              </div>
              <div className="text-xs text-gray-500">Partidas</div>
            </div>
          </div>

          {/* Username Section */}
          <div className="border-t border-gray-100 pt-4"></div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex items-center space-x-2">
              <div className="bg-green-100 rounded-lg p-2">
                <Trophy className="h-4 w-4 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg font-bold text-gray-900">
                  {stats.completedGames}
                </div>
                <div className="text-xs text-gray-500">Completadas</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex items-center space-x-2">
              <div className="bg-green-100 rounded-lg p-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg font-bold text-gray-900">
                  {stats.averageScore}
                </div>
                <div className="text-xs text-gray-500">Promedio</div>
              </div>
            </div>
          </div>

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
        </div>

        {/* Games History */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">
              Historial de Partidas
            </h2>
            <Link
              href="/game/new"
              className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm touch-manipulation"
            >
              <Play className="h-4 w-4 mr-1" />
              Nueva
            </Link>
          </div>

          {gamesLoading ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
              <p className="text-gray-500 mt-2 text-sm">Cargando partidas...</p>
            </div>
          ) : userGames.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Clock className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No has jugado ninguna partida aún</p>
              <p className="text-xs">¡Crea tu primera partida para empezar!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userGames.map((game) => {
                const playerScore = game.scores[user.id] || []
                const totalScore = playerScore.reduce(
                  (sum, score) => sum + score,
                  0
                )
                const completedHoles = playerScore.filter(
                  (score) => score > 0
                ).length

                return (
                  <Link
                    key={game.id}
                    href={`/game/${game.id}`}
                    className="block border border-gray-200 rounded-lg p-3 hover:border-gray-300 hover:shadow-sm transition-all active:scale-98 touch-manipulation"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            game.status === 'finished'
                              ? 'bg-green-100'
                              : 'bg-blue-100'
                          }`}
                        >
                          {game.status === 'finished' ? (
                            <Flag className="h-4 w-4 text-green-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm text-gray-900 truncate">
                            {game.isMultiplayer ? 'Multijugador' : 'Individual'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(game.createdAt).toLocaleDateString(
                              'es-ES'
                            )}{' '}
                            • {game.holeCount} hoyos • {game.players.length}{' '}
                            jugador{game.players.length > 1 ? 'es' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-semibold text-base">
                          {completedHoles > 0 ? totalScore : '--'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {completedHoles} / {game.holeCount} hoyos
                        </div>
                        <div
                          className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                            game.status === 'finished'
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {game.status === 'finished'
                            ? 'Terminada'
                            : 'En progreso'}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* User Statistics */}
        {user && <UserStats user={user} />}
      </div>
    </div>
  )
}
