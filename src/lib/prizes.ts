import {
  addDoc,
  collection,
  DocumentSnapshot,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  QueryDocumentSnapshot,
  query,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { PrizeTier } from '@/types/rewards'

const COLLECTION_NAME = 'prizes'
const prizesCollection = collection(db, COLLECTION_NAME)

const toDate = (value: any) => {
  if (!value) return undefined
  if (typeof value.toDate === 'function') {
    return value.toDate()
  }
  if (value instanceof Date) {
    return value
  }
  return undefined
}

export interface PrizeRecord {
  id: string
  title: string
  description: string
  tier: PrizeTier | 'bonus' // prize level
  odds?: number // chance of winning
  stock?: number // available stock
  imageUrl?: string
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

export type PrizePayload = {
  title: string
  description: string
  tier: PrizeTier | 'bonus' // prize level
  odds?: number // chance of winning
  stock?: number // available stock
  imageUrl?: string
  isActive?: boolean
}

const mapPrizeDoc = (snapshot: DocumentSnapshot | QueryDocumentSnapshot) => {
  const data = snapshot.data() as Record<string, any> | undefined
  if (!data) {
    return null
  }

  return {
    id: snapshot.id,
    title: data.title ?? 'Premio sin nombre',
    description: data.description ?? '',
    tier: data.tier ?? 'small',
    odds: typeof data.odds === 'number' ? data.odds : undefined,
    stock: typeof data.stock === 'number' ? data.stock : undefined,
    imageUrl: data.imageUrl || undefined,
    isActive: data.isActive ?? true,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt)
  } as PrizeRecord
}

export const listPrizes = async (): Promise<PrizeRecord[]> => {
  const q = query(prizesCollection, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs
    .map((docSnap) => mapPrizeDoc(docSnap))
    .filter((item): item is PrizeRecord => Boolean(item))
}

export const getPrizeById = async (
  prizeId: string
): Promise<PrizeRecord | null> => {
  const snap = await getDoc(doc(db, COLLECTION_NAME, prizeId))
  return mapPrizeDoc(snap)
}

export const createPrize = async (
  payload: PrizePayload
): Promise<PrizeRecord | null> => {
  const docRef = await addDoc(prizesCollection, {
    ...payload,
    isActive: payload.isActive ?? true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  const snap = await getDoc(docRef)
  return mapPrizeDoc(snap)
}

export const updatePrize = async (
  prizeId: string,
  updates: PrizePayload
): Promise<PrizeRecord | null> => {
  const docRef = doc(db, COLLECTION_NAME, prizeId)
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp()
  })
  const snap = await getDoc(docRef)
  return mapPrizeDoc(snap)
}

export const deletePrize = async (prizeId: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION_NAME, prizeId))
}

export const selectPrizeByOdds = (
  prizes: PrizeRecord[],
  randomValue = Math.random()
): PrizeRecord | null => {
  const activePrizes = prizes.filter(
    (prize) =>
      prize.isActive && typeof prize.odds === 'number' && prize.odds > 0
  )

  if (activePrizes.length === 0) {
    return null
  }

  const totalWeight = activePrizes.reduce(
    (sum, prize) => sum + (prize.odds ?? 0),
    0
  )

  if (totalWeight <= 0) {
    return null
  }

  const threshold = randomValue * totalWeight
  let cumulative = 0

  for (const prize of activePrizes) {
    cumulative += prize.odds ?? 0
    if (threshold <= cumulative) {
      return prize
    }
  }

  return null
}
