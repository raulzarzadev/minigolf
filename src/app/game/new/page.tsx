'use client'

// biome-ignore assist/source/organizeImports: false
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import Navbar from '@/components/Navbar'
import ErrorBanner from '@/components/new-game/ErrorBanner'
import GameTypeSelector from '@/components/new-game/GameTypeSelector'
import GuestNewGameForm from '@/components/new-game/GuestNewGameForm'
import HoleCountSelect from '@/components/new-game/HoleCountSelect'
import PlayersSection from '@/components/new-game/PlayersSection'
import { GameFormData, GuestInput, SearchUser } from '@/app/game/new/types'
import { useAuth } from '@/contexts/AuthContext'
import { createGame, generateGuestId, searchUsers } from '@/lib/db'
import { saveLocalGame } from '@/lib/localStorage'
import { Game, Player } from '@/types'
import { useForm } from 'react-hook-form'

const createGuestInputField = (): GuestInput => ({
  id: generateGuestId(),
  name: ''
})

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

  useEffect(() => {
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

  useEffect(() => {
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

  const handleModeSelect = (value: 'true' | 'false') => {
    form.setValue('isMultiplayer', value, { shouldDirty: true })
  }

  const hiddenIsMultiplayerField = () => (
    <input type="hidden" {...form.register('isMultiplayer')} />
  )

  if (!user) {
    return (
      <GuestNewGameForm
        guestPlayerName={guestPlayerName}
        onGuestNameChange={setGuestPlayerName}
        isLoading={isLoading}
        hasMinimumPlayers={hasMinimumPlayers}
        onSubmit={form.handleSubmit(onSubmit)}
        error={error}
        onDismissError={() => setError(null)}
        onCancel={() => router.back()}
        renderGameTypeSelector={() => (
          <GameTypeSelector
            isMultiplayer={isMultiplayer}
            hasMinimumPlayers={hasMinimumPlayers}
            onSelectMode={handleModeSelect}
          />
        )}
        renderHoleCountSelect={() => (
          <HoleCountSelect
            register={form.register}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            options={[
              { value: 9, label: '9 hoyos' },
              { value: 18, label: '18 hoyos' }
            ]}
          />
        )}
        renderHiddenFields={hiddenIsMultiplayerField}
      />
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

          <ErrorBanner message={error} onDismiss={() => setError(null)} />

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {hiddenIsMultiplayerField()}

            <HoleCountSelect register={form.register} disabled />

            {isMultiplayer && (
              <PlayersSection
                players={players}
                guestInputs={guestInputs}
                totalPlayersCount={totalPlayersCount}
                searchTerm={searchTerm}
                searchResults={searchResults}
                isSearching={isSearching}
                onRemovePlayer={removePlayer}
                onGuestInputChange={updateGuestInput}
                onAddGuestInput={addGuestInputField}
                onRemoveGuestInput={removeGuestInputField}
                onSearchTermChange={setSearchTerm}
                onSearchUserSelect={addUserPlayer}
                onSearchUsers={handleSearchUsers}
              />
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
