'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import {
  LogOut,
  User,
  Home,
  Trophy,
  Plus,
  Menu,
  X,
  Settings
} from 'lucide-react'
import Logo from './Logo'

const Navbar: React.FC = () => {
  const { user, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  if (!user) {
    return null
  }

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <nav className="bg-white text-black shadow-lg border-b-2 border-black">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          {/* Logo y marca */}
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center"
              onClick={closeMobileMenu}
            >
              <Logo size="md" variant="dark" showText={true} />
            </Link>
          </div>

          {/* Menu de escritorio */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-4">
            <Link
              href="/"
              className="flex items-center space-x-1 px-2 lg:px-3 py-2 rounded-md text-sm font-medium hover:bg-green-100 hover:text-green-700 transition-colors"
            >
              <Home size={18} />
              <span className="hidden lg:inline">Inicio</span>
            </Link>

            <Link
              href="/game/new"
              className="flex items-center space-x-1 px-2 lg:px-3 py-2 rounded-md text-sm font-medium hover:bg-green-100 hover:text-green-700 transition-colors"
            >
              <Plus size={18} />
              <span className="hidden lg:inline">Nueva Partida</span>
            </Link>

            <Link
              href="/tournaments"
              className="flex items-center space-x-1 px-2 lg:px-3 py-2 rounded-md text-sm font-medium hover:bg-green-100 hover:text-green-700 transition-colors"
            >
              <Trophy size={18} />
              <span className="hidden lg:inline">Torneos</span>
            </Link>

            {user.isAdmin && (
              <Link
                href="/admin"
                className="flex items-center space-x-1 px-2 lg:px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-100 hover:text-blue-700 transition-colors"
              >
                <Settings size={18} />
                <span className="hidden lg:inline">Admin</span>
              </Link>
            )}

            <div className="flex items-center space-x-1 lg:space-x-4 border-l border-gray-300 pl-2 lg:pl-4 ml-2 lg:ml-4">
              <Link
                href="/profile"
                className="flex items-center space-x-1 px-2 lg:px-3 py-2 rounded-md text-sm font-medium hover:bg-green-100 hover:text-green-700 transition-colors"
              >
                <User size={18} />
                <div className="hidden lg:block">
                  <div className="truncate max-w-24 text-sm">{user.name}</div>
                  <div className="truncate max-w-24 text-xs text-gray-500 font-mono">
                    @{user.username}
                  </div>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 px-2 lg:px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                <LogOut size={18} />
                <span className="hidden lg:inline">Salir</span>
              </button>
            </div>
          </div>

          {/* Botón menú móvil */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors touch-manipulation"
              aria-label="Abrir menú"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Menú móvil */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-300">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                href="/"
                onClick={closeMobileMenu}
                className="flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium hover:bg-gray-100 transition-colors active:bg-gray-100 touch-manipulation"
              >
                <Home size={20} />
                <span>Inicio</span>
              </Link>

              <Link
                href="/game/new"
                onClick={closeMobileMenu}
                className="flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium hover:bg-gray-100 transition-colors active:bg-gray-100 touch-manipulation"
              >
                <Plus size={20} />
                <span>Nueva Partida</span>
              </Link>

              <Link
                href="/tournaments"
                onClick={closeMobileMenu}
                className="flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium hover:bg-gray-100 transition-colors active:bg-gray-100 touch-manipulation"
              >
                <Trophy size={20} />
                <span>Torneos</span>
              </Link>

              <Link
                href="/games"
                onClick={closeMobileMenu}
                className="flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium hover:bg-gray-100 transition-colors active:bg-gray-100 touch-manipulation"
              >
                <Trophy size={20} />
                <span>Mis Partidas</span>
              </Link>

              {user.isAdmin && (
                <Link
                  href="/admin"
                  onClick={closeMobileMenu}
                  className="flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium hover:bg-blue-100 transition-colors active:bg-blue-100 touch-manipulation"
                >
                  <Settings size={20} />
                  <span>Panel de Admin</span>
                </Link>
              )}

              <div className="border-t border-gray-300 pt-4 mt-4">
                <Link
                  href="/profile"
                  onClick={closeMobileMenu}
                  className="flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium hover:bg-gray-100 transition-colors active:bg-gray-100 touch-manipulation"
                >
                  <User size={20} />
                  <div>
                    <div className="text-base">{user.name}</div>
                    <div className="text-sm text-gray-500 font-mono">
                      @{user.username}
                    </div>
                  </div>
                </Link>

                <button
                  onClick={() => {
                    handleLogout()
                    closeMobileMenu()
                  }}
                  className="flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium hover:bg-gray-100 transition-colors active:bg-gray-100 w-full text-left touch-manipulation"
                >
                  <LogOut size={20} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
