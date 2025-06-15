import React from 'react'
import { render, screen } from '@testing-library/react'
import Navbar from '@/components/Navbar'

// Mock del hook useAuth
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn()
}))

// Importar el mock
import { useAuth } from '@/contexts/AuthContext'
import { User } from '@/types'
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Mock user object
const mockUser: User = {
  id: '123',
  name: 'Test User',
  email: 'test@example.com',
  createdAt: new Date(),
  gamesPlayed: 0,
  averageScore: 0,
  username: 'testuser',
  isAdmin: false
}

describe('Navbar component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders nothing when user is not logged in', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      firebaseUser: null,
      loading: false,
      firebaseError: null,
      signInWithGoogle: jest.fn(),
      logout: jest.fn(),
      updateUsername: jest.fn()
    })

    const { container } = render(<Navbar />)
    expect(container.firstChild).toBeNull()
  })

  it('renders navigation items when user is logged in', () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      firebaseUser: null,
      loading: false,
      firebaseError: null,
      signInWithGoogle: jest.fn(),
      logout: jest.fn(),
      updateUsername: jest.fn()
    })

    render(<Navbar />)

    // Verificar que se muestren los elementos de navegación
    expect(screen.getByText('Minigolf')).toBeInTheDocument()
    expect(screen.getByText('Inicio')).toBeInTheDocument()
    expect(screen.getByText('Nueva Partida')).toBeInTheDocument()
    expect(screen.getByText('Torneos')).toBeInTheDocument()
    // El perfil muestra el nombre del usuario en el enlace
    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  it('displays user information correctly', () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      firebaseUser: null,
      loading: false,
      firebaseError: null,
      signInWithGoogle: jest.fn(),
      logout: jest.fn(),
      updateUsername: jest.fn()
    })

    render(<Navbar />)

    // Verificar que se muestre la información del usuario
    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  it('has correct navigation links', () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      firebaseUser: null,
      loading: false,
      firebaseError: null,
      signInWithGoogle: jest.fn(),
      logout: jest.fn(),
      updateUsername: jest.fn()
    })

    render(<Navbar />)

    // Verificar que los enlaces tengan los href correctos
    const homeLink = screen.getByRole('link', { name: /inicio/i })
    expect(homeLink).toHaveAttribute('href', '/')

    const newGameLink = screen.getByRole('link', { name: /nueva partida/i })
    expect(newGameLink).toHaveAttribute('href', '/game/new')

    const tournamentsLink = screen.getByRole('link', { name: /torneos/i })
    expect(tournamentsLink).toHaveAttribute('href', '/tournaments')

    const profileLink = screen.getByRole('link', { name: /test user/i })
    expect(profileLink).toHaveAttribute('href', '/profile')
  })

  it('shows logout button', () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      firebaseUser: null,
      loading: false,
      firebaseError: null,
      signInWithGoogle: jest.fn(),
      logout: jest.fn(),
      updateUsername: jest.fn()
    })

    render(<Navbar />)

    // Verificar que se muestre el botón de logout
    expect(screen.getByRole('button', { name: /salir/i })).toBeInTheDocument()
  })

  it('has proper responsive design classes', () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      firebaseUser: null,
      loading: false,
      firebaseError: null,
      signInWithGoogle: jest.fn(),
      logout: jest.fn(),
      updateUsername: jest.fn()
    })

    render(<Navbar />)

    // Verificar que la navbar tenga las clases de diseño correctas
    const nav = screen.getByRole('navigation')
    expect(nav).toHaveClass('bg-green-600', 'text-white', 'shadow-lg')
  })
})
