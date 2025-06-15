'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Edit3, Check, X, User } from 'lucide-react'

interface UsernameEditorProps {
  onUpdate?: () => void
}

export default function UsernameEditor({ onUpdate }: UsernameEditorProps) {
  const { user, updateUsername } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [newUsername, setNewUsername] = useState(user?.username || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!newUsername.trim()) {
      setError('El username no puede estar vacío')
      return
    }

    // Validate username format
    if (!/^[a-z0-9_]{3,20}$/.test(newUsername)) {
      setError(
        'Username debe tener entre 3-20 caracteres y solo puede contener letras minúsculas, números y guiones bajos'
      )
      return
    }

    if (newUsername === user?.username) {
      setIsEditing(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      await updateUsername(newUsername)
      setIsEditing(false)
      onUpdate?.()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al actualizar username'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setNewUsername(user?.username || '')
    setError(null)
    setIsEditing(false)
  }

  if (!user) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <User className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Username:</span>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
              placeholder="Ingresa tu username"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              disabled={loading}
              maxLength={20}
            />
            <button
              onClick={handleSave}
              disabled={loading}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {error && <p className="text-red-600 text-xs">{error}</p>}

          <p className="text-xs text-gray-500">
            Solo letras minúsculas, números y guiones bajos. Entre 3-20
            caracteres.
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
            @{user.username}
          </span>
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <Edit3 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
