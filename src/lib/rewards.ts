import { User } from '@/types'

const STORAGE_KEY = 'baja-reward-center'
const CONFIG_KEY = 'baja-reward-config'

export type PrizeTier = 'small' | 'medium' | 'large'
export type RewardPrize = PrizeTier | 'none'

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
  tier: RewardPrize
  timestamp: number
  delivered?: boolean
  deliveredAt?: number
  deliveredBy?: string
}

export interface RewardState {
  gameId: string
  completedSteps: Record<string, boolean>
  availableRolls: number
  rollHistory: RewardRoll[]
  updatedAt: number
  lastInstruction?: RewardStepId | null
}

export interface RewardPerk {
  id: string
  title: string
  description: string
  tier: PrizeTier | 'bonus'
}

export interface RewardConfig {
  odds: Record<PrizeTier, number>
  perks: RewardPerk[]
  deliveredCounts: Record<RewardPrize, number>
}

type RewardStorage = Record<string, RewardState>

const defaultState = (gameId: string): RewardState => ({
  gameId,
  completedSteps: {},
  availableRolls: 0,
  rollHistory: [],
  updatedAt: Date.now(),
  lastInstruction: null
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

const defaultConfig = (): RewardConfig => ({
  odds: {
    large: 0.02,
    medium: 0.05,
    small: 0.1
  },
  perks: [],
  deliveredCounts: {
    large: 0,
    medium: 0,
    small: 0,
    none: 0
  }
})

const readConfig = (): RewardConfig => {
  if (typeof window === 'undefined') return defaultConfig()
  try {
    const raw = window.localStorage.getItem(CONFIG_KEY)
    if (!raw) return defaultConfig()
    const parsed = JSON.parse(raw) as RewardConfig
    return {
      ...defaultConfig(),
      ...parsed,
      odds: { ...defaultConfig().odds, ...(parsed.odds || {}) },
      deliveredCounts: {
        ...defaultConfig().deliveredCounts,
        ...(parsed.deliveredCounts || {})
      }
    }
  } catch {
    return defaultConfig()
  }
}

const writeConfig = (config: RewardConfig) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
  } catch {
    // ignore errors
  }
}

const sanitizeOdds = (
  odds: Partial<Record<PrizeTier, number>>,
  base: Record<PrizeTier, number>
) => {
  const next: Record<PrizeTier, number> = { ...base }
  ;(['small', 'medium', 'large'] as PrizeTier[]).forEach((tier) => {
    if (typeof odds[tier] === 'number' && Number.isFinite(odds[tier])) {
      next[tier] = Math.max(0, odds[tier] as number)
    }
  })
  return next
}

export const getRewardConfig = (): RewardConfig => readConfig()

export const getRewardOdds = () => readConfig().odds

export const updateRewardOdds = (odds: Partial<Record<PrizeTier, number>>) => {
  const config = readConfig()
  const updated: RewardConfig = {
    ...config,
    odds: sanitizeOdds(odds, config.odds)
  }
  writeConfig(updated)
  return updated
}

export const getRewardPerks = () => readConfig().perks

export const addRewardPerk = (perk: RewardPerk) => {
  const config = readConfig()
  const updated: RewardConfig = {
    ...config,
    perks: [perk, ...config.perks]
  }
  writeConfig(updated)
  return updated
}

export const removeRewardPerk = (perkId: string) => {
  const config = readConfig()
  const updated: RewardConfig = {
    ...config,
    perks: config.perks.filter((perk) => perk.id !== perkId)
  }
  writeConfig(updated)
  return updated
}

const incrementDeliveredCount = (tier: RewardPrize) => {
  const config = readConfig()
  const updated: RewardConfig = {
    ...config,
    deliveredCounts: {
      ...config.deliveredCounts,
      [tier]: (config.deliveredCounts[tier] || 0) + 1
    }
  }
  writeConfig(updated)
  return updated.deliveredCounts
}

export const getPrizeDeliveryStats = () => readConfig().deliveredCounts

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
    lastInstruction: data.lastInstruction ?? current.lastInstruction ?? null,
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

export const rewardStepMeta: Record<
  RewardStepId,
  { label: string; instructions: string[]; ctaLabel: string }
> = {
  register: {
    label: 'Registro',
    instructions: [
      'Inicia sesión o crea tu cuenta.',
      'Abre la partida en Celebración y confirma tu score con el staff.'
    ],
    ctaLabel: 'Ir a mi cuenta'
  },
  follow: {
    label: 'Instagram',
    instructions: [
      'Entra al perfil @bajaminigolf y da follow.',
      'Muestra tu perfil siguiendo la cuenta al staff.'
    ],
    ctaLabel: 'Abrir Instagram'
  },
  share: {
    label: 'Compartido',
    instructions: [
      'Copia el texto oficial del reto y publícalo con tu foto o reel.',
      'Enséñale la publicación al staff para validar tu tirada.'
    ],
    ctaLabel: 'Copiar copy'
  }
}

const INSTAGRAM_PROFILE = 'https://www.instagram.com/baja_mini_golf/'
const SHARE_COPY =
  '📸 Terminé mi partida en Baja Mini Golf. ¡Acepto el reto! #BajaMiniGolf #BajaBlast'

export const triggerRewardStepAction = (
  stepId: RewardStepId,
  {
    gameId,
    user
  }: {
    gameId: string
    user?: User | null
  }
) => {
  if (typeof window === 'undefined') return

  switch (stepId) {
    case 'register': {
      const redirectTo = `/login?redirect=${encodeURIComponent(
        `/game/${gameId}/celebration`
      )}`
      if (user) {
        window.open('/profile', '_blank')
      } else {
        window.open(redirectTo, '_blank')
      }
      break
    }
    case 'follow':
      window.open(INSTAGRAM_PROFILE, '_blank')
      break
    case 'share':
      if (typeof navigator !== 'undefined') {
        navigator.clipboard
          .writeText(SHARE_COPY)
          .then(() => {
            alert(
              'Texto copiado. Pega el copy al subir tu foto en Instagram 📲'
            )
          })
          .catch(() => {})
      }
      break
    default:
      break
  }
}

export const setLastInstruction = (
  gameId: string,
  stepId: RewardStepId | null
) => persistRewardState(gameId, { lastInstruction: stepId })

export interface RewardPerk {
  id: string
  title: string
  description: string
  tier: PrizeTier | 'bonus'
}

export const rollPrizeOutcome = (randomValue = Math.random()): RewardPrize => {
  const odds = getRewardOdds()
  const ordered: PrizeTier[] = ['large', 'medium', 'small']
  let cumulative = 0

  for (const tier of ordered) {
    cumulative += Math.max(0, odds[tier] ?? 0)
    if (randomValue < cumulative) {
      return tier
    }
  }

  return 'none'
}

export const grantAdminRolls = ({
  admin,
  gameId,
  rolls
}: {
  admin?: User | null
  gameId: string
  rolls: number
}) => {
  if (!admin?.isAdmin) {
    console.warn('grantAdminRolls: admin privileges required')
    return null
  }
  if (rolls <= 0) return loadRewardState(gameId)

  const state = loadRewardState(gameId)
  const updated = persistRewardState(gameId, {
    availableRolls: state.availableRolls + rolls
  })
  return updated
}

export const markPrizeDelivered = ({
  admin,
  gameId,
  rollId
}: {
  admin?: User | null
  gameId: string
  rollId: string
}) => {
  if (!admin?.isAdmin) {
    console.warn('markPrizeDelivered: admin privileges required')
    return null
  }

  const state = loadRewardState(gameId)
  const updatedHistory = state.rollHistory.map((roll) => {
    if (roll.id !== rollId || roll.delivered) return roll
    const updatedRoll: RewardRoll = {
      ...roll,
      delivered: true,
      deliveredAt: Date.now(),
      deliveredBy: admin.id
    }
    if (updatedRoll.tier !== 'none') {
      incrementDeliveredCount(updatedRoll.tier)
    } else {
      incrementDeliveredCount('none')
    }
    return updatedRoll
  })

  const updatedState = persistRewardState(gameId, {
    rollHistory: updatedHistory
  })
  return updatedState
}
