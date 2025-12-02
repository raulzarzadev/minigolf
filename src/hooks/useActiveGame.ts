'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getAllUserGames } from '@/lib/db'
import { getUnfinishedLocalGames } from '@/lib/localStorage'

export interface ActiveGameInfo {
  id: string
  isLocal: boolean
  isMultiplayer: boolean
  holeCount: number
  playerCount: number
  createdAt: Date
}

interface UseActiveGameResult {
  activeGame: ActiveGameInfo | null
  isChecking: boolean
  refresh: () => Promise<void>
}

export const useActiveGame = (pollIntervalMs = 45000): UseActiveGameResult => {
  const { user } = useAuth()
  const [activeGame, setActiveGame] = useState<ActiveGameInfo | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const refresh = useCallback(async () => {
    setIsChecking(true)
    try {
      if (user) {
        const games = await getAllUserGames(user.id)
        const active = games.find((game) => game.status === 'in_progress')
        if (active) {
          if (isMountedRef.current) {
            setActiveGame({
              id: active.id,
              isLocal: false,
              isMultiplayer: active.isMultiplayer,
              holeCount: active.holeCount,
              playerCount: active.players.length,
              createdAt: active.createdAt
            })
          }
          return
        }
      }

      const localGames = getUnfinishedLocalGames()
      if (localGames.length > 0) {
        const localActive = localGames[0]
        if (isMountedRef.current) {
          setActiveGame({
            id: localActive.id,
            isLocal: true,
            isMultiplayer: localActive.isMultiplayer,
            holeCount: localActive.holeCount,
            playerCount: localActive.players.length,
            createdAt: new Date(localActive.createdAt)
          })
        }
      } else if (isMountedRef.current) {
        setActiveGame(null)
      }
    } catch (error) {
      console.error('Error checking active game:', error)
    } finally {
      if (isMountedRef.current) {
        setIsChecking(false)
      }
    }
  }, [user])

  useEffect(() => {
    refresh()

    if (pollIntervalMs <= 0) {
      return
    }

    const intervalId = setInterval(refresh, pollIntervalMs)

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'minigolf_local_games') {
        refresh()
      }
    }

    window.addEventListener('storage', handleStorage)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('storage', handleStorage)
    }
  }, [pollIntervalMs, refresh])

  return { activeGame, isChecking, refresh }
}
