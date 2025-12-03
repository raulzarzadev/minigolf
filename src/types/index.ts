export interface UserShots {
  pendings: number
}

// User model
export interface User {
  id: string
  name: string
  username: string
  email: string
  createdAt: Date
  gamesPlayed: number
  averageScore: number
  shots: UserShots
  /**
   * @deprecated Use roles instead
   */
  isAdmin?: boolean
  roles?: ('admin' | 'superadmin')[]
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
  description: string
  season: string
  startDate: Date
  endDate: Date
  status: 'upcoming' | 'active' | 'finished'
  participants: string[] // User IDs
  games: string[] // Game IDs
  createdBy: string // User ID
  createdAt: Date
  maxParticipants?: number
  holeCount: number
  entryFee?: number
  prizes?: string[]
  rules?: string
  leaderboard?: TournamentStanding[]
}

// Tournament standing/ranking
export interface TournamentStanding {
  userId: string
  userName: string
  gamesPlayed: number
  totalStrokes: number
  averageScore: number
  position: number
  points: number
}

// Notification system
export interface Notification {
  id: string
  userId: string
  type:
    | 'game_invite'
    | 'tournament_invite'
    | 'game_finished'
    | 'tournament_result'
  title: string
  message: string
  createdAt: Date
  read: boolean
  actionUrl?: string
  gameId?: string
  tournamentId?: string
}

// Achievement system
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  condition: string
  category: 'scoring' | 'games' | 'tournaments' | 'social'
  points: number
}

export interface UserAchievement {
  userId: string
  achievementId: string
  earnedAt: Date
  gameId?: string
  tournamentId?: string
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

// Admin panel types
export interface AdminStats {
  totalUsers: number
  totalGames: number
  totalTournaments: number
  activeGames: number
  todayGames: number
  weeklyGames: number
  monthlyGames: number
}

export interface AdminUser extends User {
  lastLoginAt?: Date
  isActive: boolean
  gameHistory: {
    gameId: string
    finishedAt: Date
    totalStrokes: number
  }[]
}

export interface AdminGame extends Game {
  duration?: number // in minutes
  averageScore: number
  playerCount: number
}

// Admin panel types
export interface AdminStats {
  totalUsers: number
  totalGames: number
  totalTournaments: number
  activeGames: number
  todayGames: number
  weeklyGames: number
  monthlyGames: number
}

export interface AdminUser extends User {
  lastLoginAt?: Date
  isActive: boolean
  gameHistory: {
    gameId: string
    finishedAt: Date
    totalStrokes: number
  }[]
}

export interface AdminGame extends Game {
  duration?: number // in minutes
  averageScore: number
  playerCount: number
}
