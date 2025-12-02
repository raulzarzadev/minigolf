'use client'

import { Plus, Search, User as UserIcon, X } from 'lucide-react'
import { ChangeEvent, FC } from 'react'
import { GuestInput, SearchUser } from '@/app/game/new/types'
import { Player } from '@/types'

interface PlayersSectionProps {
  players: Player[]
  guestInputs: GuestInput[]
  totalPlayersCount: number
  searchTerm: string
  searchResults: SearchUser[]
  isSearching: boolean
  onRemovePlayer: (playerId: string) => void
  onGuestInputChange: (id: string, value: string) => void
  onAddGuestInput: () => void
  onRemoveGuestInput: (id: string) => void
  onSearchTermChange: (value: string) => void
  onSearchUserSelect: (user: SearchUser) => void
  onSearchUsers: (term: string) => void | Promise<void>
}

const PlayersSection: FC<PlayersSectionProps> = ({
  players,
  guestInputs,
  totalPlayersCount,
  searchTerm,
  searchResults,
  isSearching,
  onRemovePlayer,
  onGuestInputChange,
  onAddGuestInput,
  onRemoveGuestInput,
  onSearchTermChange,
  onSearchUserSelect,
  onSearchUsers
}) => {
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    onSearchTermChange(value)
    onSearchUsers(value)
  }

  return (
    <div>
      <h5 className="block text-sm font-medium text-gray-700 mb-3">
        Jugadores ({totalPlayersCount})
      </h5>

      <div className="space-y-2 mb-4">
        {players.map((player, index) => (
          <div
            key={player.id}
            className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
          >
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              {player.isGuest ? (
                <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center shrink-0">
                  <UserIcon className="h-4 w-4 text-gray-600" />
                </div>
              ) : (
                <div className="h-8 w-8 bg-black rounded-full flex items-center justify-center shrink-0">
                  <span className="text-sm font-medium text-white">
                    {player.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm truncate">
                  {player.name}
                </div>
                <div className="text-xs text-gray-500">
                  {player.isGuest ? 'Invitado' : 'Usuario registrado'}
                  {index === 0 && ' (Tú)'}
                </div>
              </div>
            </div>
            {index > 0 && (
              <button
                type="button"
                onClick={() => onRemovePlayer(player.id)}
                className="text-red-500 hover:text-red-700 p-1 touch-manipulation"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="border border-gray-200 rounded-lg p-3 mb-4">
        <h4 className="font-medium text-gray-900 mb-2 text-sm">
          Jugadores invitados (se agregarán al guardar)
        </h4>
        <div className="space-y-2">
          {guestInputs.map((input, index) => (
            <div key={input.id} className="flex space-x-2">
              <input
                type="text"
                value={input.name}
                onChange={(event) =>
                  onGuestInputChange(input.id, event.target.value)
                }
                placeholder={`Nombre del invitado ${index + 1}`}
                className="flex-1 px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 text-base"
              />
              <button
                type="button"
                onClick={() => onRemoveGuestInput(input.id)}
                className="px-3 py-3 border border-gray-300 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onAddGuestInput}
          className="mt-3 w-full inline-flex items-center justify-center px-3 py-2 border border-dashed border-green-400 text-green-700 rounded-md hover:bg-green-50 text-sm"
        >
          <Plus className="h-4 w-4 mr-2" /> Agregar otro invitado
        </button>
      </div>

      <div className="border border-gray-200 rounded-lg p-3">
        <h4 className="font-medium text-gray-900 mb-2 text-sm">
          Buscar usuarios registrados
        </h4>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Buscar por nombre"
            className="w-full px-3 py-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-black focus:border-black text-base"
          />
          <Search className="h-4 w-4 text-gray-400 absolute left-3 top-4" />
        </div>

        {searchResults.length > 0 && (
          <div className="mt-2 border border-gray-200 rounded-lg">
            {searchResults.map((searchUser) => (
              <button
                key={searchUser.id}
                type="button"
                onClick={() => onSearchUserSelect(searchUser)}
                className="w-full text-left px-3 py-3 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg border-b border-gray-200 last:border-b-0 touch-manipulation"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-6 w-6 bg-black rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-white">
                      {searchUser.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">
                      {searchUser.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {searchUser.email}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {isSearching && (
          <div className="mt-2 text-center text-gray-500 text-sm">
            Buscando...
          </div>
        )}
      </div>
    </div>
  )
}

export default PlayersSection
