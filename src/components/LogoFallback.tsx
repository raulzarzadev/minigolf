'use client'

import React, { FC } from 'react'

interface LogoFallbackProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'dark' | 'light'
  showText?: boolean
  className?: string
}

/**
 * Componente de logo inmediato que no depende de imágenes externas
 * Se usa como fallback instantáneo mientras se carga la imagen real
 */
const LogoFallback: FC<LogoFallbackProps> = ({
  size = 'md',
  variant = 'dark',
  className = '',
  showText = true
}) => {
  const colorClasses = {
    dark: {
      icon: 'text-white',
      text: 'text-black',
      bg: 'bg-green-600'
    },
    light: {
      icon: 'text-white',
      text: 'text-white',
      bg: 'bg-green-600'
    }
  }

  const sizes = {
    sm: 32,
    md: 46,
    lg: 64,
    xl: 68
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div
        className={`flex items-center justify-center rounded-lg ${colorClasses[variant].bg}`}
        style={{ width: sizes[size], height: sizes[size] }}
      >
        <svg
          viewBox="0 0 24 24"
          className={`w-3/4 h-3/4 ${colorClasses[variant].icon}`}
          fill="currentColor"
        >
          {/* Icono de golf minimalista */}
          <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" />
          <circle cx="12" cy="20" r="2" />
          <path d="M12 16V18" />
        </svg>
      </div>
      {showText && (
        <span className={`font-bold ${colorClasses[variant].text}`}>
          Baja Mini Golf
        </span>
      )}
    </div>
  )
}

export default LogoFallback
