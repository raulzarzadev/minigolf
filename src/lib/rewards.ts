const STORAGE_KEY = 'baja-reward-center'

export type PrizeTier = 'small' | 'medium' | 'large'

export type RewardStepId = 'register' | 'follow' | 'share'

export const prizeCatalog = {
  small: {
    label: 'Premio chico',
    description: '1 partida de minigolf gratis para tu próxima visita.',
    accent: 'bg-green-100 text-green-800'
  },
  medium: {
    label: 'Premio mediano',
    description: 'Acceso al muro de escalar y foto en el mural de campeones.',
    accent: 'bg-blue-100 text-blue-800'
  },
  large: {
    label: 'Premio grande',
    description: 'Challenge sorpresa en otra atracción del parque.',
    accent: 'bg-purple-100 text-purple-800'
  }
} as const

export interface RewardRoll {
  id: string
  tier: PrizeTier
  timestamp: number
}

export interface RewardState {
  gameId: string
  completedSteps: Record<string, boolean>
  availableRolls: number
  rollHistory: RewardRoll[]
  updatedAt: number
}

type RewardStorage = Record<string, RewardState>

const defaultState = (gameId: string): RewardState => ({
  gameId,
  completedSteps: {},
  availableRolls: 0,
  rollHistory: [],
  updatedAt: Date.now()
})

const readStorage = (): RewardStorage => {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as RewardStorage) : {}
  } catch {
    return {}
  }
}

const writeStorage = (payload: RewardStorage) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore quota errors
  }
}

export const loadRewardState = (gameId: string): RewardState => {
  const storage = readStorage()
  return storage[gameId] ?? defaultState(gameId)
}

export const persistRewardState = (
  gameId: string,
  data: Partial<Omit<RewardState, 'gameId' | 'updatedAt'>>
): RewardState => {
  const storage = readStorage()
  const current = storage[gameId] ?? defaultState(gameId)
  const next: RewardState = {
    ...current,
    ...data,
    completedSteps: data.completedSteps ?? current.completedSteps,
    availableRolls: data.availableRolls ?? current.availableRolls,
    rollHistory: data.rollHistory ?? current.rollHistory,
    updatedAt: Date.now()
  }
  storage[gameId] = next
  writeStorage(storage)
  return next
}

export const upsertStepCompletion = (gameId: string, stepId: RewardStepId) => {
  const state = loadRewardState(gameId)
  if (state.completedSteps[stepId]) return state
  return persistRewardState(gameId, {
    completedSteps: { ...state.completedSteps, [stepId]: true },
    availableRolls: state.availableRolls + 1
  })
}

export const registerRoll = (gameId: string, roll: RewardRoll) => {
  const state = loadRewardState(gameId)
  return persistRewardState(gameId, {
    availableRolls: Math.max(0, state.availableRolls - 1),
    rollHistory: [roll, ...state.rollHistory]
  })
}

export const setAvailableRolls = (gameId: string, rolls: number) =>
  persistRewardState(gameId, { availableRolls: Math.max(0, rolls) })

export const getAllRewardStates = (): RewardState[] => {
  const storage = readStorage()
  return Object.values(storage).sort((a, b) => b.updatedAt - a.updatedAt)
}

export const clearRewardState = (gameId: string) => {
  if (typeof window === 'undefined') return
  const storage = readStorage()
  delete storage[gameId]
  writeStorage(storage)
}
