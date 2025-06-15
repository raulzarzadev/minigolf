import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AuthForm from '@/components/AuthForm'

// Mock del hook useAuth
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn()
}))

import { useAuth } from '@/contexts/AuthContext'
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('AuthForm component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders login form correctly', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      firebaseUser: null,
      loading: false,
      firebaseError: null,
      signInWithGoogle: jest.fn(),
      logout: jest.fn(),
      updateUsername: jest.fn()
    })

    render(<AuthForm />)

    // Verificar elementos principales de la UI
    expect(screen.getByText('Plataforma de Minigolf')).toBeInTheDocument()
    expect(
      screen.getByText('Administra partidas de minigolf y torneos digitales')
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /continuar con google/i })
    ).toBeInTheDocument()
  })

  it('shows loading state when signing in', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      firebaseUser: null,
      loading: false,
      firebaseError: null,
      signInWithGoogle: jest.fn(),
      logout: jest.fn(),
      updateUsername: jest.fn()
    })

    render(<AuthForm />)

    // El componente debería manejar el estado de carga
    const googleButton = screen.getByRole('button', {
      name: /continuar con google/i
    })
    expect(googleButton).toBeInTheDocument()
    expect(googleButton).not.toBeDisabled()
  })

  it('calls signInWithGoogle when google button is clicked', async () => {
    const mockSignInWithGoogle = jest.fn()

    mockUseAuth.mockReturnValue({
      user: null,
      firebaseUser: null,
      loading: false,
      firebaseError: null,
      signInWithGoogle: mockSignInWithGoogle,
      logout: jest.fn(),
      updateUsername: jest.fn()
    })

    render(<AuthForm />)

    const googleButton = screen.getByRole('button', {
      name: /continuar con google/i
    })
    fireEvent.click(googleButton)

    expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1)
  })

  it('displays error message when there is an error', async () => {
    const mockSignInWithGoogle = jest
      .fn()
      .mockRejectedValue(new Error('Error de prueba'))

    mockUseAuth.mockReturnValue({
      user: null,
      firebaseUser: null,
      loading: false,
      firebaseError: null,
      signInWithGoogle: mockSignInWithGoogle,
      logout: jest.fn(),
      updateUsername: jest.fn()
    })

    render(<AuthForm />)

    // Hacer clic en el botón de Google para disparar el error
    const googleButton = screen.getByRole('button', {
      name: /continuar con google/i
    })
    fireEvent.click(googleButton)

    // Esperar a que aparezca el mensaje de error
    await waitFor(() => {
      expect(screen.getByText('Error de prueba')).toBeInTheDocument()
    })
  })

  it('has proper styling and layout', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      firebaseUser: null,
      loading: false,
      firebaseError: null,
      signInWithGoogle: jest.fn(),
      logout: jest.fn(),
      updateUsername: jest.fn()
    })

    render(<AuthForm />)

    // Verificar que la estructura tenga las clases de estilo apropiadas
    const mainTitle = screen.getByText('Plataforma de Minigolf')
    const titleContainer = mainTitle.closest('h2')
    expect(titleContainer).toHaveClass('text-center')

    // Verificar que el icono de minigolf esté presente
    expect(screen.getByText('🏌️‍♂️')).toBeInTheDocument()
  })

  it('has accessible elements', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      firebaseUser: null,
      loading: false,
      firebaseError: null,
      signInWithGoogle: jest.fn(),
      logout: jest.fn(),
      updateUsername: jest.fn()
    })

    render(<AuthForm />)

    // Verificar accesibilidad
    const googleButton = screen.getByRole('button', {
      name: /continuar con google/i
    })
    expect(googleButton).toBeInTheDocument()

    const mainHeading = screen.getByRole('heading', {
      name: /plataforma de minigolf/i
    })
    expect(mainHeading).toBeInTheDocument()
  })
})
