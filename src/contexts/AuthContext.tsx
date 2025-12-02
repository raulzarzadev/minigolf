'use client'

import {
  User as FirebaseUser,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { createContext, useContext, useEffect, useState } from 'react'
import { generateUniqueUsername, updateUserUsername } from '@/lib/db'
import { auth, db } from '@/lib/firebase'
import { User } from '@/types'

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  firebaseError: string | null
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  updateUsername: (newUsername: string) => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [firebaseError, setFirebaseError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          if (firebaseUser && mounted) {
            setFirebaseUser(firebaseUser)

            // Get user data from Firestore
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
            if (userDoc.exists() && mounted) {
              const userData = userDoc.data()

              // Check if user needs username migration
              if (!userData.username) {
                console.log(
                  'User needs username migration, generating username...'
                )
                const username = await generateUniqueUsername(
                  userData.name || firebaseUser.email || 'user'
                )

                // Update user document with username
                const userRef = doc(db, 'users', firebaseUser.uid)
                await updateDoc(userRef, { username })

                // Update local data
                userData.username = username
              }

              setUser({
                id: firebaseUser.uid,
                name: userData.name,
                username: userData.username,
                email: userData.email,
                createdAt: userData.createdAt.toDate(),
                gamesPlayed: userData.gamesPlayed || 0,
                averageScore: userData.averageScore || 0,
                ...userData
              })
            }
          } else if (mounted) {
            setFirebaseUser(null)
            setUser(null)
          }

          if (mounted) {
            setFirebaseError(null)
          }
        } catch (error) {
          console.error('Error in auth state change:', error)
          if (mounted) {
            setFirebaseError(
              error instanceof Error ? error.message : 'Error de autenticación'
            )
          }
        } finally {
          if (mounted) {
            setLoading(false)
          }
        }
      })

      return () => {
        mounted = false
        unsubscribe()
      }
    } catch (error) {
      console.error('Error initializing Firebase auth:', error)
      if (mounted) {
        setFirebaseError(
          error instanceof Error
            ? error.message
            : 'Error de configuración de Firebase'
        )
        setLoading(false)
      }
    }
  }, [])

  const signInWithGoogle = async () => {
    try {
      setLoading(true)
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)

      // Check if user exists in Firestore, if not create them
      const userDoc = await getDoc(doc(db, 'users', result.user.uid))
      if (!userDoc.exists()) {
        // Generate unique username
        const username = await generateUniqueUsername(
          result.user.displayName || result.user.email || 'user'
        )

        const userData: Omit<User, 'id'> = {
          name: result.user.displayName || 'Usuario',
          username: username,
          email: result.user.email || '',
          createdAt: new Date(),
          gamesPlayed: 0,
          averageScore: 0
        }
        await setDoc(doc(db, 'users', result.user.uid), userData)
      }

      // Force refresh user data after creation/login
      const updatedUserDoc = await getDoc(doc(db, 'users', result.user.uid))
      if (updatedUserDoc.exists()) {
        const userData = updatedUserDoc.data()
        setUser({
          id: result.user.uid,
          name: userData.name,
          username: userData.username,
          email: userData.email,
          createdAt: userData.createdAt.toDate(),
          gamesPlayed: userData.gamesPlayed || 0,
          averageScore: userData.averageScore || 0,
          ...userData
        })
      }

      setFirebaseUser(result.user)
    } catch (error) {
      console.error('Error signing in with Google:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  const updateUsername = async (newUsername: string) => {
    try {
      if (!user) {
        throw new Error('No hay usuario autenticado')
      }

      await updateUserUsername(user.id, newUsername)

      // Update local user state
      setUser((prev) => (prev ? { ...prev, username: newUsername } : null))
    } catch (error) {
      console.error('Error updating username:', error)
      throw error
    }
  }

  const value = {
    user,
    firebaseUser,
    loading,
    firebaseError,
    signInWithGoogle,
    logout,
    updateUsername,
    isAdmin: user?.roles?.includes('admin') || user?.isAdmin || false
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
