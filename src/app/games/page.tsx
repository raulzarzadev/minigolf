'use client'

import { Calendar, Clock, Trophy, User, Users } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { getAllUserGames } from '@/lib/db'
import { Game } from '@/types'

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
        const userGames = await getAllUserGames(user.id)
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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-black">
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

  const calculatePlayerScore = (game: Game, playerId: string) => {
    const playerScores = game.scores[playerId]
    if (!playerScores) return 0
    return playerScores.reduce((total, score) => total + score, 0)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-3 px-3 sm:py-8 sm:px-6 lg:px-8">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">Mis Partidas</h1>
          <p className="mt-1 text-sm text-gray-600">
            Historial de tus juegos de minigolf (como creador e invitado)
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
          </div>
        ) : error ? (
          <div className="bg-gray-100 border border-gray-300 rounded-md p-3">
            <div className="text-black text-sm">{error}</div>
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-10 w-10 mx-auto text-gray-400 mb-3" />
            <h3 className="text-base font-medium text-gray-900 mb-2">
              No hay partidas aún
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              ¡Crea tu primera partida para empezar a jugar!
            </p>
            <Link
              href="/game/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 active:scale-95 transition-all touch-manipulation"
            >
              Nueva Partida
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {games.map((game) => {
              const isCreator = game.createdBy === user.id
              const userPlayer = game.players.find((p) => p.userId === user.id)

              return (
                <div
                  key={game.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-3"
                >
                  <div className="flex items-center justify-between mb-3">
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
                            {game.isMultiplayer ? `Multijugador` : 'Individual'}
                          </h3>
                          {!isCreator && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Invitado
                            </span>
                          )}
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          {game.createdAt.toLocaleDateString()}
                        </div>
                        {game.isMultiplayer && (
                          <div className="text-xs text-gray-500 mt-1">
                            {game.players.length} jugador
                            {game.players.length !== 1 ? 'es' : ''}:{' '}
                            {game.players.map((p) => p.name).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      {getStatusBadge(game.status)}
                      {game.status === 'finished' && userPlayer && (
                        <div className="text-xs text-gray-500">
                          <Trophy className="h-3 w-3 inline mr-1" />
                          {calculatePlayerScore(game, userPlayer.id)} golpes
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">
                        {game.holeCount}
                      </div>
                      <div className="text-xs text-gray-500">Hoyos</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">
                        {game.players.length}
                      </div>
                      <div className="text-xs text-gray-500">Jugadores</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">
                        {game.currentHole}/{game.holeCount}
                      </div>
                      <div className="text-xs text-gray-500">Progreso</div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Link
                      href={`/game/${game.id}`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 active:scale-95 transition-all touch-manipulation"
                    >
                      {game.status === 'in_progress'
                        ? 'Continuar partida'
                        : 'Ver resultado'}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
