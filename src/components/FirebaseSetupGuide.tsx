'use client'

import React from 'react'
import Link from 'next/link'
import { ExternalLink, CheckCircle, AlertCircle } from 'lucide-react'

const FirebaseSetupGuide: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 flex items-center justify-center bg-red-100 rounded-full mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Configuración de Firebase Requerida
            </h1>
            <p className="mt-2 text-gray-600">
              Necesitas configurar Firebase para que la autenticación funcione
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Error detectado: auth/invalid-api-key
                  </h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    Las credenciales de Firebase no están configuradas
                    correctamente.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  📋 Pasos rápidos
                </h2>

                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        1
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">
                        Ve a <strong>Firebase Console</strong> y crea un nuevo
                        proyecto
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        2
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">
                        Habilita <strong>Authentication</strong> con Google
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        3
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">
                        Crea una <strong>Firestore Database</strong> en modo
                        test
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        4
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">
                        Copia las credenciales a <strong>.env.local</strong>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  🔗 Enlaces útiles
                </h2>

                <div className="space-y-3">
                  <a
                    href="https://console.firebase.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Firebase Console</span>
                  </a>

                  <a
                    href="https://firebase.google.com/docs/web/setup"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Documentación de configuración</span>
                  </a>

                  <Link
                    href="/FIREBASE_SETUP.md"
                    className="flex items-center space-x-2 text-green-600 hover:text-green-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Guía completa (archivo local)</span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Estado actual del archivo .env.local:
              </h3>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    ¿Ya configuraste Firebase?
                  </h3>
                  <p className="mt-1 text-sm text-green-700">
                    Reinicia el servidor con <code>pnpm dev</code> y recarga
                    esta página.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Una vez configurado Firebase, podrás crear partidas de minigolf y
            competir con amigos 🏌️‍♂️
          </p>
        </div>
      </div>
    </div>
  )
}

export default FirebaseSetupGuide
