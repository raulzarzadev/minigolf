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
  className = ''
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
    sm: 64,
    md: 84,
    lg: 104,
    xl: 124
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Image
        src={'/logo-tipo-baja-mini-golf.png'}
        alt="Baja Mini Golf"
        className={` object-contain ${colorClasses[variant].icon}`}
        width={sizes[size]}
        height={sizes[size]}
        priority
      />
    </div>
  )
}

export default Logo
