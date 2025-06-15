'use client'
import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AuthForm from '@/components/AuthForm'
import FirebaseSetupGuide from '@/components/FirebaseSetupGuide'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { Plus, Trophy, BarChart3, Clock, Users, User } from 'lucide-react'
import { Game } from '@/types'
import { getAllUserGames } from '@/lib/db'
import {
  getUserStats,
  MainUserStats,
  UserStatistics
} from '@/components/UserStats'

export default function Home() {
  const { user, loading, firebaseError } = useAuth()
  const [recentGames, setRecentGames] = useState<Game[]>([])
  const [loadingGames, setLoadingGames] = useState(false)
  const [stats, setStats] = useState<UserStatistics | null>()

  useEffect(() => {
    const loadRecentGames = async () => {
      if (!user) {
        setRecentGames([])
        return
      }

      try {
        const stats = await getUserStats({ userId: user.id })
        setStats(stats)
        setLoadingGames(true)
        const userGames = await getAllUserGames(user.id)
        // Tomar solo las 3 partidas más recientes
        setRecentGames(userGames.slice(0, 3))
      } catch (err) {
        console.error('Error loading recent games:', err)
      } finally {
        setLoadingGames(false)
      }
    }

    if (user) {
      loadRecentGames()
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  // Show Firebase setup guide if there's a configuration error
  if (firebaseError) {
    return <FirebaseSetupGuide />
  }

  if (!user) {
    return <AuthForm />
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-3 px-3 sm:py-8 sm:px-6 lg:px-8">
        {/* Welcome Header - Optimizado para móvil */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900 leading-tight">
            ¡Hola, {user.name}! 🏌️‍♂️
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            ¿Listo para una nueva partida?
          </p>
        </div>
        {/* Quick Actions - Grid responsivo optimizado */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Link href="/game/new" className="group">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-all group-hover:border-green-500 active:scale-95 touch-manipulation">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="bg-green-600 rounded-lg p-2">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Nueva Partida
                  </h3>
                  <p className="text-xs text-gray-500">
                    Individual o multijugador
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/tournaments" className="group">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-all group-hover:border-gray-400 active:scale-95 touch-manipulation">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="bg-yellow-50 rounded-lg p-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Torneos</h3>
                  <p className="text-xs text-gray-500">Competencias activas</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/profile" className="group">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-all group-hover:border-gray-600 active:scale-95 touch-manipulation">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="bg-purple-100 rounded-lg p-2">
                  <BarChart3 className="h-5 w-5 text-purple-700" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Estadísticas
                  </h3>
                  <p className="text-xs text-gray-500">Tu rendimiento</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/games" className="group">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-all group-hover:border-gray-500 active:scale-95 touch-manipulation">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="bg-blue-100 rounded-lg p-2">
                  <Clock className="h-5 w-5 text-blue-800" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Mis Partidas
                  </h3>
                  <p className="text-xs text-gray-500">Historial de juegos</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
        {/* User Stats Summary - Optimizado para móvil */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Tu actividad
          </h2>

          <MainUserStats
            stats={stats}
            list={['averagePerHole', 'holesInOne', 'winRate', 'totalGame']}
          />
        </div>
        {/* Recent Games - Optimizado para móvil */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">
              Partidas recientes
            </h2>
            <Link
              href="/games"
              className="text-green-600 hover:text-green-700 text-sm font-medium"
            >
              Ver todas →
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            {loadingGames ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
              </div>
            ) : recentGames.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Clock className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No hay partidas recientes</p>
                <p className="text-xs">
                  ¡Crea tu primera partida para empezar!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs text-gray-600 mb-2 font-medium">
                  📋 Incluye partidas donde eres creador o invitado
                </div>
                {recentGames.map((game) => {
                  const isCreator = game.createdBy === user.id

                  return (
                    <div key={game.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <div className="flex-shrink-0">
                            {game.isMultiplayer ? (
                              <Users className="h-4 w-4 text-black" />
                            ) : (
                              <User className="h-4 w-4 text-gray-600" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {game.isMultiplayer
                                  ? `Multijugador`
                                  : 'Individual'}
                              </h3>
                              {!isCreator && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  Invitado
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {game.createdAt.toLocaleDateString()} •{' '}
                              {game.holeCount} hoyos
                            </p>
                            {game.isMultiplayer && (
                              <p className="text-xs text-gray-500">
                                {game.players.length} jugador
                                {game.players.length !== 1 ? 'es' : ''}:{' '}
                                {game.players.map((p) => p.name).join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            game.status === 'finished'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-200 text-black'
                          }`}
                        >
                          {game.status === 'finished'
                            ? 'Finalizada'
                            : 'En progreso'}
                        </span>
                      </div>
                      <div className="flex justify-end">
                        <Link
                          href={`/game/${game.id}`}
                          className="text-green-600 hover:text-green-700 text-sm font-medium active:scale-95 transition-all touch-manipulation"
                        >
                          {game.status === 'finished'
                            ? 'Ver resultado'
                            : 'Continuar partida'}
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>{' '}
    </div>
  )
}
