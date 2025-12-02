'use client'

import { Check, Edit3, X } from 'lucide-react'
import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface DiscreteUsernameEditorProps {
  onUpdate?: () => void
}

export default function DiscreteUsernameEditor({
  onUpdate
}: DiscreteUsernameEditorProps) {
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
      {isEditing ? (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 font-medium">Username:</span>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
              placeholder="Ingresa tu username"
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-green-500 focus:border-transparent"
              disabled={loading}
              maxLength={20}
            />
            <button
              onClick={handleSave}
              disabled={loading}
              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
              title="Guardar"
            >
              <Check className="h-3 w-3" />
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
              title="Cancelar"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {error && <p className="text-red-600 text-xs">{error}</p>}

          <p className="text-xs text-gray-500">
            Solo letras minúsculas, números y guiones bajos. Entre 3-20
            caracteres.
          </p>
        </div>
      ) : (
        <div className="flex items-center space-x-1 group">
          <span className="text-xs text-gray-500"></span>
          <span className="font-mono text-xs text-gray-600">
            @{user.username}
          </span>
          <button
            onClick={() => setIsEditing(true)}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-gray-600 rounded transition-all"
            title="Editar username"
          >
            <Edit3 className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  )
}
