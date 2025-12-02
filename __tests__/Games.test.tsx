import { render, screen } from '@testing-library/react'
import React from 'react'
import GamesPage from '@/app/games/page'

// Mock del hook useAuth
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn()
}))

// Mock de la función getUserGames
jest.mock('@/lib/db', () => ({
  getUserGames: jest.fn()
}))

import { useAuth } from '@/contexts/AuthContext'
import { getUserGames } from '@/lib/db'

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockGetUserGames = getUserGames as jest.MockedFunction<
  typeof getUserGames
>

describe('GamesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders login message when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      firebaseUser: null,
      loading: false,
      firebaseError: null,
      signInWithGoogle: jest.fn(),
      logout: jest.fn(),
      updateUsername: jest.fn()
    })

    render(<GamesPage />)

    expect(screen.getByText('Debes iniciar sesión')).toBeInTheDocument()
    expect(
      screen.getByText('Inicia sesión para ver tus partidas')
    ).toBeInTheDocument()
  })

  it('renders page title when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
        gamesPlayed: 0,
        averageScore: 0,
        username: 'testuser'
      },
      firebaseUser: null,
      loading: false,
      firebaseError: null,
      signInWithGoogle: jest.fn(),
      logout: jest.fn(),
      updateUsername: jest.fn()
    })

    mockGetUserGames.mockResolvedValue([])

    render(<GamesPage />)

    expect(screen.getByText('Mis Partidas')).toBeInTheDocument()
    expect(
      screen.getByText('Historial de tus juegos de minigolf')
    ).toBeInTheDocument()
  })

  it('shows empty state when no games exist', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
        gamesPlayed: 0,
        averageScore: 0,
        username: 'testuser'
      },
      firebaseUser: null,
      loading: false,
      firebaseError: null,
      signInWithGoogle: jest.fn(),
      logout: jest.fn(),
      updateUsername: jest.fn()
    })

    mockGetUserGames.mockResolvedValue([])

    render(<GamesPage />)

    // Esperar a que se carguen los datos
    await screen.findByText('No hay partidas aún')
    expect(
      screen.getByText('¡Crea tu primera partida para empezar a jugar!')
    ).toBeInTheDocument()
    // Verificar que existe el botón "Nueva Partida" en el estado vacío (no en la navbar)
    const newGameButtons = screen.getAllByRole('link', {
      name: /nueva partida/i
    })
    expect(newGameButtons.length).toBeGreaterThan(0) // Debe haber al menos uno
  })
})
