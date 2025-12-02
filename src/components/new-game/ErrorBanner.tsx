import { AlertCircle } from 'lucide-react'
import { FC } from 'react'

interface ErrorBannerProps {
  message: string | null
  onDismiss: () => void
}

const ErrorBanner: FC<ErrorBannerProps> = ({ message, onDismiss }) => {
  if (!message) {
    return null
  }

  return (
    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex">
        <div className="shrink-0">
          <AlertCircle className="h-4 w-4 text-red-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            Error al crear la partida
          </h3>
          <div className="mt-1 text-sm text-red-700">{message}</div>
          <div className="mt-2">
            <button
              type="button"
              onClick={onDismiss}
              className="text-sm text-red-600 hover:text-red-500"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ErrorBanner
