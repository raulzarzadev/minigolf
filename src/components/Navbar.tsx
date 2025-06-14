'use client'

import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { LogOut, User, Home, Trophy, Plus } from 'lucide-react'

const Navbar: React.FC = () => {
  const { user, logout } = useAuth()

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

  return (
    <nav className="bg-green-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="text-2xl">🏌️‍♂️</div>
              <span className="font-bold text-xl">Minigolf</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
            >
              <Home size={18} />
              <span>Inicio</span>
            </Link>

            <Link
              href="/game/new"
              className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
            >
              <Plus size={18} />
              <span>Nueva Partida</span>
            </Link>

            <Link
              href="/tournaments"
              className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
            >
              <Trophy size={18} />
              <span>Torneos</span>
            </Link>

            <div className="flex items-center space-x-4 border-l border-green-500 pl-4">
              <Link
                href="/profile"
                className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <User size={18} />
                <span>{user.name}</span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <LogOut size={18} />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
