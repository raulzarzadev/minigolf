'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import AuthForm from '@/components/AuthForm'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import {
  getLocalGamesCount,
  migrateLocalGamesToServer
} from '@/lib/localStorage'

function LoginContent() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isMigrating, setIsMigrating] = useState(false)
  const [localGamesCount, setLocalGamesCount] = useState(0)

  const redirectPath = searchParams.get('redirect') || '/'

  // Contar partidas locales
  useEffect(() => {
    setLocalGamesCount(getLocalGamesCount())
  }, [])

  // Manejar migración de partidas después del login
  useEffect(() => {
    if (user && localGamesCount > 0 && !isMigrating) {
      setIsMigrating(true)
      migrateLocalGamesToServer(user.id)
        .then((migratedIds) => {
          console.log(`Migrated ${migratedIds.length} local games to server`)
          // Actualizar el contador de partidas locales
          setLocalGamesCount(0)
          // Redirigir después de la migración
          router.push(redirectPath)
        })
        .catch((error) => {
          console.error('Error migrating local games:', error)
          // Redirigir incluso si hay error
          router.push(redirectPath)
        })
        .finally(() => {
          setIsMigrating(false)
        })
    } else if (user && localGamesCount === 0) {
      // No hay partidas locales, redirigir inmediatamente
      router.push(redirectPath)
    }
    // Remover user y localGamesCount de las dependencias para evitar bucle infinito
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isMigrating, router, redirectPath, localGamesCount])

  if (user) {
    if (isMigrating) {
      return (
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Migrando tus partidas...
              </h3>
              <p className="text-sm text-gray-600">
                Guardando {localGamesCount} partida
                {localGamesCount > 1 ? 's' : ''} en tu cuenta
              </p>
            </div>
          </div>
        </div>
      )
    }
    return null // No mostrar nada mientras se redirige
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Inicia Sesión</h2>
            <p className="mt-2 text-sm text-gray-600">
              Accede a tu cuenta para guardar tus partidas y estadísticas
            </p>
            {localGamesCount > 0 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  🎮 Tienes {localGamesCount} partida
                  {localGamesCount > 1 ? 's' : ''} guardada
                  {localGamesCount > 1 ? 's' : ''} localmente
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Se guardarán automáticamente en tu cuenta al iniciar sesión
                </p>
              </div>
            )}
          </div>
          <AuthForm />
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
