'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { Trophy, Calendar, Users, Plus } from 'lucide-react'
import Navbar from '@/components/Navbar'

export default function TournamentsPage() {
  const { user, loading } = useAuth()

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Torneos</h1>
          <p className="mt-2 text-gray-600">
            Participa en competencias y demuestra tus habilidades
          </p>
        </div>

        {/* Coming Soon Banner */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-8 mb-8">
          <div className="text-center">
            <Trophy className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Próximamente!
            </h2>
            <p className="text-gray-600 mb-6">
              Los torneos estarán disponibles muy pronto. Mientras tanto, ¡sigue
              practicando con partidas individuales y multijugador!
            </p>
            <Link
              href="/game/new"
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Crear Partida de Práctica
            </Link>
          </div>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 rounded-lg p-3">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900">
                Torneos por Temporadas
              </h3>
            </div>
            <p className="text-gray-600">
              Competencias organizadas por temporadas con rankings y premios
              especiales.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="bg-green-100 rounded-lg p-3">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900">
                Competencias Grupales
              </h3>
            </div>
            <p className="text-gray-600">
              Participa en torneos con múltiples jugadores y sube en el ranking
              global.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 rounded-lg p-3">
                <Trophy className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900">
                Premios y Reconocimientos
              </h3>
            </div>
            <p className="text-gray-600">
              Gana badges, trofeos y reconocimientos por tus logros en los
              torneos.
            </p>
          </div>
        </div>

        {/* Placeholder Tournaments */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Próximos Torneos
          </h2>
          <div className="space-y-4">
            {/* Placeholder Tournament 1 */}
            <div className="border border-gray-200 rounded-lg p-4 opacity-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Torneo de Primavera 2025
                    </h3>
                    <p className="text-sm text-gray-500">
                      18 hoyos • Disponible próximamente
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Inicio:</div>
                  <div className="font-medium">Por anunciar</div>
                </div>
              </div>
            </div>

            {/* Placeholder Tournament 2 */}
            <div className="border border-gray-200 rounded-lg p-4 opacity-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Copa Relámpago
                    </h3>
                    <p className="text-sm text-gray-500">
                      9 hoyos • Torneo rápido
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Inicio:</div>
                  <div className="font-medium">Por anunciar</div>
                </div>
              </div>
            </div>

            {/* Placeholder Tournament 3 */}
            <div className="border border-gray-200 rounded-lg p-4 opacity-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Campeonato Master
                    </h3>
                    <p className="text-sm text-gray-500">
                      36 hoyos • Solo para expertos
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Inicio:</div>
                  <div className="font-medium">Por anunciar</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">
              Los torneos estarán disponibles en futuras actualizaciones
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            Mientras esperamos los torneos, ¡perfecciona tu técnica!
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/game/new"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Partida
            </Link>
            <Link
              href="/profile"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Ver Estadísticas
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
