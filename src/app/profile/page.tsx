'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getUserGames } from '@/lib/db'
import { Game } from '@/types'
import Navbar from '@/components/Navbar'
import UserStats from '@/components/UserStats'
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

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center space-x-6">
            <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
              <User className="h-10 w-10 text-green-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-500 mt-1">
                Miembro desde{' '}
                {new Date(user.createdAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600">
                {stats.totalGames}
              </div>
              <div className="text-sm text-gray-500">Partidas totales</div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-lg p-3">
                <Trophy className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {stats.completedGames}
                </div>
                <div className="text-sm text-gray-500">
                  Partidas completadas
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg p-3">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {stats.averageScore}
                </div>
                <div className="text-sm text-gray-500">Promedio por hoyo</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 rounded-lg p-3">
                <Target className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {stats.holesInOne}
                </div>
                <div className="text-sm text-gray-500">Holes-in-one</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-lg p-3">
                <Flag className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {stats.bestGame || '--'}
                </div>
                <div className="text-sm text-gray-500">Mejor partida</div>
              </div>
            </div>
          </div>
        </div>

        {/* Games History */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Historial de Partidas
            </h2>
            <Link
              href="/game/new"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Play className="h-4 w-4 mr-2" />
              Nueva Partida
            </Link>
          </div>

          {gamesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
              <p className="text-gray-500 mt-2">Cargando partidas...</p>
            </div>
          ) : userGames.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No has jugado ninguna partida aún</p>
              <p className="text-sm">¡Crea tu primera partida para empezar!</p>
            </div>
          ) : (
            <div className="space-y-4">
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
                    className="block border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            game.status === 'finished'
                              ? 'bg-green-100'
                              : 'bg-blue-100'
                          }`}
                        >
                          {game.status === 'finished' ? (
                            <Flag className="h-5 w-5 text-green-600" />
                          ) : (
                            <Clock className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {game.isMultiplayer
                              ? 'Partida Multijugador'
                              : 'Partida Individual'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(game.createdAt).toLocaleDateString(
                              'es-ES'
                            )}{' '}
                            •{game.holeCount} hoyos • {game.players.length}{' '}
                            jugador{game.players.length > 1 ? 'es' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-lg">
                          {completedHoles > 0 ? totalScore : '--'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {completedHoles} / {game.holeCount} hoyos
                        </div>
                        <div
                          className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                            game.status === 'finished'
                              ? 'bg-green-100 text-green-600'
                              : 'bg-blue-100 text-blue-600'
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
