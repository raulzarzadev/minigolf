import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from './firebase'

/**
 * Hace que un usuario sea administrador
 * @param userId - ID del usuario a hacer administrador
 */
export async function makeUserAdmin(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      throw new Error('Usuario no encontrado')
    }

    await updateDoc(userRef, {
      isAdmin: true
    })

    console.log(`Usuario ${userId} ahora es administrador`)
  } catch (error) {
    console.error('Error making user admin:', error)
    throw error
  }
}

/**
 * Remueve permisos de administrador de un usuario
 * @param userId - ID del usuario
 */
export async function removeUserAdmin(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      throw new Error('Usuario no encontrado')
    }

    await updateDoc(userRef, {
      isAdmin: false
    })

    console.log(`Usuario ${userId} ya no es administrador`)
  } catch (error) {
    console.error('Error removing admin privileges:', error)
    throw error
  }
}

/**
 * Lista todos los administradores
 */
export async function listAdmins(): Promise<string[]> {
  try {
    // Esta función necesitaría implementarse según tus necesidades
    // Por ahora solo retorna un array vacío
    return []
  } catch (error) {
    console.error('Error listing admins:', error)
    throw error
  }
}
