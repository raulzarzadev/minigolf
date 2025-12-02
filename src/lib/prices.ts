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
import { PrizeTier } from '@/lib/rewards'

const COLLECTION_NAME = 'prices'
const pricesCollection = collection(db, COLLECTION_NAME)

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

export interface PriceRecord {
  id: string
  title: string
  description: string
  tier: PrizeTier | 'bonus'
  odds?: number
  stock?: number
  imageUrl?: string
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

export type PricePayload = {
  title: string
  description: string
  tier: PrizeTier | 'bonus'
  odds?: number
  stock?: number
  imageUrl?: string
  isActive?: boolean
}

const mapPriceDoc = (snapshot: DocumentSnapshot | QueryDocumentSnapshot) => {
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
  } as PriceRecord
}

export const listPrices = async (): Promise<PriceRecord[]> => {
  const q = query(pricesCollection, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs
    .map((docSnap) => mapPriceDoc(docSnap))
    .filter((item): item is PriceRecord => Boolean(item))
}

export const getPriceById = async (
  priceId: string
): Promise<PriceRecord | null> => {
  const snap = await getDoc(doc(db, COLLECTION_NAME, priceId))
  return mapPriceDoc(snap)
}

export const createPrice = async (
  payload: PricePayload
): Promise<PriceRecord | null> => {
  console.log({ payload })
  const docRef = await addDoc(pricesCollection, {
    ...payload,
    isActive: payload.isActive ?? true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  const snap = await getDoc(docRef)
  return mapPriceDoc(snap)
}

export const updatePrice = async (
  priceId: string,
  updates: PricePayload
): Promise<PriceRecord | null> => {
  const docRef = doc(db, COLLECTION_NAME, priceId)
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp()
  })
  const snap = await getDoc(docRef)
  return mapPriceDoc(snap)
}

export const deletePrice = async (priceId: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION_NAME, priceId))
}
