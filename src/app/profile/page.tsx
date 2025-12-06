'use client'

import { Clock, Flag, User } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import ActiveGameBanner from '@/components/ActiveGameBanner'
import DiscreteUsernameEditor from '@/components/DiscreteUsernameEditor'

import RewardLogrosCard from '@/components/RewardLogrosCard'
import UserStats, { MainUserStats } from '@/components/UserStats'
import { useAuth } from '@/contexts/AuthContext'
import { getUserGames } from '@/lib/db'
import { Game } from '@/types'

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
      <div className="min-h-screen">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
        </div>
      </div>
    )
  }

  const stats = calculateStats()

  return (
    <div className="min-h-screen bg-gray-50">
      <ActiveGameBanner />
      <div className="max-w-6xl mx-auto py-4 px-3 sm:px-6 lg:px-8 space-y-4">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 bg-emerald-50 rounded-full flex items-center justify-center shrink-0">
              <User className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900 truncate">
                  {user.name}
                </h1>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  ID: {user.id}
                </span>
              </div>
              <DiscreteUsernameEditor />
              <p className="text-xs text-gray-500 mt-1 truncate">
                {user.email || 'Sin correo registrado'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Partidas</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalGames}
              </p>
            </div>
          </div>
        </div>

        {/* Reward center */}
        <div
          id="reward-center"
          className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm"
        >
          <RewardLogrosCard />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-3">
                Resumen rápido
              </h2>
              <MainUserStats
                stats={{
                  totalGames: stats.totalGames,
                  gamesWon: 0,
                  totalStrokes: stats.totalStrokes,
                  totalHoles: stats.totalHoles,
                  averagePerHole: Number(stats.averageScore),
                  bestGame: stats.bestGame ?? 0,
                  holesInOne: stats.holesInOne,
                  averageGameTime: 0,
                  favoriteGameType: null,
                  winRate: 0,
                  recentForm: []
                }}
              />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900">
                  Historial de partidas
                </h2>
                <Link
                  href="/games"
                  className="inline-flex items-center text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Ver todo
                </Link>
              </div>

              {gamesLoading ? (
                <div className="text-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto"></div>
                  <p className="text-gray-500 mt-2 text-sm">
                    Cargando partidas...
                  </p>
                </div>
              ) : userGames.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <Clock className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No has jugado ninguna partida aún</p>
                  <p className="text-xs">
                    ¡Crea tu primera partida para empezar!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userGames
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    )
                    .slice(0, 5)
                    .map((game) => {
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
                          className="block border border-gray-200 rounded-lg p-3 hover:border-gray-300 hover:shadow-sm transition-all active:scale-98 touch-manipulation bg-white"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 min-w-0 flex-1">
                              <div
                                className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                                  game.status === 'finished'
                                    ? 'bg-emerald-100'
                                    : 'bg-blue-100'
                                }`}
                              >
                                {game.status === 'finished' ? (
                                  <Flag className="h-4 w-4 text-emerald-600" />
                                ) : (
                                  <Clock className="h-4 w-4 text-emerald-600" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-sm text-gray-900 truncate">
                                  {game.isMultiplayer
                                    ? 'Multijugador'
                                    : 'Individual'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(game.createdAt).toLocaleDateString(
                                    'es-ES'
                                  )}{' '}
                                  • {game.holeCount} hoyos •{' '}
                                  {game.players.length} jugador
                                  {game.players.length > 1 ? 'es' : ''}
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-semibold text-base">
                                {completedHoles > 0 ? totalScore : '--'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {completedHoles} / {game.holeCount} hoyos
                              </div>
                              <div
                                className={`text-[11px] px-2 py-1 rounded-full inline-block mt-1 ${
                                  game.status === 'finished'
                                    ? 'bg-emerald-100 text-emerald-700'
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
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <UserStats user={user} />
          </div>
        </div>
      </div>
    </div>
  )
}
