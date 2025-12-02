'use client'

import { FC, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Logo from './Logo'

const AuthForm: FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(false)

  const { signInWithGoogle, loading: authLoading, user } = useAuth()

  // Si el usuario está presente, significa que ya se autenticó
  useEffect(() => {
    if (user) {
      setIsSigningIn(false)
      setIsLoading(false)
    }
  }, [user])

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setIsSigningIn(true)
    setError(null)

    try {
      await signInWithGoogle()
      // El usuario debería ser redirigido automáticamente por el AuthContext
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error al iniciar sesión con Google'
      setError(errorMessage)
      setIsSigningIn(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Mostrar spinner si está cargando la autenticación o el proceso de login
  if (authLoading || isSigningIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isSigningIn ? 'Iniciando sesión...' : 'Cargando...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Logo size="xl" variant="dark" showText={false} />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-black">
            Baja Mini Golf
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Administra partidas de minigolf y torneos digitales en La Paz, Baja
            California Sur.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl border-2 border-green-500 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-2 border-red-500 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border-2 border-green-500 rounded-md shadow-sm bg-white text-sm font-medium text-black hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500 mr-2"></div>
                  Iniciando sesión...
                </div>
              ) : (
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continuar con Google
                </div>
              )}
            </button>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Seguro y rápido
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Al continuar, aceptas nuestros términos de servicio y política
                de privacidad.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            ¿Necesitas ayuda? Contáctanos en raulzarza.dev@gmail.com
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthForm
