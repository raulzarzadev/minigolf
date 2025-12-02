'use client'

import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react'
import { FC, useCallback, useEffect, useState } from 'react'

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastProps {
  toast: ToastMessage
  onClose: (id: string) => void
}

const Toast: FC<ToastProps> = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(true)

  const handleClose = useCallback(() => {
    setIsVisible(false)
    setTimeout(() => onClose(toast.id), 150) // Wait for animation
  }, [onClose, toast.id])

  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        handleClose()
      }, toast.duration)

      return () => clearTimeout(timer)
    }
  }, [toast.duration, handleClose])

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-black" />
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-gray-700" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-gray-600" />
      case 'info':
        return <Info className="h-5 w-5 text-gray-800" />
    }
  }

  const getColors = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-white border-black'
      case 'error':
        return 'bg-gray-100 border-gray-400'
      case 'warning':
        return 'bg-gray-50 border-gray-300'
      case 'info':
        return 'bg-white border-gray-500'
    }
  }

  return (
    <div
      className={`max-w-sm w-full border rounded-lg shadow-lg transition-all duration-150 ${
        isVisible
          ? 'opacity-100 transform translate-x-0'
          : 'opacity-0 transform translate-x-full'
      } ${getColors()}`}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="shrink-0">{getIcon()}</div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">{toast.title}</p>
            {toast.message && (
              <p className="mt-1 text-sm text-gray-500">{toast.message}</p>
            )}
            {toast.action && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={toast.action.onClick}
                  className="text-sm font-medium text-black hover:text-gray-700"
                >
                  {toast.action.label}
                </button>
              </div>
            )}
          </div>
          <div className="ml-4 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastMessage[]
  onClose: (id: string) => void
}

const ToastContainer: FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  )
}

// Hook for managing toasts
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastMessage = {
      ...toast,
      id,
      duration: toast.duration || 5000
    }
    setToasts((prev) => [...prev, newToast])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const success = (
    title: string,
    message?: string,
    options?: Partial<ToastMessage>
  ) => {
    addToast({ type: 'success', title, message, ...options })
  }

  const error = (
    title: string,
    message?: string,
    options?: Partial<ToastMessage>
  ) => {
    addToast({ type: 'error', title, message, ...options })
  }

  const info = (
    title: string,
    message?: string,
    options?: Partial<ToastMessage>
  ) => {
    addToast({ type: 'info', title, message, ...options })
  }

  const warning = (
    title: string,
    message?: string,
    options?: Partial<ToastMessage>
  ) => {
    addToast({ type: 'warning', title, message, ...options })
  }

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info,
    warning,
    ToastContainer: () => (
      <ToastContainer toasts={toasts} onClose={removeToast} />
    )
  }
}

export default ToastContainer
