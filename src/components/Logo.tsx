'use client'

import Image from 'next/image'
import React from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'dark' | 'light'
  showText?: boolean
  className?: string
}

const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'dark',
  className = '',
  showText = true
}) => {
  const colorClasses = {
    dark: {
      icon: 'text-black',
      text: 'text-black'
    },
    light: {
      icon: 'text-white',
      text: 'text-white'
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
      <Image
        src={'/logo-baja-mini-golf.png'}
        alt="Baja Mini Golf"
        className={` object-contain ${colorClasses[variant].icon}`}
        width={sizes[size]}
        height={sizes[size]}
        priority
      />
      {showText && (
        <span className={`font-bold  ${colorClasses[variant].text}`}>
          Baja Mini Golf
        </span>
      )}
    </div>
  )
}

export default Logo
