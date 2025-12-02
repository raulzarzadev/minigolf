// Migration script to add usernames to existing users
// This should be run once to update existing users

import { collection, doc, getDocs, updateDoc } from 'firebase/firestore'
import { generateUniqueUsername } from './db'
import { db } from './firebase'

export async function migrateExistingUsers() {
  try {
    console.log('Starting user migration...')

    const usersRef = collection(db, 'users')
    const querySnapshot = await getDocs(usersRef)

    let migratedCount = 0
    let skippedCount = 0

    for (const userDoc of querySnapshot.docs) {
      const userData = userDoc.data()

      // Skip if user already has a username
      if (userData.username) {
        skippedCount++
        continue
      }

      try {
        // Generate username based on name or email
        const baseName =
          userData.name || userData.email?.split('@')[0] || 'user'
        const username = await generateUniqueUsername(baseName)

        // Update user document
        await updateDoc(doc(db, 'users', userDoc.id), {
          username: username
        })

        console.log(`✅ Updated user ${userDoc.id} with username: ${username}`)
        migratedCount++
      } catch (error) {
        console.error(`❌ Failed to migrate user ${userDoc.id}:`, error)
      }
    }

    console.log(
      `Migration completed! ${migratedCount} users migrated, ${skippedCount} users skipped`
    )
    return { migratedCount, skippedCount }
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

// Utility function to check if migration is needed
export async function checkMigrationStatus() {
  try {
    const usersRef = collection(db, 'users')
    const querySnapshot = await getDocs(usersRef)

    let totalUsers = 0
    let usersWithUsername = 0

    querySnapshot.forEach((doc) => {
      totalUsers++
      if (doc.data().username) {
        usersWithUsername++
      }
    })

    return {
      totalUsers,
      usersWithUsername,
      needsMigration: usersWithUsername < totalUsers
    }
  } catch (error) {
    console.error('Error checking migration status:', error)
    return {
      totalUsers: 0,
      usersWithUsername: 0,
      needsMigration: false
    }
  }
}
