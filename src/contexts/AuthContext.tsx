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
    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          if (firebaseUser) {
            setFirebaseUser(firebaseUser)

            // Get user data from Firestore
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
            if (userDoc.exists()) {
              const userData = userDoc.data()
              setUser({
                id: firebaseUser.uid,
                name: userData.name,
                email: userData.email,
                createdAt: userData.createdAt.toDate(),
                gamesPlayed: userData.gamesPlayed || 0,
                averageScore: userData.averageScore || 0
              })
            }
          } else {
            setFirebaseUser(null)
            setUser(null)
          }
          setFirebaseError(null)
        } catch (error) {
          console.error('Error in auth state change:', error)
          setFirebaseError(
            error instanceof Error ? error.message : 'Error de autenticación'
          )
        } finally {
          setLoading(false)
        }
      })

      return () => unsubscribe()
    } catch (error) {
      console.error('Error initializing Firebase auth:', error)
      setFirebaseError(
        error instanceof Error
          ? error.message
          : 'Error de configuración de Firebase'
      )
      setLoading(false)
    }
  }, [])

  const signInWithGoogle = async () => {
    try {
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
          averageScore: 0
        }
        await setDoc(doc(db, 'users', result.user.uid), userData)
      }
    } catch (error) {
      console.error('Error signing in with Google:', error)
      throw error
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
