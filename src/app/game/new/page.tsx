'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { GameFormData, GuestInput } from '@/app/game/new/types'
import GuestNewGameForm from '@/components/new-game/GuestNewGameForm'
import HoleCountSelect from '@/components/new-game/HoleCountSelect'
import { useAuth } from '@/contexts/AuthContext'
import { createGame, generateGuestId } from '@/lib/db'
import { saveLocalGame } from '@/lib/localStorage'
import { Game, Player } from '@/types'
import ActiveGameBanner from '@/components/ActiveGameBanner'

const createPlayerInput = (overrides?: Partial<GuestInput>): GuestInput => ({
  id: overrides?.id ?? generateGuestId(),
  name: overrides?.name ?? ''
})

export default function NewGamePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [playerInputs, setPlayerInputs] = useState<GuestInput[]>([
    createPlayerInput()
  ])

  const form = useForm<GameFormData>({
    defaultValues: {
      holeCount: 9
    }
  })
  useEffect(() => {
    setPlayerInputs((prev) => {
      if (user) {
        const [, ...rest] = prev
        return [
          createPlayerInput({ id: user.id, name: user.name ?? '' }),
          ...rest
        ]
      }
      return prev.length > 0 ? prev : [createPlayerInput()]
    })
  }, [user])

  const updatePlayerInput = (id: string, value: string) => {
    setPlayerInputs((prev) =>
      prev.map((input) => (input.id === id ? { ...input, name: value } : input))
    )
  }

  const addPlayerInputField = () => {
    setPlayerInputs((prev) => [...prev, createPlayerInput()])
  }

  const removePlayerInputField = (id: string) => {
    setPlayerInputs((prev) => {
      if (prev[0]?.id === id) {
        return prev
      }
      return prev.filter((input) => input.id !== id)
    })
  }

  const normalizedPlayers = playerInputs.map((input, index) => ({
    id: index === 0 && user ? user.id : input.id,
    name: input.name.trim(),
    isGuest: !(user && index === 0)
  }))

  const filledPlayers = normalizedPlayers.filter(
    (player) => player.name.length > 0
  )

  const totalPlayersCount = filledPlayers.length
  const hasPrimaryPlayer = normalizedPlayers[0]?.name.length > 0
  const isMultiplayer = totalPlayersCount > 1
  const hasMinimumPlayers = hasPrimaryPlayer

  const onSubmit = async (data: GameFormData) => {
    setIsLoading(true)
    setError(null)
    try {
      const normalizedInputs = playerInputs.map((input, index) => ({
        id: index === 0 && user ? user.id : input.id,
        name: input.name.trim()
      }))

      const primaryPlayer = normalizedInputs[0]
      if (!primaryPlayer || primaryPlayer.name.length === 0) {
        setError('Ingresa tu nombre para comenzar')
        setIsLoading(false)
        return
      }

      const finalPlayers: Player[] = normalizedInputs
        .filter((player) => player.name.length > 0)
        .map((player, index) => {
          if (user && index === 0) {
            return {
              id: user.id,
              name: player.name,
              userId: user.id,
              isGuest: false
            }
          }
          return {
            id: player.id,
            name: player.name,
            isGuest: true
          }
        })

      if (finalPlayers.length === 0) {
        setError('Agrega al menos un jugador')
        setIsLoading(false)
        return
      }

      const gameData: Omit<Game, 'id' | 'createdAt'> = {
        createdBy: user?.id || finalPlayers[0].id,
        holeCount: data.holeCount,
        players: finalPlayers,
        scores: {} as Record<string, number[]>,
        status: 'in_progress',
        tournamentId: data.tournamentId || null,
        isMultiplayer: finalPlayers.length > 1,
        currentHole: 1
      }
      finalPlayers.forEach((p) => {
        gameData.scores[p.id] = Array(data.holeCount).fill(0)
      })

      const gameId = user ? await createGame(gameData) : saveLocalGame(gameData)

      router.push(`/game/${gameId}`)
    } catch (e) {
      console.error('Error creating game:', e)
      setError(e instanceof Error ? e.message : 'Error al crear')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <ActiveGameBanner />
      <GuestNewGameForm
        isLoading={isLoading}
        hasMinimumPlayers={hasMinimumPlayers}
        onSubmit={form.handleSubmit(onSubmit)}
        error={error}
        onDismissError={() => setError(null)}
        onCancel={() => router.back()}
        renderPlayersSection={() => (
          <div className="space-y-4 border border-gray-200 rounded-lg p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">Jugadores</p>
              <p className="text-xs text-gray-500">
                {user
                  ? 'Tu usuario se agrega automáticamente, suma invitados cuando quieras.'
                  : 'Ingresa tu nombre para comenzar y agrega invitados opcionales.'}
              </p>
              <p className="text-xs text-gray-500">
                Jugadores agregados: {totalPlayersCount} ·{' '}
                {isMultiplayer ? 'Modo multijugador' : 'Modo individual'}
              </p>
            </div>
            <div className="space-y-3">
              {playerInputs.map((input, index) => (
                <div key={input.id} className="flex space-x-2">
                  <input
                    type="text"
                    value={input.name}
                    onChange={(event) =>
                      updatePlayerInput(input.id, event.target.value)
                    }
                    placeholder={
                      index === 0
                        ? user
                          ? 'Tu nombre'
                          : 'Ingresa tu nombre'
                        : `Nombre del jugador ${index + 1}`
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removePlayerInputField(input.id)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              ))}
            </div>
            {!hasPrimaryPlayer && (
              <p className="text-xs text-red-600">
                Ingresa el nombre del jugador principal para continuar.
              </p>
            )}
            <button
              type="button"
              onClick={addPlayerInputField}
              className="w-full px-3 py-2 border border-dashed border-green-400 text-green-700 rounded-md hover:bg-green-50 text-sm"
            >
              + Agregar invitado
            </button>
          </div>
        )}
        renderHoleCountSelect={() => (
          <HoleCountSelect
            register={form.register}
            disabled
            options={[
              { value: 9, label: '9 hoyos (próximamente más opciones)' }
            ]}
          />
        )}
      />
    </>
  )
}
