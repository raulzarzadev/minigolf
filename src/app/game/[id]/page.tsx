'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { subscribeToGame, finishGame } from '@/lib/db'
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

  const gameId = params.id as string

  useEffect(() => {
    if (!gameId) return

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
      await finishGame(game.id)
      // The real-time listener will update the game state
    } catch (error) {
      console.error('Error finishing game:', error)
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
      } catch (error) {
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
    if (!game || !user || !currentPlayer) return false
    return (
      game.status === 'in_progress' &&
      (game.createdBy === user.id || currentPlayer.userId === user.id)
    )
  }

  const isGameCreator = () => {
    return game && user && game.createdBy === user.id
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

      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Volver
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Partida de Minigolf
                </h1>
                <p className="text-gray-600">
                  {new Date(game.createdAt).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {game.isMultiplayer && (
                <button
                  onClick={handleShareGame}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartir
                </button>
              )}

              {canFinish && (
                <button
                  onClick={handleFinishGame}
                  disabled={isFinishing}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  {isFinishing ? 'Finalizando...' : 'Finalizar Partida'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Game Status Messages */}
        {game.status === 'finished' && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <Trophy className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <h3 className="font-medium text-green-800">
                  ¡Partida finalizada!
                </h3>
                <p className="text-green-600">
                  La partida terminó el{' '}
                  {new Date(
                    game.finishedAt || game.createdAt
                  ).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>
          </div>
        )}

        {shouldShowFinishSuggestion && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-800">
                  ¡Todos los jugadores han completado la partida!
                </h3>
                <p className="text-blue-600">
                  Puedes finalizar la partida para ver las estadísticas finales.
                </p>
              </div>
              <button
                onClick={handleFinishGame}
                disabled={isFinishing}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Finalizar ahora
              </button>
            </div>
          </div>
        )}

        {/* Scorecard */}
        <Scorecard
          game={game}
          currentPlayer={currentPlayer}
          canEdit={canEdit()}
          onScoreUpdate={() => {
            // The real-time listener will handle updates
          }}
        />

        {/* Help Text */}
        {canEdit() && game.status === 'in_progress' && (
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">💡 Consejos:</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>
                • Usa los botones + y - para registrar los golpes de cada hoyo
              </li>
              {isGameCreator() && (
                <li>
                  • Como creador, puedes editar las puntuaciones de todos los
                  jugadores
                </li>
              )}
              <li>• Las puntuaciones se guardan automáticamente</li>
              <li>
                • Los demás jugadores verán las actualizaciones en tiempo real
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
