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
  onSnapshot
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Game, User, Tournament, TournamentStanding } from '@/types'

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

// Get all games where user participates (as creator or player)
export const getAllUserGames = async (userId: string): Promise<Game[]> => {
  try {
    // Get all games and filter client-side since Firestore doesn't support
    // array-contains on nested objects or OR queries across different fields efficiently
    const q = query(collection(db, 'games'), orderBy('createdAt', 'desc'))

    const querySnapshot = await getDocs(q)
    const allGames = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      finishedAt: doc.data().finishedAt?.toDate()
    })) as Game[]

    // Filter games where user is creator OR player
    return allGames.filter(
      (game) =>
        game.createdBy === userId ||
        game.players.some((player) => player.userId === userId)
    )
  } catch (error) {
    console.error('Error getting all user games:', error)
    throw error
  }
}

// Get games where user is invited as a player (not creator)
export const getInvitedGames = async (userId: string): Promise<Game[]> => {
  try {
    const q = query(collection(db, 'games'), orderBy('createdAt', 'desc'))

    const querySnapshot = await getDocs(q)
    const allGames = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      finishedAt: doc.data().finishedAt?.toDate()
    })) as Game[]

    // Filter games where user is a player but not the creator
    return allGames.filter(
      (game) =>
        game.createdBy !== userId &&
        game.players.some((player) => player.userId === userId)
    )
  } catch (error) {
    console.error('Error getting invited games:', error)
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

// Tournament Functions
export const createTournament = async (
  tournamentData: Omit<Tournament, 'id' | 'createdAt'>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'tournaments'), {
      ...tournamentData,
      createdAt: serverTimestamp()
    })
    return docRef.id
  } catch (error) {
    console.error('Error creating tournament:', error)
    throw error
  }
}

export const getTournament = async (
  tournamentId: string
): Promise<Tournament | null> => {
  try {
    const tournamentDoc = await getDoc(doc(db, 'tournaments', tournamentId))
    if (tournamentDoc.exists()) {
      const data = tournamentDoc.data()
      return {
        id: tournamentDoc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        startDate: data.startDate.toDate(),
        endDate: data.endDate.toDate()
      } as Tournament
    }
    return null
  } catch (error) {
    console.error('Error getting tournament:', error)
    throw error
  }
}

export const getTournaments = async (
  status?: 'upcoming' | 'active' | 'finished'
): Promise<Tournament[]> => {
  try {
    let q = query(collection(db, 'tournaments'), orderBy('startDate', 'desc'))

    if (status) {
      q = query(
        collection(db, 'tournaments'),
        where('status', '==', status),
        orderBy('startDate', 'desc')
      )
    }

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      startDate: doc.data().startDate.toDate(),
      endDate: doc.data().endDate.toDate()
    })) as Tournament[]
  } catch (error) {
    console.error('Error getting tournaments:', error)
    throw error
  }
}

export const joinTournament = async (
  tournamentId: string,
  userId: string
): Promise<void> => {
  try {
    const tournamentRef = doc(db, 'tournaments', tournamentId)
    const tournamentDoc = await getDoc(tournamentRef)

    if (tournamentDoc.exists()) {
      const tournament = tournamentDoc.data() as Tournament
      if (!tournament.participants.includes(userId)) {
        await updateDoc(tournamentRef, {
          participants: [...tournament.participants, userId]
        })
      }
    }
  } catch (error) {
    console.error('Error joining tournament:', error)
    throw error
  }
}

export const leaveTournament = async (
  tournamentId: string,
  userId: string
): Promise<void> => {
  try {
    const tournamentRef = doc(db, 'tournaments', tournamentId)
    const tournamentDoc = await getDoc(tournamentRef)

    if (tournamentDoc.exists()) {
      const tournament = tournamentDoc.data() as Tournament
      const updatedParticipants = tournament.participants.filter(
        (id) => id !== userId
      )
      await updateDoc(tournamentRef, {
        participants: updatedParticipants
      })
    }
  } catch (error) {
    console.error('Error leaving tournament:', error)
    throw error
  }
}

export const updateTournamentStatus = async (
  tournamentId: string,
  status: Tournament['status']
): Promise<void> => {
  try {
    const tournamentRef = doc(db, 'tournaments', tournamentId)
    await updateDoc(tournamentRef, { status })
  } catch (error) {
    console.error('Error updating tournament status:', error)
    throw error
  }
}

export const calculateTournamentLeaderboard = async (
  tournamentId: string
): Promise<TournamentStanding[]> => {
  try {
    const tournament = await getTournament(tournamentId)
    if (!tournament) throw new Error('Tournament not found')

    const tournamentGames = await Promise.all(
      tournament.games.map((gameId) => getGame(gameId))
    )

    const participantStats = new Map<
      string,
      {
        gamesPlayed: number
        totalStrokes: number
        userName: string
      }
    >()

    // Initialize stats for all participants
    for (const userId of tournament.participants) {
      // You'd need a getUserById function here
      participantStats.set(userId, {
        gamesPlayed: 0,
        totalStrokes: 0,
        userName: userId // Replace with actual user name lookup
      })
    }

    // Calculate stats from completed games
    tournamentGames.forEach((game) => {
      if (!game || game.status !== 'finished') return

      game.players.forEach((player) => {
        if (player.userId && tournament.participants.includes(player.userId)) {
          const scores = game.scores[player.id] || []
          const totalStrokes = scores.reduce((sum, score) => sum + score, 0)

          const stats = participantStats.get(player.userId)
          if (stats) {
            stats.gamesPlayed++
            stats.totalStrokes += totalStrokes
            stats.userName = player.name
          }
        }
      })
    })

    // Convert to leaderboard format and sort
    const leaderboard: TournamentStanding[] = Array.from(
      participantStats.entries()
    )
      .map(([userId, stats]) => ({
        userId,
        userName: stats.userName,
        gamesPlayed: stats.gamesPlayed,
        totalStrokes: stats.totalStrokes,
        averageScore:
          stats.gamesPlayed > 0 ? stats.totalStrokes / stats.gamesPlayed : 0,
        position: 0, // Will be set after sorting
        points: calculateTournamentPoints(stats.gamesPlayed, stats.totalStrokes)
      }))
      .filter((standing) => standing.gamesPlayed > 0)
      .sort((a, b) => {
        if (a.gamesPlayed !== b.gamesPlayed) {
          return b.gamesPlayed - a.gamesPlayed // More games played is better
        }
        return a.averageScore - b.averageScore // Lower average is better
      })

    // Set positions
    leaderboard.forEach((standing, index) => {
      standing.position = index + 1
    })

    return leaderboard
  } catch (error) {
    console.error('Error calculating tournament leaderboard:', error)
    throw error
  }
}

const calculateTournamentPoints = (
  gamesPlayed: number,
  totalStrokes: number
): number => {
  // Simple points system: 10 points per game played, bonus for low average
  const basePoints = gamesPlayed * 10
  const averageScore = gamesPlayed > 0 ? totalStrokes / gamesPlayed : 0
  const bonusPoints = Math.max(0, (4 - averageScore) * 5) // Bonus for average under 4
  return Math.round(basePoints + bonusPoints)
}

// User management functions
export const createOrUpdateUser = async (userData: {
  id: string
  name: string
  email: string
}): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userData.id)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      // Update existing user
      await updateDoc(userRef, {
        name: userData.name,
        email: userData.email
      })
    } else {
      // Create new user
      await updateDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
        gamesPlayed: 0,
        averageScore: 0
      })
    }
  } catch (error) {
    console.error('Error creating/updating user:', error)
    throw error
  }
}

export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    if (userDoc.exists()) {
      const data = userDoc.data()
      return {
        id: userDoc.id,
        ...data,
        createdAt: data.createdAt.toDate()
      } as User
    }
    return null
  } catch (error) {
    console.error('Error getting user by ID:', error)
    throw error
  }
}

// Calculate comprehensive user statistics including invited games
export const calculateUserStats = async (userId: string) => {
  try {
    const allGames = await getAllUserGames(userId)
    const finishedGames = allGames.filter((game) => game.status === 'finished')

    let totalStrokes = 0
    let gamesCompleted = 0
    let holesInOne = 0

    finishedGames.forEach((game) => {
      const playerScores = game.scores[userId]
      if (playerScores && playerScores.length > 0) {
        const gameTotal = playerScores.reduce((sum, score) => sum + score, 0)
        if (gameTotal > 0) {
          // Only count games where user actually played
          totalStrokes += gameTotal
          gamesCompleted++
          holesInOne += playerScores.filter((score) => score === 1).length
        }
      }
    })

    return {
      gamesPlayed: gamesCompleted,
      totalStrokes,
      averageScore:
        gamesCompleted > 0
          ? Math.round((totalStrokes / gamesCompleted) * 100) / 100
          : 0,
      holesInOne,
      gamesCreated: allGames.filter((game) => game.createdBy === userId).length,
      gamesAsGuest: allGames.filter((game) => game.createdBy !== userId).length
    }
  } catch (error) {
    console.error('Error calculating user stats:', error)
    return {
      gamesPlayed: 0,
      totalStrokes: 0,
      averageScore: 0,
      holesInOne: 0,
      gamesCreated: 0,
      gamesAsGuest: 0
    }
  }
}
