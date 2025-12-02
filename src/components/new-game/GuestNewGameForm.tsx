'use client'

import { Plus } from 'lucide-react'
import { FC, ReactNode } from 'react'

import ErrorBanner from '@/components/new-game/ErrorBanner'

interface GuestNewGameFormProps {
  isLoading: boolean
  hasMinimumPlayers: boolean
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  error: string | null
  onDismissError: () => void
  onCancel: () => void
  renderGameTypeSelector?: () => ReactNode
  renderPrimaryPlayerInput: () => ReactNode
  renderPlayersSection?: () => ReactNode
  renderHoleCountSelect: () => ReactNode
  renderHiddenFields?: () => ReactNode
}

const GuestNewGameForm: FC<GuestNewGameFormProps> = ({
  isLoading,
  hasMinimumPlayers,
  onSubmit,
  error,
  onDismissError,
  onCancel,
  renderGameTypeSelector,
  renderPrimaryPlayerInput,
  renderPlayersSection,
  renderHoleCountSelect,
  renderHiddenFields
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* <Navbar /> */}
      <div className="max-w-3xl mx-auto py-4 px-3 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h1 className="text-xl font-bold text-gray-900 mb-4">
            Nueva Partida 🏌️‍♂️
          </h1>

          <ErrorBanner message={error} onDismiss={onDismissError} />

          <form onSubmit={onSubmit} className="space-y-6">
            {renderHiddenFields?.()}

            {renderGameTypeSelector?.()}

            {renderPrimaryPlayerInput()}

            {renderPlayersSection?.()}

            {renderHoleCountSelect()}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || !hasMinimumPlayers}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>Creando...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Crear Partida</span>
                  </>
                )}
              </button>
            </div>
            {!hasMinimumPlayers && (
              <p className="text-xs text-red-600 text-right">
                Agrega al menos un jugador adicional
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

export default GuestNewGameForm
