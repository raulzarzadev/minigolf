'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface AdminProtectedRouteProps {
  children: ReactNode
}

export default function AdminProtectedRoute({
  children
}: AdminProtectedRouteProps) {
  const { user, loading, isAdmin } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Acceso Denegado
          </h1>
          <p className="text-gray-600 mb-6">
            Debes estar autenticado para acceder a esta página.
          </p>
          <button
            type="button"
            // biome-ignore lint/suspicious/noAssignInExpressions: FIXME: revisar
            onClick={() => (window.location.href = '/')}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 1112 0v1H3v-1z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Sin Permisos de Administrador
          </h1>
          <p className="text-gray-600 mb-6">
            No tienes permisos de administrador para acceder a esta página.
          </p>
          <button
            type="button"
            // biome-ignore lint/suspicious/noAssignInExpressions: FIXME: revisar
            onClick={() => (window.location.href = '/')}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
