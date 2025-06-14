'use client'
import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AuthForm from '@/components/AuthForm'
import FirebaseSetupGuide from '@/components/FirebaseSetupGuide'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { Plus, Trophy, BarChart3, Clock, Users, User } from 'lucide-react'
import { Game } from '@/types'
import { getUserGames } from '@/lib/db'

export default function Home() {
  const { user, loading, firebaseError } = useAuth()
  const [recentGames, setRecentGames] = useState<Game[]>([])
  const [loadingGames, setLoadingGames] = useState(false)

  useEffect(() => {
    const loadRecentGames = async () => {
      if (!user) return

      try {
        setLoadingGames(true)
        const userGames = await getUserGames(user.id)
        // Tomar solo las 3 partidas más recientes
        setRecentGames(userGames.slice(0, 3))
      } catch (err) {
        console.error('Error loading recent games:', err)
      } finally {
        setLoadingGames(false)
      }
    }

    if (user) {
      loadRecentGames()
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    )
  }

  // Show Firebase setup guide if there's a configuration error
  if (firebaseError) {
    return <FirebaseSetupGuide />
  }

  if (!user) {
    return <AuthForm />
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {' '}
      <Navbar />{' '}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {' '}
        {/* Welcome Header */}{' '}
        <div className="mb-8">
          {' '}
          <h1 className="text-3xl font-bold text-gray-900">
            {' '}
            ¡Hola, {user.name}! 🏌️‍♂️{' '}
          </h1>{' '}
          <p className="mt-2 text-gray-600">
            {' '}
            Bienvenido a tu plataforma de minigolf. ¿Listo para una nueva
            partida?{' '}
          </p>{' '}
        </div>{' '}
        {/* Quick Actions */}{' '}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {' '}
          <Link href="/game/new" className="group">
            {' '}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group-hover:border-green-300">
              {' '}
              <div className="flex items-center">
                {' '}
                <div className="bg-green-100 rounded-lg p-3">
                  {' '}
                  <Plus className="h-6 w-6 text-green-600" />{' '}
                </div>{' '}
                <div className="ml-4">
                  {' '}
                  <h3 className="text-lg font-medium text-gray-900">
                    Nueva Partida
                  </h3>{' '}
                  <p className="text-sm text-gray-500">
                    Individual o multijugador
                  </p>{' '}
                </div>{' '}
              </div>{' '}
            </div>{' '}
          </Link>{' '}
          <Link href="/tournaments" className="group">
            {' '}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group-hover:border-yellow-300">
              {' '}
              <div className="flex items-center">
                {' '}
                <div className="bg-yellow-100 rounded-lg p-3">
                  {' '}
                  <Trophy className="h-6 w-6 text-yellow-600" />{' '}
                </div>{' '}
                <div className="ml-4">
                  {' '}
                  <h3 className="text-lg font-medium text-gray-900">
                    Torneos
                  </h3>{' '}
                  <p className="text-sm text-gray-500">Competencias activas</p>{' '}
                </div>{' '}
              </div>{' '}
            </div>{' '}
          </Link>{' '}
          <Link href="/profile" className="group">
            {' '}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group-hover:border-blue-300">
              {' '}
              <div className="flex items-center">
                {' '}
                <div className="bg-blue-100 rounded-lg p-3">
                  {' '}
                  <BarChart3 className="h-6 w-6 text-blue-600" />{' '}
                </div>{' '}
                <div className="ml-4">
                  {' '}
                  <h3 className="text-lg font-medium text-gray-900">
                    Estadísticas
                  </h3>{' '}
                  <p className="text-sm text-gray-500">Tu rendimiento</p>{' '}
                </div>{' '}
              </div>{' '}
            </div>{' '}
          </Link>{' '}
          <Link href="/games" className="group">
            {' '}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group-hover:border-purple-300">
              {' '}
              <div className="flex items-center">
                {' '}
                <div className="bg-purple-100 rounded-lg p-3">
                  {' '}
                  <Clock className="h-6 w-6 text-purple-600" />{' '}
                </div>{' '}
                <div className="ml-4">
                  {' '}
                  <h3 className="text-lg font-medium text-gray-900">
                    Mis Partidas
                  </h3>{' '}
                  <p className="text-sm text-gray-500">Historial de juegos</p>{' '}
                </div>{' '}
              </div>{' '}
            </div>{' '}
          </Link>{' '}
        </div>{' '}
        {/* User Stats Summary */}{' '}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {' '}
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Resumen de tu actividad
          </h2>{' '}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {' '}
            <div className="text-center">
              {' '}
              <div className="text-3xl font-bold text-green-600">
                {user.gamesPlayed}
              </div>{' '}
              <div className="text-sm text-gray-500">Partidas jugadas</div>{' '}
            </div>{' '}
            <div className="text-center">
              {' '}
              <div className="text-3xl font-bold text-blue-600">
                {' '}
                {user.averageScore > 0
                  ? user.averageScore.toFixed(1)
                  : '--'}{' '}
              </div>{' '}
              <div className="text-sm text-gray-500">Promedio de golpes</div>{' '}
            </div>{' '}
            <div className="text-center">
              {' '}
              <div className="text-3xl font-bold text-purple-600">--</div>{' '}
              <div className="text-sm text-gray-500">Ranking global</div>{' '}
            </div>{' '}
          </div>{' '}
        </div>{' '}
        {/* Recent Games */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Partidas recientes
            </h2>
            <Link
              href="/games"
              className="text-green-600 hover:text-green-700 text-sm font-medium"
            >
              Ver todas →
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {loadingGames ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
              </div>
            ) : recentGames.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay partidas recientes</p>
                <p className="text-sm">
                  ¡Crea tu primera partida para empezar!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentGames.map((game) => (
                  <div
                    key={game.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {game.isMultiplayer ? (
                          <Users className="h-5 w-5 text-blue-500" />
                        ) : (
                          <User className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {game.isMultiplayer
                            ? `Partida Multijugador`
                            : 'Partida Individual'}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {game.createdAt.toLocaleDateString()} •{' '}
                          {game.holeCount} hoyos
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          game.status === 'finished'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {game.status === 'finished'
                          ? 'Finalizada'
                          : 'En progreso'}
                      </span>
                      <Link
                        href={`/game/${game.id}`}
                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                      >
                        {game.status === 'finished' ? 'Ver' : 'Continuar'}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>{' '}
      </div>{' '}
    </div>
  )
}
