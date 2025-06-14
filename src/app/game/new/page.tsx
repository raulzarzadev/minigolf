'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createGame, generateGuestId, searchUsers } from '@/lib/db'
import { Player } from '@/types'
import Navbar from '@/components/Navbar'
import { Plus, X, Search, Users, User } from 'lucide-react'

const gameSchema = z.object({
  holeCount: z.number().min(1).max(36),
  isMultiplayer: z.boolean(),
  tournamentId: z.string().optional()
})

type GameFormData = z.infer<typeof gameSchema>

export default function NewGamePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [guestName, setGuestName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const form = useForm<GameFormData>({
    resolver: zodResolver(gameSchema),
    defaultValues: {
      holeCount: 18,
      isMultiplayer: false
    }
  })

  const isMultiplayer = form.watch('isMultiplayer')

  React.useEffect(() => {
    if (user && isMultiplayer) {
      // Add current user as the first player
      const currentPlayer: Player = {
        id: user.id,
        name: user.name,
        userId: user.id,
        isGuest: false
      }
      setPlayers([currentPlayer])
    } else {
      setPlayers([])
    }
  }, [user, isMultiplayer])

  const handleSearchUsers = async (term: string) => {
    if (term.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const results = await searchUsers(term)
      // Filter out current user and already added players
      const filteredResults = results.filter(
        (searchUser) =>
          searchUser.id !== user?.id &&
          !players.some((player) => player.userId === searchUser.id)
      )
      setSearchResults(filteredResults)
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const addGuestPlayer = () => {
    if (!guestName.trim()) return

    const guestPlayer: Player = {
      id: generateGuestId(),
      name: guestName.trim(),
      isGuest: true
    }

    setPlayers([...players, guestPlayer])
    setGuestName('')
  }

  const addUserPlayer = (searchUser: any) => {
    const userPlayer: Player = {
      id: searchUser.id,
      name: searchUser.name,
      userId: searchUser.id,
      isGuest: false
    }

    setPlayers([...players, userPlayer])
    setSearchTerm('')
    setSearchResults([])
  }

  const removePlayer = (playerId: string) => {
    // Don't allow removing the current user (first player)
    if (players[0]?.userId === user?.id && playerId === user.id) return

    setPlayers(players.filter((player) => player.id !== playerId))
  }

  const onSubmit = async (data: GameFormData) => {
    if (!user) return

    setIsLoading(true)
    try {
      const gameData = {
        createdBy: user.id,
        holeCount: data.holeCount,
        players: data.isMultiplayer
          ? players
          : [
              {
                id: user.id,
                name: user.name,
                userId: user.id,
                isGuest: false
              }
            ],
        scores: {},
        status: 'in_progress' as const,
        tournamentId: data.tournamentId || null,
        isMultiplayer: data.isMultiplayer,
        currentHole: 1
      }

      // Initialize scores for all players
      gameData.players.forEach((player) => {
        gameData.scores[player.id] = new Array(data.holeCount).fill(0)
      })

      const gameId = await createGame(gameData)
      router.push(`/game/${gameId}`)
    } catch (error) {
      console.error('Error creating game:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return <div>Cargando...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Nueva Partida 🏌️‍♂️
          </h1>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Game Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de partida
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="relative">
                  <input
                    {...form.register('isMultiplayer')}
                    type="radio"
                    value="false"
                    className="sr-only"
                  />
                  <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      !isMultiplayer
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <User className="h-6 w-6 text-green-600" />
                      <div>
                        <div className="font-medium">Individual</div>
                        <div className="text-sm text-gray-500">Solo tú</div>
                      </div>
                    </div>
                  </div>
                </label>

                <label className="relative">
                  <input
                    {...form.register('isMultiplayer')}
                    type="radio"
                    value="true"
                    className="sr-only"
                  />
                  <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      isMultiplayer
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Users className="h-6 w-6 text-green-600" />
                      <div>
                        <div className="font-medium">Multijugador</div>
                        <div className="text-sm text-gray-500">Con amigos</div>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Number of Holes */}
            <div>
              <label
                htmlFor="holeCount"
                className="block text-sm font-medium text-gray-700"
              >
                Número de hoyos
              </label>
              <select
                {...form.register('holeCount', { valueAsNumber: true })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value={9}>9 hoyos</option>
                <option value={18}>18 hoyos</option>
                <option value={36}>36 hoyos</option>
              </select>
            </div>

            {/* Players Section - Only for Multiplayer */}
            {isMultiplayer && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Jugadores ({players.length})
                </label>

                {/* Current Players */}
                <div className="space-y-2 mb-4">
                  {players.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {player.isGuest ? (
                          <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                        ) : (
                          <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-green-600">
                              {player.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{player.name}</div>
                          <div className="text-xs text-gray-500">
                            {player.isGuest ? 'Invitado' : 'Usuario registrado'}
                            {index === 0 && ' (Tú)'}
                          </div>
                        </div>
                      </div>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removePlayer(player.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Guest Player */}
                <div className="border border-gray-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Añadir invitado
                  </h4>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Nombre del invitado"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      onKeyPress={(e) =>
                        e.key === 'Enter' &&
                        (e.preventDefault(), addGuestPlayer())
                      }
                    />
                    <button
                      type="button"
                      onClick={addGuestPlayer}
                      disabled={!guestName.trim()}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Search Users */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Buscar usuarios registrados
                  </h4>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        handleSearchUsers(e.target.value)
                      }}
                      placeholder="Buscar por nombre"
                      className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                    <Search className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="mt-2 border border-gray-200 rounded-lg">
                      {searchResults.map((searchUser) => (
                        <button
                          key={searchUser.id}
                          type="button"
                          onClick={() => addUserPlayer(searchUser)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg border-b border-gray-200 last:border-b-0"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-green-600">
                                {searchUser.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">
                                {searchUser.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {searchUser.email}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {isSearching && (
                    <div className="mt-2 text-center text-gray-500">
                      Buscando...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || (isMultiplayer && players.length < 2)}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creando...' : 'Crear Partida'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
