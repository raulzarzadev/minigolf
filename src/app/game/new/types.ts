export interface SearchUser {
  id: string
  name: string
  email: string
}

export interface GuestInput {
  id: string
  name: string
}

export interface GameFormData {
  holeCount: number
  isMultiplayer: string
  tournamentId?: string
}
