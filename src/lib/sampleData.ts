import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

// Script para crear datos de ejemplo para el panel de administrador
export async function createSampleData() {
  try {
    console.log('Creating sample data...')

    // Crear algunos usuarios de ejemplo
    const sampleUsers = [
      {
        name: 'Juan Pérez',
        email: 'juan@example.com',
        gamesPlayed: 5,
        averageScore: 32.4,
        isAdmin: false,
        createdAt: serverTimestamp(),
        tiradas: { pendientes: 0 }
      },
      {
        name: 'María García',
        email: 'maria@example.com',
        gamesPlayed: 12,
        averageScore: 28.7,
        isAdmin: false,
        createdAt: serverTimestamp(),
        tiradas: { pendientes: 0 }
      },
      {
        name: 'Carlos López',
        email: 'carlos@example.com',
        gamesPlayed: 8,
        averageScore: 35.1,
        isAdmin: false,
        createdAt: serverTimestamp(),
        tiradas: { pendientes: 0 }
      }
    ]

    // Crear usuarios
    for (const user of sampleUsers) {
      await addDoc(collection(db, 'users'), user)
    }

    // Crear algunas partidas de ejemplo
    const sampleGames = [
      {
        createdBy: 'sample-user-1',
        holeCount: 18,
        players: [
          {
            id: 'player1',
            name: 'Juan',
            userId: 'sample-user-1',
            isGuest: false
          },
          {
            id: 'player2',
            name: 'María',
            userId: 'sample-user-2',
            isGuest: false
          }
        ],
        scores: {
          player1: [3, 4, 2, 5, 3, 4, 3, 2, 4, 3, 5, 2, 4, 3, 3, 4, 2, 3],
          player2: [2, 3, 3, 4, 2, 3, 4, 3, 3, 2, 4, 3, 3, 2, 4, 3, 3, 2]
        },
        status: 'finished',
        tournamentId: null,
        isMultiplayer: true,
        currentHole: 18,
        createdAt: serverTimestamp(),
        finishedAt: serverTimestamp()
      },
      {
        createdBy: 'sample-user-2',
        holeCount: 18,
        players: [
          {
            id: 'player3',
            name: 'Carlos',
            userId: 'sample-user-3',
            isGuest: false
          }
        ],
        scores: {
          player3: [4, 3, 3, 5, 4, 3, 2, 4, 3, 4, 3, 2, 5, 3, 4, 3, 3, 4]
        },
        status: 'in_progress',
        tournamentId: null,
        isMultiplayer: false,
        currentHole: 15,
        createdAt: serverTimestamp()
      }
    ]

    // Crear partidas
    for (const game of sampleGames) {
      await addDoc(collection(db, 'games'), game)
    }

    // Crear un torneo de ejemplo
    const sampleTournament = {
      name: 'Torneo de Primavera 2025',
      description: 'Torneo mensual de minigolf',
      season: 'Primavera 2025',
      startDate: new Date('2025-06-01'),
      endDate: new Date('2025-06-30'),
      status: 'active',
      participants: ['sample-user-1', 'sample-user-2', 'sample-user-3'],
      games: [],
      createdBy: 'admin-user',
      holeCount: 18,
      entryFee: 0,
      createdAt: serverTimestamp()
    }

    await addDoc(collection(db, 'tournaments'), sampleTournament)

    console.log('Sample data created successfully!')
  } catch (error) {
    console.error('Error creating sample data:', error)
    throw error
  }
}

// Función para limpiar datos de ejemplo
export async function clearSampleData() {
  console.log('Esta función eliminará todos los datos de ejemplo')
  // Implementar si es necesario
}
