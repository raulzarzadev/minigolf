'use client'

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
  showText = true, 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  }

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  }

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

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Logo SVG - Minigolf flag and hole */}
      <svg
        className={`${sizeClasses[size]} ${colorClasses[variant].icon}`}
        viewBox="0 0 32 32"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Golf hole */}
        <circle cx="16" cy="28" r="2" fill="currentColor" />
        <ellipse cx="16" cy="28" rx="4" ry="1" fill="currentColor" opacity="0.3" />
        
        {/* Golf flag pole */}
        <rect x="15" y="4" width="2" height="24" fill="currentColor" />
        
        {/* Golf flag */}
        <path
          d="M17 4 L17 14 L26 11 L26 7 Z"
          fill="currentColor"
        />
        
        {/* Golf ball path (decorative dots) */}
        <circle cx="8" cy="24" r="0.5" fill="currentColor" opacity="0.4" />
        <circle cx="10" cy="22" r="0.5" fill="currentColor" opacity="0.4" />
        <circle cx="12" cy="20" r="0.5" fill="currentColor" opacity="0.4" />
      </svg>
      
      {showText && (
        <span className={`font-bold ${textSizeClasses[size]} ${colorClasses[variant].text}`}>
          Minigolf
        </span>
      )}
    </div>
  )
}

export default Logo
