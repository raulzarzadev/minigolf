'use client'

import Image from 'next/image'
import { FC } from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'dark' | 'light'
  showText?: boolean
  className?: string
}

const Logo: FC<LogoProps> = ({
  size = 'md',
  variant = 'dark',
  className = '',
  showText = true
}) => {
  // const [imageError, setImageError] = useState(false)
  // const [imageLoaded, setImageLoaded] = useState(false)
  // const logoPreloaded = useLogoPreloader()

  const sizes = {
    sm: 32,
    md: 46,
    lg: 64,
    xl: 68
  }

  // // Si hay error o no está cargada la imagen, mostrar fallback
  // if (imageError || (!imageLoaded && !logoPreloaded)) {
  //   return (
  //     <LogoFallback
  //       size={size}
  //       variant={variant}
  //       showText={showText}
  //       className={className}
  //     />
  //   )
  // }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative">
        <Image
          src="/android-chrome-192x192.png"
          alt="Baja Mini Golf"
          className="object-contain transition-opacity duration-300"
          width={sizes[size]}
          height={sizes[size]}
          // priority
          // onLoad={() => setImageLoaded(true)}
          // onError={() => setImageError(true)}
          // unoptimized={false}
        />
      </div>
      {showText && (
        <span
          className={`font-bold ${
            variant === 'dark' ? 'text-black' : 'text-white'
          }`}
        >
          Baja Mini Golf
        </span>
      )}
    </div>
  )
}

export default Logo
