'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { Trophy, Calendar, Users, Plus, Clock } from 'lucide-react'
import Navbar from '@/components/Navbar'

export default function TournamentsPage() {
  const { user, loading } = useAuth()

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">Torneos</h1>
          <p className="mt-1 text-sm text-gray-600">
            Participa en competencias y demuestra tus habilidades
          </p>
        </div>

        {/* Coming Soon Banner */}
        <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-4 mb-4">
          <div className="text-center">
            <Trophy className="h-12 w-12 text-black mx-auto mb-3" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              ¡Próximamente!
            </h2>
            <p className="text-gray-600 mb-4 text-sm">
              Los torneos estarán disponibles muy pronto. Mientras tanto, ¡sigue
              practicando!
            </p>
            <Link
              href="/game/new"
              className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm touch-manipulation"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Partida de Práctica
            </Link>
          </div>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 gap-3 mb-4">
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex items-center mb-2">
              <div className="bg-gray-100 rounded-lg p-2">
                <Calendar className="h-4 w-4 text-black" />
              </div>
              <h3 className="ml-3 text-sm font-semibold text-gray-900">
                Torneos por Temporadas
              </h3>
            </div>
            <p className="text-gray-600 text-xs">
              Competencias organizadas por temporadas con rankings y premios
              especiales.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex items-center mb-2">
              <div className="bg-black rounded-lg p-2">
                <Users className="h-4 w-4 text-white" />
              </div>
              <h3 className="ml-3 text-sm font-semibold text-gray-900">
                Competencias Grupales
              </h3>
            </div>
            <p className="text-gray-600 text-xs">
              Participa en torneos con múltiples jugadores y sube en el ranking
              global.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex items-center mb-2">
              <div className="bg-purple-100 rounded-lg p-2">
                <Trophy className="h-4 w-4 text-purple-600" />
              </div>
              <h3 className="ml-3 text-sm font-semibold text-gray-900">
                Premios y Reconocimientos
              </h3>
            </div>
            <p className="text-gray-600 text-xs">
              Gana badges, trofeos y reconocimientos por tus logros en los
              torneos.
            </p>
          </div>
        </div>

        {/* Placeholder Tournaments */}
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Próximos Torneos
          </h2>
          <div className="space-y-3">
            {/* Placeholder Tournament 1 */}
            <div className="border border-gray-200 rounded-lg p-3 opacity-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="h-8 w-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Trophy className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      Torneo de Primavera 2025
                    </h3>
                    <p className="text-xs text-gray-500">
                      18 hoyos • Disponible próximamente
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="text-gray-500">Inicio:</div>
                  <div className="font-medium">Por anunciar</div>
                </div>
              </div>
            </div>

            {/* Placeholder Tournament 2 */}
            <div className="border border-gray-200 rounded-lg p-3 opacity-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="h-8 w-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Trophy className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      Copa Relámpago
                    </h3>
                    <p className="text-xs text-gray-500">
                      9 hoyos • Torneo rápido
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="text-gray-500">Inicio:</div>
                  <div className="font-medium">Por anunciar</div>
                </div>
              </div>
            </div>

            {/* Placeholder Tournament 3 */}
            <div className="border border-gray-200 rounded-lg p-3 opacity-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="h-8 w-8 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Trophy className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      Campeonato Master
                    </h3>
                    <p className="text-xs text-gray-500">
                      36 hoyos • Solo para expertos
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="text-gray-500">Inicio:</div>
                  <div className="font-medium">Por anunciar</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <Clock className="h-6 w-6 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 text-xs">
              Los torneos estarán disponibles en futuras actualizaciones
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-4 text-center">
          <p className="text-gray-600 mb-3 text-sm">
            Mientras esperamos los torneos, ¡perfecciona tu técnica!
          </p>
          <div className="flex flex-col space-y-2">
            <Link
              href="/game/new"
              className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm touch-manipulation"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Partida
            </Link>
            <Link
              href="/profile"
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm touch-manipulation"
            >
              Ver Estadísticas
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
