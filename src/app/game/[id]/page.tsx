'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { subscribeToGame, finishGame } from '@/lib/db'
import { getLocalGame, updateLocalGame, isLocalGame } from '@/lib/localStorage'
import { Game, Player } from '@/types'
import Navbar from '@/components/Navbar'
import Scorecard from '@/components/Scorecard'
import { ArrowLeft, Flag, Share2, Trophy } from 'lucide-react'

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

  const handleFinishGame = async () => {
    if (!game) return

    setIsFinishing(true)
    try {
      if (isLocalGameState) {
        // Local game: update locally
        updateLocalGame(game.id, { status: 'finished' })
        setGame((prev) => (prev ? { ...prev, status: 'finished' } : null))
      } else {
        // Server game: update on server
        await finishGame(game.id)
        // The real-time listener will update the game state
      }
    } catch {
      console.error('Error finishing game:')
    } finally {
      setIsFinishing(false)
    }
  }

  const handleShareGame = async () => {
    if (!game) return

    const gameUrl = `${window.location.origin}/game/${game.id}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Partida de Minigolf',
          text: `¡Únete a mi partida de minigolf!`,
          url: gameUrl
        })
      } catch {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(gameUrl)
        alert('¡Link copiado al portapapeles!')
      } catch (error) {
        console.error('Error copying to clipboard:', error)
      }
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
              onClick={() => router.back()}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 active:scale-95 transition-all touch-manipulation"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="text-sm">Volver</span>
            </button>

            <div className="flex items-center space-x-2">
              {game.isMultiplayer && (
                <button
                  onClick={handleShareGame}
                  className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm touch-manipulation"
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  Compartir
                </button>
              )}

              {canFinish && (
                <button
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
