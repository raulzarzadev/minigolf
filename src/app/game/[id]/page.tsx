'use client'

import { ArrowLeft, Flag, Trophy } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Scorecard from '@/components/Scorecard'
import { useAuth } from '@/contexts/AuthContext'
import { finishGame, subscribeToGame } from '@/lib/db'
import { getLocalGame, isLocalGame, updateLocalGame } from '@/lib/localStorage'
import { Game, Player } from '@/types'

export default function GamePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [game, setGame] = useState<Game | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFinishing, setIsFinishing] = useState(false)
  const [isLocalGameState, setIsLocalGameState] = useState(false)

  const gameId = params.id as string

  useEffect(() => {
    if (!gameId) return

    // Check if it's a local game
    if (isLocalGame(gameId)) {
      setIsLocalGameState(true)
      const localGame = getLocalGame(gameId)
      if (localGame) {
        // Convert LocalGame to Game format
        const gameData: Game = {
          ...localGame,
          id: localGame.id,
          createdAt: new Date(localGame.createdAt)
        }
        setGame(gameData)

        // For local games, find the current player differently
        if (gameData.players.length > 0) {
          setCurrentPlayer(gameData.players[0])
        }
      }
      setLoading(false)
      return
    }

    // Server game - use real-time subscription
    setIsLocalGameState(false)
    const unsubscribe = subscribeToGame(gameId, (gameData) => {
      setGame(gameData)
      setLoading(false)

      if (gameData && user) {
        // Find current player
        const player = gameData.players.find(
          (p) => p.userId === user.id || p.id === user.id
        )
        setCurrentPlayer(player || null)
      }
    })

    return () => unsubscribe()
  }, [gameId, user])

  const navigateToCelebration = () => {
    if (!game) return
    router.push(`/game/${game.id}/celebration`)
  }

  const handleFinishGame = async () => {
    if (!game) return

    setIsFinishing(true)
    try {
      if (isLocalGameState) {
        updateLocalGame(game.id, { status: 'finished' })
        setGame((prev) => (prev ? { ...prev, status: 'finished' } : null))
        navigateToCelebration()
      } else {
        await finishGame(game.id)
        navigateToCelebration()
      }
    } catch (error) {
      console.error('Error finishing game:', error)
    } finally {
      setIsFinishing(false)
    }
  }

  const canEdit = () => {
    if (!game) return false

    // For local games, always allow editing if game is in progress
    if (isLocalGameState) {
      return game.status === 'in_progress'
    }

    // For server games, require authentication
    if (!user || !currentPlayer) return false
    return (
      game.status === 'in_progress' &&
      (game.createdBy === user.id || currentPlayer.userId === user.id)
    )
  }

  const isGameCreator = () => {
    if (!game) return false

    // For local games, always consider the user as the creator
    if (isLocalGameState) {
      return true
    }

    // For server games, check actual creator
    return user && game.createdBy === user.id
  }

  const allPlayersFinished = () => {
    if (!game) return false

    return game.players.every((player) => {
      const scores = game.scores[player.id] || []
      return scores.filter((score) => score > 0).length === game.holeCount
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
        </div>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto py-16 px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Partida no encontrada
          </h1>
          <p className="text-gray-600 mb-8">
            La partida que buscas no existe o no tienes permisos para verla.
          </p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  const canFinish = isGameCreator() && game.status === 'in_progress'
  const shouldShowFinishSuggestion = canFinish && allPlayersFinished()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 active:scale-95 transition-all touch-manipulation"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="text-sm">Volver</span>
            </button>

            <div className="flex items-center space-x-2">
              {canFinish && (
                <button
                  type="button"
                  onClick={handleFinishGame}
                  disabled={isFinishing}
                  className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm touch-manipulation"
                >
                  <Flag className="h-4 w-4 mr-1" />
                  {isFinishing ? 'Finalizando...' : 'Finalizar'}
                </button>
              )}
            </div>
          </div>

          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Partida de Minigolf
            </h1>
            <p className="text-xs text-gray-600">
              {new Date(game.createdAt).toLocaleDateString('es-ES', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        {/* Game Status Messages */}
        {game.status === 'finished' && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center">
              <Trophy className="h-4 w-4 text-green-600 mr-2" />
              <div>
                <h3 className="font-medium text-green-800 text-sm">
                  ¡Partida finalizada!
                </h3>
                <p className="text-green-600 text-xs">
                  Terminó el{' '}
                  {new Date(
                    game.finishedAt || game.createdAt
                  ).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>
          </div>
        )}

        {shouldShowFinishSuggestion && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex flex-col space-y-2">
              <div>
                <h3 className="font-medium text-blue-800 text-sm">
                  ¡Todos han completado la partida!
                </h3>
                <p className="text-blue-600 text-xs">
                  Puedes finalizar para ver las estadísticas finales.
                </p>
              </div>
              <button
                type="button"
                onClick={handleFinishGame}
                disabled={isFinishing}
                className="self-start px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm touch-manipulation"
              >
                Finalizar ahora
              </button>
            </div>
          </div>
        )}

        {/* Scorecard */}
        <Scorecard
          game={game}
          currentPlayer={currentPlayer || undefined}
          canEdit={canEdit()}
          onScoreUpdate={() => {
            // The real-time listener will handle updates for server games
            // Local games are handled by onGameUpdate
          }}
          onGameUpdate={(updatedGame) => {
            // For local games, update the state directly
            if (isLocalGameState) {
              setGame(updatedGame)
            }
          }}
        />

        {canFinish && (
          <div className="mt-6">
            <div className="rounded-2xl border border-green-200 bg-linear-to-r from-green-600 via-emerald-500 to-green-500 p-4 text-white shadow-lg">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/70">
                    Preparar cierre
                  </p>
                  <h3 className="text-lg font-semibold">¿Lista la partida?</h3>
                  <p className="text-sm text-white/80">
                    {allPlayersFinished()
                      ? 'Todos los jugadores tienen sus golpes guardados. Puedes finalizar cuando gustes.'
                      : 'Puedes finalizar en cualquier momento; los cambios se guardan automáticamente.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleFinishGame}
                  disabled={isFinishing}
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-green-700 transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Flag className="mr-2 h-4 w-4 text-green-600" />
                  {isFinishing ? 'Finalizando...' : 'Finalizar partida'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save/Publish Options for Local Games */}
        {isLocalGameState && !user && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 mb-2 text-sm">
              {game.status === 'finished'
                ? '🎉 ¡Partida terminada!'
                : '📝 Opciones para tu partida'}
            </h3>
            <p className="text-yellow-700 text-xs mb-3">
              {game.status === 'finished'
                ? 'Tu partida se guardó localmente. ¡Comparte tu puntuación o guárdala en la nube!'
                : 'Tu partida se guarda automáticamente en este dispositivo. Para más opciones:'}
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    '/login?redirect=' +
                      encodeURIComponent(window.location.pathname)
                  )
                }
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm touch-manipulation"
              >
                🔐 Iniciar sesión para guardar en tu cuenta
              </button>
              {game.status === 'finished' && (
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      '/login?redirect=' +
                        encodeURIComponent(window.location.pathname)
                    )
                  }
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm touch-manipulation"
                >
                  🏆 Publicar en el ranking global
                </button>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-yellow-200">
              <p className="text-yellow-600 text-xs">
                💡 <strong>Beneficios de crear una cuenta:</strong>
              </p>
              <ul className="text-yellow-600 text-xs mt-1 space-y-1">
                <li>• Sincroniza tus partidas en todos tus dispositivos</li>
                <li>• Aparece en el ranking global</li>
                <li>• Guarda tu historial de partidas</li>
                <li>• Comparte partidas con otros usuarios</li>
              </ul>
            </div>
          </div>
        )}

        {/* Help Text */}
        {canEdit() && game.status === 'in_progress' && (
          <div className="mt-4 bg-blue-50 rounded-lg p-3">
            <h4 className="font-medium text-blue-800 mb-2 text-sm">
              💡 Consejos:
            </h4>
            <ul className="text-blue-700 text-xs space-y-1">
              <li>• Usa los botones + y - para registrar los golpes</li>
              {isGameCreator() && (
                <li>• Como creador, puedes editar las puntuaciones de todos</li>
              )}
              <li>• Las puntuaciones se guardan automáticamente</li>
              <li>
                • Los demás jugadores ven las actualizaciones en tiempo real
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
