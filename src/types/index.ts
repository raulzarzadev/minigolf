// User model
export interface User {
  id: string
  name: string
  email: string
  createdAt: Date
  gamesPlayed: number
  averageScore: number
}

// Player in a game (can be registered user or guest)
export interface Player {
  id: string // For guests: generated ID, for users: user ID
  name: string
  userId?: string // null for guests
  isGuest: boolean
}

// Game model
export interface Game {
  id: string
  createdBy: string // User ID
  createdAt: Date
  holeCount: number
  players: Player[]
  scores: Record<string, number[]> // playerId -> array of scores per hole
  status: 'in_progress' | 'finished'
  tournamentId?: string | null
  isMultiplayer: boolean
  currentHole: number // Track which hole we're on
  finishedAt?: Date
}

// Tournament model
export interface Tournament {
  id: string
  name: string
  season: string
  startDate: Date
  endDate: Date
  status: 'upcoming' | 'active' | 'finished'
  participants: string[] // User IDs
  games: string[] // Game IDs
}

// Game statistics
export interface GameStats {
  totalStrokes: number
  averagePerHole: number
  bestHole: number
  worstHole: number
  holesInOne: number
}

// User statistics
export interface UserStats {
  gamesPlayed: number
  totalStrokes: number
  averageScore: number
  bestGame: number
  holesInOne: number
  tournamentsWon: number
}
