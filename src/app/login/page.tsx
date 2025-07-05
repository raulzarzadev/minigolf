'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AuthForm from '@/components/AuthForm'
import Navbar from '@/components/Navbar'

export default function LoginPage() {
  const { user } = useAuth()
  const router = useRouter()

  // Si el usuario ya está autenticado, redirigir a la página principal
  React.useEffect(() => {
    if (user) {
      router.push('/')
    }
  }, [user, router])

  if (user) {
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
          </div>
          <AuthForm />
        </div>
      </div>
    </div>
  )
}
