'use client'

import { User as UserIcon, Users as UsersIcon } from 'lucide-react'
import { FC } from 'react'

interface GameTypeSelectorProps {
  isMultiplayer: boolean
  hasMinimumPlayers: boolean
  onSelectMode: (value: 'true' | 'false') => void
}

const GameTypeSelector: FC<GameTypeSelectorProps> = ({
  isMultiplayer,
  hasMinimumPlayers,
  onSelectMode
}) => {
  return (
    <div>
      <h5 className="block text-sm font-medium text-gray-700 mb-2">
        Tipo de partida
      </h5>
      <div className="grid grid-cols-1 gap-3">
        <label className="relative">
          <input
            type="radio"
            className="sr-only"
            name="game-mode"
            value="false"
            checked={!isMultiplayer}
            onChange={() => onSelectMode('false')}
          />
          <div
            className={`border-2 rounded-lg p-3 cursor-pointer transition-colors touch-manipulation ${
              !isMultiplayer
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex justify-end space-x-3">
              <UserIcon className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium">Individual</div>
                <div className="text-sm text-gray-500">Solo tú</div>
              </div>
            </div>
          </div>
        </label>

        <label className="relative">
          <input
            type="radio"
            className="sr-only"
            name="game-mode"
            value="true"
            checked={isMultiplayer}
            onChange={() => onSelectMode('true')}
          />
          <div
            className={`border-2 rounded-lg p-3 cursor-pointer transition-colors touch-manipulation ${
              isMultiplayer
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex justify-end space-x-3">
              <UsersIcon className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium">Multijugador</div>
                <div className="text-sm text-gray-500">Juega en famila</div>
              </div>
            </div>
            {isMultiplayer && !hasMinimumPlayers && (
              <p className="text-xs text-red-600 text-right">
                Agrega al menos un jugador adicional
              </p>
            )}
          </div>
        </label>
      </div>
    </div>
  )
}

export default GameTypeSelector
