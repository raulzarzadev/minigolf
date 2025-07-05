'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/Navbar'
import { Trophy, Medal, Award, Star, Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getAllUsersRanking } from '@/lib/db'

interface RankingUser {
  id: string
  name: string
  username: string
  gamesPlayed: number
  averageScore: number
  totalStrokes: number
  holesInOne: number
  winRate: number
  position: number
}

export default function RankingPage() {
  const { user, loading } = useAuth()
  const [ranking, setRanking] = useState<RankingUser[]>([])
  const [loadingRanking, setLoadingRanking] = useState(true)
  const [sortBy, setSortBy] = useState<
    'averageScore' | 'gamesPlayed' | 'winRate'
  >('averageScore')

  useEffect(() => {
    const loadRanking = async () => {
      try {
        setLoadingRanking(true)
        const rankingData = await getAllUsersRanking()
        setRanking(rankingData)
      } catch (error) {
        console.error('Error loading ranking:', error)
      } finally {
        setLoadingRanking(false)
      }
    }

    loadRanking()
  }, [sortBy])

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

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />
      default:
        return <Star className="h-6 w-6 text-gray-300" />
    }
  }

  const getRankBadgeColor = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-yellow-100 text-yellow-800 ring-yellow-600/20'
      case 2:
        return 'bg-gray-100 text-gray-800 ring-gray-600/20'
      case 3:
        return 'bg-amber-100 text-amber-800 ring-amber-600/20'
      default:
        return 'bg-gray-50 text-gray-600 ring-gray-500/10'
    }
  }

  const sortedRanking = [...ranking].sort((a, b) => {
    switch (sortBy) {
      case 'averageScore':
        return a.averageScore - b.averageScore // Menor es mejor
      case 'gamesPlayed':
        return b.gamesPlayed - a.gamesPlayed // Mayor es mejor
      case 'winRate':
        return b.winRate - a.winRate // Mayor es mejor
      default:
        return a.averageScore - b.averageScore
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Link
              href="/"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div className="flex items-center space-x-2">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <h1 className="text-2xl font-bold text-gray-900">
                Ranking de Jugadores
              </h1>
            </div>
          </div>
          <p className="text-gray-600">
            Descubre quiénes son los mejores jugadores de mini golf
          </p>
        </div>

        {/* Sort Options */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Ordenar por:
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSortBy('averageScore')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'averageScore'
                  ? 'bg-green-100 text-green-800 ring-1 ring-green-600/20'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Promedio de golpes
            </button>
            <button
              onClick={() => setSortBy('gamesPlayed')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'gamesPlayed'
                  ? 'bg-green-100 text-green-800 ring-1 ring-green-600/20'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Partidas jugadas
            </button>
            <button
              onClick={() => setSortBy('winRate')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'winRate'
                  ? 'bg-green-100 text-green-800 ring-1 ring-green-600/20'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tasa de victoria
            </button>
          </div>
        </div>

        {/* Ranking List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Users className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                Jugadores Registrados ({ranking.length})
              </h2>
            </div>

            {loadingRanking ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
                <p className="text-gray-500">Cargando ranking...</p>
              </div>
            ) : ranking.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">
                  No hay jugadores registrados aún
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedRanking.map((player, index) => {
                  const actualPosition = index + 1
                  const isCurrentUser = user ? player.id === user.id : false

                  return (
                    <div
                      key={player.id}
                      className={`p-4 rounded-lg border transition-all ${
                        isCurrentUser
                          ? 'bg-green-50 border-green-200 ring-1 ring-green-600/20'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {/* Position and Icon */}
                          <div className="flex items-center space-x-2">
                            {getRankIcon(actualPosition)}
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${getRankBadgeColor(
                                actualPosition
                              )}`}
                            >
                              #{actualPosition}
                            </span>
                          </div>

                          {/* Player Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-sm font-medium text-gray-900 truncate whitespace-pre-line">
                                {player.name}
                              </h3>
                              {isCurrentUser && (
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                  Tú
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              @{player.username}
                            </p>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {player.averageScore.toFixed(1)} golpes/hoyo
                          </div>
                          <div className="text-xs text-gray-500">
                            Tasa de victoria{' '}
                            <strong>
                              {(player.winRate * 100).toFixed(0)}%
                            </strong>
                          </div>
                          <div className="text-xs">
                            {' '}
                            {player.gamesPlayed} partidas
                          </div>
                          {player.holesInOne > 0 && (
                            <div className="text-xs text-green-600 font-medium">
                              🏌️‍♂️ {player.holesInOne} hoyo
                              {player.holesInOne !== 1 ? 's' : ''} en uno
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 rounded-lg border border-blue-200 p-4">
          <div className="flex items-start space-x-3">
            <Trophy className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900">
                ¿Cómo funciona el ranking?
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    El ranking por defecto se basa en el promedio de golpes por
                    hoyo (menor es mejor)
                  </li>
                  <li>
                    También puedes ordenar por partidas jugadas o tasa de
                    victoria
                  </li>
                  <li>Los hoyos en uno aparecen destacados en verde</li>
                  <li>Tu posición actual aparece resaltada</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
