import {
  arrayUnion,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { listPrizes, PrizeRecord, selectPrizeByOdds } from '@/lib/prizes'
import { UserTries } from '@/types'

const COLLECTION_NAME = 'users'
export const DEFAULT_REGISTRATION_TRIES = 3

export const createDefaultUserTries = (): UserTries => ({
  triesLeft: DEFAULT_REGISTRATION_TRIES,
  lastTryAt: null,
  prizesWon: [],
  triesPlayed: 0
})

export const normalizeUserTries = (raw?: unknown): UserTries => {
  if (!raw || typeof raw !== 'object') {
    return createDefaultUserTries()
  }

  const source = raw as Record<string, any>
  const safeNumber = (value: unknown) =>
    Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0

  return {
    triesLeft: safeNumber(source.triesLeft ?? source.pendientes),
    triesPlayed: safeNumber(source.triesPlayed),
    lastTryAt: source.lastTryAt?.toDate
      ? source.lastTryAt.toDate()
      : source.lastTryAt
        ? new Date(source.lastTryAt)
        : null,
    prizesWon: Array.isArray(source.prizesWon)
      ? source.prizesWon.map((entry) => ({
          prizeId: entry.prizeId,
          wonAt: entry.wonAt?.toDate
            ? entry.wonAt.toDate()
            : entry.wonAt
              ? new Date(entry.wonAt)
              : new Date(),
          deliveredAt: entry.deliveredAt?.toDate
            ? entry.deliveredAt.toDate()
            : entry.deliveredAt
              ? new Date(entry.deliveredAt)
              : null
        }))
      : []
  }
}

export const deliverPrizeForUser = async (userId: string, prizeId: string) => {
  const userRef = doc(db, COLLECTION_NAME, userId)
  const snapshot = await getDoc(userRef)
  const data = snapshot.data()
  if (!data) return

  const tries = normalizeUserTries(data.tries)
  const updatedPrizes = tries.prizesWon.map((prize) =>
    prize.prizeId === prizeId
      ? { ...prize, deliveredAt: serverTimestamp() }
      : prize
  )

  await updateDoc(userRef, {
    'tries.prizesWon': updatedPrizes,
    'tries.updatedAt': serverTimestamp()
  })
}

export const incrementUserTries = async (
  userId: string,
  count: number
): Promise<UserTries> => {
  if (!Number.isFinite(count) || count <= 0) {
    throw new Error('La cantidad de tiros debe ser mayor que cero')
  }

  return runTransaction(db, async (transaction) => {
    const userRef = doc(db, COLLECTION_NAME, userId)
    const snapshot = await transaction.get(userRef)

    if (!snapshot.exists()) {
      throw new Error('Usuario no encontrado')
    }

    const currentTries = normalizeUserTries(snapshot.data()?.tries)
    const updatedTries: UserTries = {
      ...currentTries,
      triesLeft: currentTries.triesLeft + count
    }

    transaction.update(userRef, {
      'tries.triesLeft': updatedTries.triesLeft,
      'tries.updatedAt': serverTimestamp()
    })

    return updatedTries
  })
}

type SpinResult = {
  prize: PrizeRecord | null
  triesLeft: number
}

export const spinPrizeWheel = async (userId: string): Promise<SpinResult> => {
  const prizes = await listPrizes()
  const selectedPrize = selectPrizeByOdds(prizes)
  const userRef = doc(db, COLLECTION_NAME, userId)

  const { triesLeft } = await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(userRef)
    if (!snapshot.exists()) {
      throw new Error('Usuario no encontrado')
    }
    const data = snapshot.data()
    console.log({ data })
    const currentTries = data?.tries?.triesLeft ?? 0
    if (currentTries <= 0) {
      throw new Error('Sin tiros disponibles')
    }

    const updates: Record<string, any> = {
      'tries.triesLeft': currentTries - 1,
      'tries.lastTryAt': serverTimestamp(),
      'tries.triesPlayed': (data?.tries?.triesPlayed || 0) + 1
    }

    if (selectedPrize) {
      updates['tries.prizesWon'] = arrayUnion({
        prizeId: selectedPrize.id,
        wonAt: serverTimestamp(),
        deliveredAt: null
      })
    }

    transaction.update(userRef, updates)
    return { triesLeft: currentTries - 1 }
  })

  return { prize: selectedPrize, triesLeft }
}
