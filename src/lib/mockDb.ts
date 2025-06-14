import { Game } from '@/types'

// Define type for mock users
interface MockUser {
  id: string
  name: string
  email: string
}

// Temporary mock database for testing without Firebase
const mockGames: Record<string, Game> = {}
let gameIdCounter = 1

export const createGameMock = async (
  gameData: Omit<Game, 'id' | 'createdAt'>
): Promise<string> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const gameId = `game_${gameIdCounter++}`
  const game: Game = {
    ...gameData,
    id: gameId,
    createdAt: new Date()
  }

  mockGames[gameId] = game
  console.log('Mock game created:', game)
  return gameId
}

export const getGameMock = async (gameId: string): Promise<Game | null> => {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return mockGames[gameId] || null
}

export const updateGameMock = async (
  gameId: string,
  updates: Partial<Game>
): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 500))
  if (mockGames[gameId]) {
    mockGames[gameId] = { ...mockGames[gameId], ...updates }
  }
}

export const searchUsersMock = async (searchTerm: string): Promise<MockUser[]> => {
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Mock users for testing
  const mockUsers = [
    { id: 'user_1', name: 'Ana García', email: 'ana@example.com' },
    { id: 'user_2', name: 'Carlos López', email: 'carlos@example.com' },
    { id: 'user_3', name: 'María Rodríguez', email: 'maria@example.com' }
  ]

  return mockUsers.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
}
