import { Game } from '@/types'
import { createGame } from './db'

// Clave para almacenar partidas locales
const LOCAL_GAMES_KEY = 'minigolf_local_games'

// Interfaz para partidas locales
export interface LocalGame extends Omit<Game, 'id' | 'createdAt'> {
  id: string
  createdAt: string // Almacenado como string en localStorage
  isLocal: true
}

// Generar ID único para partidas locales
export const generateLocalGameId = (): string => {
  return `local_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

// Obtener todas las partidas locales
export const getLocalGames = (): LocalGame[] => {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(LOCAL_GAMES_KEY)
    if (!stored) return []

    const games = JSON.parse(stored) as LocalGame[]
    return games
  } catch (error) {
    console.error('Error loading local games:', error)
    return []
  }
}

// Guardar una partida local
export const saveLocalGame = (
  game: Omit<LocalGame, 'id' | 'createdAt' | 'isLocal'>
): string => {
  if (typeof window === 'undefined') return ''

  try {
    const games = getLocalGames()
    const localGame: LocalGame = {
      ...game,
      id: generateLocalGameId(),
      createdAt: new Date().toISOString(),
      isLocal: true
    }

    games.push(localGame)
    localStorage.setItem(LOCAL_GAMES_KEY, JSON.stringify(games))

    return localGame.id
  } catch (error) {
    console.error('Error saving local game:', error)
    throw new Error('No se pudo guardar la partida localmente')
  }
}

// Obtener una partida local por ID
export const getLocalGame = (id: string): LocalGame | null => {
  if (typeof window === 'undefined') return null

  try {
    const games = getLocalGames()
    return games.find((game) => game.id === id) || null
  } catch (error) {
    console.error('Error getting local game:', error)
    return null
  }
}

// Actualizar una partida local
export const updateLocalGame = (
  id: string,
  updates: Partial<LocalGame>
): boolean => {
  if (typeof window === 'undefined') return false

  try {
    const games = getLocalGames()
    const gameIndex = games.findIndex((game) => game.id === id)

    if (gameIndex === -1) return false

    games[gameIndex] = { ...games[gameIndex], ...updates }
    localStorage.setItem(LOCAL_GAMES_KEY, JSON.stringify(games))

    return true
  } catch (error) {
    console.error('Error updating local game:', error)
    return false
  }
}

// Eliminar una partida local
export const deleteLocalGame = (id: string): boolean => {
  if (typeof window === 'undefined') return false

  try {
    const games = getLocalGames()
    const filteredGames = games.filter((game) => game.id !== id)

    localStorage.setItem(LOCAL_GAMES_KEY, JSON.stringify(filteredGames))
    return true
  } catch (error) {
    console.error('Error deleting local game:', error)
    return false
  }
}

// Eliminar todas las partidas locales
export const clearLocalGames = (): boolean => {
  if (typeof window === 'undefined') return false

  try {
    localStorage.removeItem(LOCAL_GAMES_KEY)
    return true
  } catch (error) {
    console.error('Error clearing local games:', error)
    return false
  }
}

// Convertir partida local a partida de servidor
export const convertLocalGameToServerGame = (
  localGame: LocalGame
): Omit<Game, 'id' | 'createdAt'> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, createdAt, isLocal, ...gameData } = localGame
  return gameData
}

// Verificar si una partida es local
export const isLocalGame = (gameId: string): boolean => {
  return gameId.startsWith('local_')
}

// Obtener el número de partidas locales
export const getLocalGamesCount = (): number => {
  return getLocalGames().length
}

// Obtener partidas locales no terminadas
export const getUnfinishedLocalGames = (): LocalGame[] => {
  return getLocalGames().filter((game) => game.status !== 'finished')
}

// Obtener partidas locales terminadas
export const getFinishedLocalGames = (): LocalGame[] => {
  return getLocalGames().filter((game) => game.status === 'finished')
}

// Publicar partida local al servidor
export const publishLocalGameToServer = async (
  localGameId: string,
  userId: string
): Promise<string> => {
  const localGame = getLocalGame(localGameId)
  if (!localGame) {
    throw new Error('Partida local no encontrada')
  }

  // Convertir partida local a formato servidor
  const serverGameData = convertLocalGameToServerGame(localGame)

  // Limpiar datos para evitar valores undefined
  const cleanGameData = {
    ...serverGameData,
    createdBy: userId,
    // Actualizar los jugadores sin valores undefined
    players: serverGameData.players.map((player) => {
      const cleanPlayer = {
        ...player,
        // Solo añadir userId si no es invitado
        ...(player.isGuest ? {} : { userId })
      }
      return cleanPlayer
    }),
    // Asegurar que finishedAt sea undefined si no existe
    finishedAt: serverGameData.finishedAt || undefined
  }

  // Limpiar cualquier valor undefined del objeto completo
  const finalCleanData = cleanFirebaseData(cleanGameData)

  // Crear en el servidor
  const serverGameId = await createGame(finalCleanData)

  // Eliminar partida local
  deleteLocalGame(localGameId)

  return serverGameId
}

// Migrar todas las partidas locales al servidor (útil después del login)
export const migrateLocalGamesToServer = async (
  userId: string
): Promise<string[]> => {
  const localGames = getLocalGames()
  const migratedGameIds: string[] = []

  for (const localGame of localGames) {
    try {
      const serverGameId = await publishLocalGameToServer(localGame.id, userId)
      migratedGameIds.push(serverGameId)
    } catch (error) {
      console.error(`Error migrating local game ${localGame.id}:`, error)
    }
  }

  return migratedGameIds
}

// Función auxiliar para limpiar objetos de valores undefined (Firebase no los permite)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cleanFirebaseData = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return undefined
  }

  if (Array.isArray(obj)) {
    return obj.map(cleanFirebaseData).filter((item) => item !== undefined)
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cleaned: any = {}
    for (const [key, value] of Object.entries(obj)) {
      const cleanedValue = cleanFirebaseData(value)
      if (cleanedValue !== undefined) {
        cleaned[key] = cleanedValue
      }
    }
    return cleaned
  }

  return obj
}
