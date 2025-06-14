import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  deleteDoc
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Game, Player, User } from '@/types'

// Games Collection Functions
export const createGame = async (
  gameData: Omit<Game, 'id' | 'createdAt'>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'games'), {
      ...gameData,
      createdAt: serverTimestamp()
    })
    return docRef.id
  } catch (error) {
    console.error('Error creating game:', error)
    throw error
  }
}

export const updateGame = async (
  gameId: string,
  updates: Partial<Game>
): Promise<void> => {
  try {
    const gameRef = doc(db, 'games', gameId)
    await updateDoc(gameRef, updates)
  } catch (error) {
    console.error('Error updating game:', error)
    throw error
  }
}

export const getGame = async (gameId: string): Promise<Game | null> => {
  try {
    const gameDoc = await getDoc(doc(db, 'games', gameId))
    if (gameDoc.exists()) {
      const data = gameDoc.data()
      return {
        id: gameDoc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        finishedAt: data.finishedAt?.toDate()
      } as Game
    }
    return null
  } catch (error) {
    console.error('Error getting game:', error)
    throw error
  }
}

export const getUserGames = async (userId: string): Promise<Game[]> => {
  try {
    const q = query(
      collection(db, 'games'),
      where('createdBy', '==', userId),
      orderBy('createdAt', 'desc')
    )

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      finishedAt: doc.data().finishedAt?.toDate()
    })) as Game[]
  } catch (error) {
    console.error('Error getting user games:', error)
    throw error
  }
}

// Real-time game updates
export const subscribeToGame = (
  gameId: string,
  callback: (game: Game | null) => void
) => {
  const gameRef = doc(db, 'games', gameId)

  return onSnapshot(gameRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data()
      const game: Game = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        finishedAt: data.finishedAt?.toDate()
      } as Game
      callback(game)
    } else {
      callback(null)
    }
  })
}

// Score management
export const updatePlayerScore = async (
  gameId: string,
  playerId: string,
  holeIndex: number,
  score: number
): Promise<void> => {
  try {
    const gameRef = doc(db, 'games', gameId)
    const gameDoc = await getDoc(gameRef)

    if (gameDoc.exists()) {
      const game = gameDoc.data() as Game
      const scores = { ...game.scores }

      // Initialize player scores if they don't exist
      if (!scores[playerId]) {
        scores[playerId] = new Array(game.holeCount).fill(0)
      }

      // Update the specific hole score
      scores[playerId][holeIndex] = score

      await updateDoc(gameRef, { scores })
    }
  } catch (error) {
    console.error('Error updating player score:', error)
    throw error
  }
}

// Finish game
export const finishGame = async (gameId: string): Promise<void> => {
  try {
    const gameRef = doc(db, 'games', gameId)
    await updateDoc(gameRef, {
      status: 'finished',
      finishedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error finishing game:', error)
    throw error
  }
}

// User management
export const searchUsers = async (searchTerm: string): Promise<User[]> => {
  try {
    // Note: Firestore doesn't support full-text search natively
    // This is a basic implementation - consider using Algolia for better search
    const q = query(
      collection(db, 'users'),
      where('name', '>=', searchTerm),
      where('name', '<=', searchTerm + '\uf8ff')
    )

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    })) as User[]
  } catch (error) {
    console.error('Error searching users:', error)
    throw error
  }
}

// Generate unique player ID for guests
export const generateGuestId = (): string => {
  return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Calculate game statistics
export const calculateGameStats = (scores: number[]) => {
  const totalStrokes = scores.reduce((sum, score) => sum + score, 0)
  const averagePerHole = totalStrokes / scores.length
  const bestHole = Math.min(...scores.filter((score) => score > 0))
  const worstHole = Math.max(...scores)
  const holesInOne = scores.filter((score) => score === 1).length

  return {
    totalStrokes,
    averagePerHole: Math.round(averagePerHole * 100) / 100,
    bestHole: bestHole === Infinity ? 0 : bestHole,
    worstHole,
    holesInOne
  }
}
