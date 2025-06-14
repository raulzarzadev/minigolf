'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/Navbar'
import { Clock, Trophy, Users, User, Calendar } from 'lucide-react'
import Link from 'next/link'
import { Game } from '@/types'
import { getUserGames } from '@/lib/db'

export default function GamesPage() {
  const { user } = useAuth()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadUserGames = async () => {
      if (!user) return

      try {
        setLoading(true)
        const userGames = await getUserGames(user.id)
        setGames(userGames)
      } catch (err) {
        setError('Error al cargar las partidas')
        console.error('Error loading games:', err)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadUserGames()
    }
  }, [user])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Debes iniciar sesión
          </h1>
          <p className="text-gray-600">Inicia sesión para ver tus partidas</p>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            En progreso
          </span>
        )
      case 'finished':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Finalizada
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        )
    }
  }

  const calculateTotalScore = (game: Game) => {
    const playerScore = game.scores[user.id] || []
    return playerScore.reduce((total, score) => total + score, 0)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mis Partidas</h1>
          <p className="mt-2 text-gray-600">
            Historial completo de tus juegos de minigolf
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800">{error}</div>
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay partidas aún
            </h3>
            <p className="text-gray-600 mb-6">
              ¡Crea tu primera partida para empezar a jugar!
            </p>
            <Link
              href="/game/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Nueva Partida
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {games.map((game) => (
              <div
                key={game.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {game.isMultiplayer ? (
                          <Users className="h-6 w-6 text-blue-500" />
                        ) : (
                          <User className="h-6 w-6 text-green-500" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {game.isMultiplayer
                            ? `Partida Multijugador`
                            : 'Partida Individual'}
                        </h3>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {game.createdAt.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(game.status)}
                      {game.status === 'finished' && (
                        <div className="mt-1 text-sm text-gray-500">
                          <Trophy className="h-4 w-4 inline mr-1" />
                          {calculateTotalScore(game)} golpes
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {game.holeCount}
                      </div>
                      <div className="text-sm text-gray-500">Hoyos</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {game.players.length}
                      </div>
                      <div className="text-sm text-gray-500">Jugadores</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {game.currentHole}/{game.holeCount}
                      </div>
                      <div className="text-sm text-gray-500">Progreso</div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Jugadores: {game.players.map((p) => p.name).join(', ')}
                    </div>
                    <Link
                      href={`/game/${game.id}`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      {game.status === 'in_progress'
                        ? 'Continuar'
                        : 'Ver detalles'}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
