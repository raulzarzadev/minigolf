import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  where
} from 'firebase/firestore'
import { normalizeUserTiradas } from '@/lib/db'
import { AdminGame, AdminStats, AdminUser } from '@/types'
import { db } from './firebase'

export async function getAdminStats(): Promise<AdminStats> {
  try {
    console.log('getAdminStats: Starting...')

    // Get total users
    console.log('getAdminStats: Fetching users...')
    const usersQuery = query(collection(db, 'users'))
    const usersSnapshot = await getDocs(usersQuery)
    const totalUsers = usersSnapshot.size
    console.log('getAdminStats: Total users:', totalUsers)

    // Get total games
    console.log('getAdminStats: Fetching games...')
    const gamesQuery = query(collection(db, 'games'))
    const gamesSnapshot = await getDocs(gamesQuery)
    const totalGames = gamesSnapshot.size
    console.log('getAdminStats: Total games:', totalGames)

    // Get total tournaments
    console.log('getAdminStats: Fetching tournaments...')
    const tournamentsQuery = query(collection(db, 'tournaments'))
    const tournamentsSnapshot = await getDocs(tournamentsQuery)
    const totalTournaments = tournamentsSnapshot.size
    console.log('getAdminStats: Total tournaments:', totalTournaments)

    // Get active games
    console.log('getAdminStats: Fetching active games...')
    const activeGamesQuery = query(
      collection(db, 'games'),
      where('status', '==', 'in_progress')
    )
    const activeGamesSnapshot = await getDocs(activeGamesQuery)
    const activeGames = activeGamesSnapshot.size
    console.log('getAdminStats: Active games:', activeGames)

    // Get today's games
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayGamesQuery = query(
      collection(db, 'games'),
      where('createdAt', '>=', Timestamp.fromDate(today))
    )
    const todayGamesSnapshot = await getDocs(todayGamesQuery)
    const todayGames = todayGamesSnapshot.size

    // Get this week's games
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const weeklyGamesQuery = query(
      collection(db, 'games'),
      where('createdAt', '>=', Timestamp.fromDate(weekStart))
    )
    const weeklyGamesSnapshot = await getDocs(weeklyGamesQuery)
    const weeklyGames = weeklyGamesSnapshot.size

    // Get this month's games
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    const monthlyGamesQuery = query(
      collection(db, 'games'),
      where('createdAt', '>=', Timestamp.fromDate(monthStart))
    )
    const monthlyGamesSnapshot = await getDocs(monthlyGamesQuery)
    const monthlyGames = monthlyGamesSnapshot.size

    const result = {
      totalUsers,
      totalGames,
      totalTournaments,
      activeGames,
      todayGames,
      weeklyGames,
      monthlyGames
    }

    console.log('getAdminStats: Final result:', result)
    return result
  } catch (error) {
    console.error('Error getting admin stats:', error)
    throw error
  }
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  try {
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc')
    )
    const usersSnapshot = await getDocs(usersQuery)

    const users: AdminUser[] = []

    for (const doc of usersSnapshot.docs) {
      const userData = doc.data()

      // Get user's game history
      const userGamesQuery = query(
        collection(db, 'games'),
        where('createdBy', '==', doc.id),
        where('status', '==', 'finished'),
        orderBy('finishedAt', 'desc'),
        limit(10)
      )
      const userGamesSnapshot = await getDocs(userGamesQuery)

      const gameHistory = userGamesSnapshot.docs.map((gameDoc) => {
        const gameData = gameDoc.data()
        let totalStrokes = 0

        if (gameData.scores && typeof gameData.scores === 'object') {
          Object.values(gameData.scores).forEach((scores) => {
            if (Array.isArray(scores)) {
              totalStrokes += scores.reduce((a: number, b: number) => a + b, 0)
            }
          })
        }

        return {
          gameId: gameDoc.id,
          finishedAt: gameData.finishedAt?.toDate
            ? gameData.finishedAt.toDate()
            : new Date(),
          totalStrokes
        }
      })

      const adminUser: AdminUser = {
        id: doc.id,
        name: userData.name || '',
        username: userData.username || '',
        email: userData.email || '',
        createdAt: userData.createdAt?.toDate
          ? userData.createdAt.toDate()
          : new Date(),
        gamesPlayed: userData.gamesPlayed || 0,
        averageScore: userData.averageScore || 0,
        tiradas: normalizeUserTiradas(userData.tiradas ?? userData.shots),
        isAdmin: userData.isAdmin || false,
        lastLoginAt: userData.lastLoginAt?.toDate
          ? userData.lastLoginAt.toDate()
          : undefined,
        isActive: userData.lastLoginAt
          ? Date.now() - userData.lastLoginAt.toDate().getTime() <
            30 * 24 * 60 * 60 * 1000 // Active if logged in within 30 days
          : false,
        gameHistory
      }

      users.push(adminUser)
    }

    return users
  } catch (error) {
    console.error('Error getting admin users:', error)
    throw error
  }
}

export async function getAdminGames(): Promise<AdminGame[]> {
  try {
    const gamesQuery = query(
      collection(db, 'games'),
      orderBy('createdAt', 'desc'),
      limit(100) // Limit to last 100 games for performance
    )
    const gamesSnapshot = await getDocs(gamesQuery)

    const games: AdminGame[] = gamesSnapshot.docs.map((doc) => {
      const gameData = doc.data()

      // Calculate average score
      const allScores = Object.values(gameData.scores || {}).flat() as number[]
      const averageScore =
        allScores.length > 0
          ? allScores.reduce((a, b) => a + b, 0) / allScores.length
          : 0

      // Calculate duration if finished
      let duration: number | undefined
      if (
        gameData.status === 'finished' &&
        gameData.finishedAt &&
        gameData.createdAt
      ) {
        const start = gameData.createdAt.toDate
          ? gameData.createdAt.toDate()
          : new Date(gameData.createdAt)
        const end = gameData.finishedAt.toDate
          ? gameData.finishedAt.toDate()
          : new Date(gameData.finishedAt)
        duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60)) // minutes
      }

      const adminGame: AdminGame = {
        id: doc.id,
        createdBy: gameData.createdBy || '',
        createdAt: gameData.createdAt?.toDate
          ? gameData.createdAt.toDate()
          : new Date(),
        holeCount: gameData.holeCount || 18,
        players: gameData.players || [],
        scores: gameData.scores || {},
        status: gameData.status || 'in_progress',
        tournamentId: gameData.tournamentId,
        isMultiplayer: gameData.isMultiplayer || false,
        currentHole: gameData.currentHole || 1,
        finishedAt: gameData.finishedAt?.toDate
          ? gameData.finishedAt.toDate()
          : undefined,
        duration,
        averageScore,
        playerCount: (gameData.players || []).length
      }

      return adminGame
    })

    return games
  } catch (error) {
    console.error('Error getting admin games:', error)
    throw error
  }
}

export async function deleteUser(userId: string): Promise<void> {
  // TODO: Implement user deletion with cascade
  console.log('Delete user:', userId)
}

export async function deleteGame(gameId: string): Promise<void> {
  // TODO: Implement game deletion
  console.log('Delete game:', gameId)
}

export async function banUser(userId: string): Promise<void> {
  // TODO: Implement user banning
  console.log('Ban user:', userId)
}
