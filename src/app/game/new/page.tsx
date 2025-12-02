'use client'

import {
  AlertCircle,
  Plus,
  Search,
  User as UserIcon,
  Users as UsersIcon,
  X
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { createGame, generateGuestId, searchUsers } from '@/lib/db'
import { saveLocalGame } from '@/lib/localStorage'
import { Game, Player } from '@/types'

// Tipo para resultados de búsqueda de usuarios
interface SearchUser {
  id: string
  name: string
  email: string
}

interface GuestInput {
  id: string
  name: string
}

const createGuestInputField = (): GuestInput => ({
  id: generateGuestId(),
  name: ''
})

// Datos del formulario
interface GameFormData {
  holeCount: number
  isMultiplayer: string
  tournamentId?: string
}

export default function NewGamePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [guestInputs, setGuestInputs] = useState<GuestInput[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [guestPlayerName, setGuestPlayerName] = useState('')

  const form = useForm<GameFormData>({
    defaultValues: {
      holeCount: 9,
      isMultiplayer: 'false'
    }
  })

  const isMultiplayer = form.watch('isMultiplayer') === 'true'

  React.useEffect(() => {
    if (user && isMultiplayer) {
      // añade al creador
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

  React.useEffect(() => {
    if (isMultiplayer) {
      setGuestInputs((prev) =>
        prev.length > 0 ? prev : [createGuestInputField()]
      )
    } else {
      setGuestInputs([])
    }
  }, [isMultiplayer])

  const updateGuestInput = (id: string, value: string) => {
    setGuestInputs((prev) =>
      prev.map((input) => (input.id === id ? { ...input, name: value } : input))
    )
  }

  const addGuestInputField = () => {
    setGuestInputs((prev) => [...prev, createGuestInputField()])
  }

  const removeGuestInputField = (id: string) => {
    setGuestInputs((prev) => {
      if (prev.length === 1) {
        return prev.map((input) =>
          input.id === id ? { ...input, name: '' } : input
        )
      }
      return prev.filter((input) => input.id !== id)
    })
  }

  const guestPlayersFromInputs = useMemo(() => {
    return guestInputs
      .map((input) => ({
        id: input.id,
        name: input.name.trim(),
        isGuest: true
      }))
      .filter((player) => player.name.length > 0)
  }, [guestInputs])

  const totalPlayersCount = isMultiplayer
    ? (user ? Math.max(players.length, 1) : 1) + guestPlayersFromInputs.length
    : 1

  const hasMinimumPlayers = !isMultiplayer || totalPlayersCount >= 2

  const handleSearchUsers = async (term: string) => {
    if (term.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const results = await searchUsers(term)
      const filtered = results.filter(
        (u) => u.id !== user?.id && !players.some((p) => p.userId === u.id)
      )
      setSearchResults(filtered)
    } catch (e) {
      console.error('Error searchUsers:', e)
    } finally {
      setIsSearching(false)
    }
  }

  const addUserPlayer = (u: SearchUser) => {
    const userPlayer: Player = {
      id: u.id,
      name: u.name,
      userId: u.id,
      isGuest: false
    }
    setPlayers((prev) => [...prev, userPlayer])
    setSearchTerm('')
    setSearchResults([])
  }

  // Eliminar jugador
  const removePlayer = (playerId: string) => {
    if (!user) return
    // No permitir eliminar al creador
    const userId = user.id
    if (players[0]?.userId === userId && playerId === userId) return
    setPlayers((prev) => prev.filter((p) => p.id !== playerId))
  }

  const onSubmit = async (data: GameFormData) => {
    setIsLoading(true)
    setError(null)
    try {
      // convertir a booleano
      const multi = data.isMultiplayer === 'true'
      const guestPlayersList = guestInputs
        .map((input) => ({
          id: input.id,
          name: input.name.trim(),
          isGuest: true
        }))
        .filter((player) => player.name.length > 0)

      if (multi && totalPlayersCount < 2) {
        setError('Agrega al menos un jugador adicional')
        setIsLoading(false)
        return
      }

      // For guest users, create a temporary player
      let creatorPlayer: Player
      if (user) {
        creatorPlayer = {
          id: user.id,
          name: user.name,
          userId: user.id,
          isGuest: false
        }
      } else {
        // Guest user - create a temporary player
        if (!guestPlayerName.trim()) {
          setError('Por favor ingresa tu nombre')
          return
        }
        creatorPlayer = {
          id: generateGuestId(),
          name: guestPlayerName.trim(),
          isGuest: true
        }
      }

      let finalPlayers: Player[]
      if (multi) {
        if (user) {
          const basePlayers = players.length > 0 ? players : [creatorPlayer]
          finalPlayers = [...basePlayers, ...guestPlayersList]
        } else {
          finalPlayers = [creatorPlayer, ...guestPlayersList]
        }
      } else {
        finalPlayers = [creatorPlayer]
      }

      const gameData: Omit<Game, 'id' | 'createdAt'> = {
        createdBy: user?.id || creatorPlayer.id,
        holeCount: data.holeCount,
        players: finalPlayers,
        scores: {} as Record<string, number[]>,
        status: 'in_progress',
        tournamentId: data.tournamentId || null,
        isMultiplayer: multi,
        currentHole: 1
      }
      finalPlayers.forEach((p) => {
        gameData.scores[p.id] = Array(data.holeCount).fill(0)
      })

      let gameId: string
      if (user) {
        // Usuario autenticado: guardar en el servidor
        gameId = await createGame(gameData)
      } else {
        // Usuario invitado: guardar localmente
        gameId = saveLocalGame(gameData)
      }

      router.push(`/game/${gameId}`)
    } catch (e) {
      console.error('Error creating game:', e)
      setError(e instanceof Error ? e.message : 'Error al crear')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto py-4 px-3 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h1 className="text-xl font-bold text-gray-900 mb-4">
              Nueva Partida 🏌️‍♂️
            </h1>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Error al crear la partida
                    </h3>
                    <div className="mt-1 text-sm text-red-700">{error}</div>
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => setError(null)}
                        className="text-sm text-red-600 hover:text-red-500"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Guest Player Name */}
              <div>
                <label
                  htmlFor="guest-player-name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Tu nombre
                </label>
                <input
                  type="text"
                  value={guestPlayerName}
                  onChange={(e) => setGuestPlayerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Ingresa tu nombre"
                  required
                  id="guest-player-name"
                />
              </div>

              {/* Hole Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de hoyos
                </label>
                <select
                  {...form.register('holeCount', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value={9}>9 hoyos</option>
                  <option value={18}>18 hoyos</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !hasMinimumPlayers}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creando...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Crear Partida</span>
                    </>
                  )}
                </button>
                {isMultiplayer && !hasMinimumPlayers && (
                  <p className="text-xs text-red-600 text-right">
                    Agrega al menos un jugador adicional
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto py-4 px-3 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h1 className="text-xl font-bold text-gray-900 mb-4">
            Nueva Partida 🏌️‍♂️
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error al crear la partida
                  </h3>
                  <div className="mt-1 text-sm text-red-700">{error}</div>
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setError(null)}
                      className="text-sm text-red-600 hover:text-red-500"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Game Type */}
            <div>
              <h5 className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de partida
              </h5>
              <div className="grid grid-cols-1 gap-3">
                <label className="relative">
                  <input
                    {...form.register('isMultiplayer')}
                    type="radio"
                    value="false"
                    className="sr-only"
                  />
                  <div
                    className={`border-2 rounded-lg p-3 cursor-pointer transition-colors touch-manipulation ${
                      !isMultiplayer
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-end space-x-3">
                      <UserIcon className="h-5 w-5 text-green-600" />
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
                    className={`border-2 rounded-lg p-3 cursor-pointer transition-colors touch-manipulation ${
                      isMultiplayer
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-end space-x-3">
                      <UsersIcon className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-medium">Multijugador</div>
                        <div className="text-sm text-gray-500">
                          Juega en famila
                        </div>
                      </div>
                    </div>
                    {isMultiplayer && !hasMinimumPlayers && (
                      <p className="text-xs text-red-600 text-right">
                        Agrega al menos un jugador adicional
                      </p>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Number of Holes */}
            <div>
              <label
                htmlFor="holeCount"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Número de hoyos
              </label>
              <select
                disabled // disabled until we support more than 9 holes
                {...form.register('holeCount', { valueAsNumber: true })}
                className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-base disabled:opacity-30 disabled:cursor-not-allowed "
              >
                <option value={9}>9 hoyos</option>
                <option value={18}>18 hoyos</option>
                <option value={36}>36 hoyos</option>
              </select>
            </div>

            {/* Players Section - Only for Multiplayer */}
            {isMultiplayer && (
              <div>
                <h5 className="block text-sm font-medium text-gray-700 mb-3">
                  Jugadores ({totalPlayersCount})
                </h5>

                {/* Current Players */}
                <div className="space-y-2 mb-4">
                  {players.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        {player.isGuest ? (
                          <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                            <UserIcon className="h-4 w-4 text-gray-600" />
                          </div>
                        ) : (
                          <div className="h-8 w-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-white">
                              {player.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">
                            {player.name}
                          </div>
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
                          className="text-red-500 hover:text-red-700 p-1 touch-manipulation"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Guest Inputs */}
                <div className="border border-gray-200 rounded-lg p-3 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2 text-sm">
                    Jugadores invitados (se agregarán al guardar)
                  </h4>
                  <div className="space-y-2">
                    {guestInputs.map((input, index) => (
                      <div key={input.id} className="flex space-x-2">
                        <input
                          type="text"
                          value={input.name}
                          onChange={(e) =>
                            updateGuestInput(input.id, e.target.value)
                          }
                          placeholder={`Nombre del invitado ${index + 1}`}
                          className="flex-1 px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 text-base"
                        />
                        <button
                          type="button"
                          onClick={() => removeGuestInputField(input.id)}
                          className="px-3 py-3 border border-gray-300 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addGuestInputField}
                    className="mt-3 w-full inline-flex items-center justify-center px-3 py-2 border border-dashed border-green-400 text-green-700 rounded-md hover:bg-green-50 text-sm"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Agregar otro invitado
                  </button>
                </div>

                {/* Search Users */}
                <div className="border border-gray-200 rounded-lg p-3">
                  <h4 className="font-medium text-gray-900 mb-2 text-sm">
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
                      className="w-full px-3 py-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-black focus:border-black text-base"
                    />
                    <Search className="h-4 w-4 text-gray-400 absolute left-3 top-4" />
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="mt-2 border border-gray-200 rounded-lg">
                      {searchResults.map((searchUser) => (
                        <button
                          key={searchUser.id}
                          type="button"
                          onClick={() => addUserPlayer(searchUser)}
                          className="w-full text-left px-3 py-3 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg border-b border-gray-200 last:border-b-0 touch-manipulation"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="h-6 w-6 bg-black rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-white">
                                {searchUser.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm truncate">
                                {searchUser.name}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {searchUser.email}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {isSearching && (
                    <div className="mt-2 text-center text-gray-500 text-sm">
                      Buscando...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex flex-col space-y-3 pt-4">
              <button
                type="submit"
                disabled={isLoading || !hasMinimumPlayers}
                className="w-full py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium touch-manipulation"
              >
                {isLoading ? 'Creando...' : 'Crear Partida'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="w-full py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium touch-manipulation"
              >
                Cancelar
              </button>
              {isMultiplayer && !hasMinimumPlayers && (
                <p className="text-center text-xs text-red-600">
                  Agrega al menos un jugador adicional
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
