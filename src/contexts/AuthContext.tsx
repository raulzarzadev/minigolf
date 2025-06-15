'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { User } from '@/types'

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  firebaseError: string | null
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
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
              setUser({
                id: firebaseUser.uid,
                name: userData.name,
                email: userData.email,
                createdAt: userData.createdAt.toDate(),
                gamesPlayed: userData.gamesPlayed || 0,
                averageScore: userData.averageScore || 0,
                isAdmin: userData.isAdmin || false
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
        const userData: Omit<User, 'id'> = {
          name: result.user.displayName || 'Usuario',
          email: result.user.email || '',
          createdAt: new Date(),
          gamesPlayed: 0,
          averageScore: 0,
          isAdmin: false
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
          email: userData.email,
          createdAt: userData.createdAt.toDate(),
          gamesPlayed: userData.gamesPlayed || 0,
          averageScore: userData.averageScore || 0,
          isAdmin: userData.isAdmin || false
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

  const value = {
    user,
    firebaseUser,
    loading,
    firebaseError,
    signInWithGoogle,
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
