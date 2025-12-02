'use client'

import { FC, useEffect, useState } from 'react'

/**
 * Hook para precargar el logo y asegurar que esté disponible
 */
export const useLogoPreloader = () => {
  const [logoLoaded, setLogoLoaded] = useState(false)

  useEffect(() => {
    // Verificar si ya se cargó antes en esta sesión
    const cachedLoad = sessionStorage.getItem('logo-loaded')
    if (cachedLoad === 'true') {
      setLogoLoaded(true)
      return
    }

    const preloadImage = new Image()
    preloadImage.onload = () => {
      setLogoLoaded(true)
      sessionStorage.setItem('logo-loaded', 'true')
    }
    preloadImage.onerror = () => {
      setLogoLoaded(false)
      sessionStorage.removeItem('logo-loaded')
    }
    preloadImage.src = '/logo-baja-mini-golf.png'
  }, [])

  return logoLoaded
}

/**
 * Componente para precargar recursos críticos
 */
const LogoPreloader: FC = () => {
  useEffect(() => {
    // Precargar la imagen del logo
    const preloadLink = document.createElement('link')
    preloadLink.rel = 'preload'
    preloadLink.href = '/logo-baja-mini-golf.png'
    preloadLink.as = 'image'
    preloadLink.type = 'image/png'
    document.head.appendChild(preloadLink)

    // Limpiar al desmontar
    return () => {
      if (document.head.contains(preloadLink)) {
        document.head.removeChild(preloadLink)
      }
    }
  }, [])

  return null // Este componente no renderiza nada visible
}

export default LogoPreloader
