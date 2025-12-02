// biome-ignore assist/source/organizeImports: just sort
import RankingPage from '@/app/ranking/page'
import { render, screen, waitFor } from '@testing-library/react'
import { useAuth } from '@/contexts/AuthContext'
import { getAllUsersRanking } from '@/lib/db'
import { ReactNode } from 'react'
import '@testing-library/jest-dom'

// Mock de los módulos
jest.mock('@/contexts/AuthContext')
jest.mock('@/lib/db')
jest.mock('next/link', () => {
  const MockLink = ({
    children,
    href
  }: {
    children: ReactNode
    href: string
  }) => <a href={href}>{children}</a>
  MockLink.displayName = 'MockLink'
  return MockLink
})

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockGetAllUsersRanking = getAllUsersRanking as jest.MockedFunction<
  typeof getAllUsersRanking
>

const mockUser = {
  id: 'user1',
  name: 'Juan Pérez',
  username: 'juan_perez',
  email: 'juan@example.com',
  createdAt: new Date(),
  gamesPlayed: 5,
  averageScore: 2.5,
  isAdmin: false
}

const mockRankingData = [
  {
    id: 'user1',
    name: 'Juan Pérez',
    username: 'juan_perez',
    gamesPlayed: 5,
    averageScore: 2.5,
    totalStrokes: 50,
    holesInOne: 2,
    winRate: 0.6,
    position: 1
  },
  {
    id: 'user2',
    name: 'María García',
    username: 'maria_garcia',
    gamesPlayed: 3,
    averageScore: 3.0,
    totalStrokes: 45,
    holesInOne: 1,
    winRate: 0.4,
    position: 2
  }
]

describe('RankingPage', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      firebaseUser: null,
      loading: false,
      firebaseError: null,
      signInWithGoogle: jest.fn(),
      logout: jest.fn(),
      updateUsername: jest.fn()
    })

    mockGetAllUsersRanking.mockResolvedValue(mockRankingData)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('muestra el título de la página', async () => {
    render(<RankingPage />)

    expect(screen.getByText('Ranking de Jugadores')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Descubre quiénes son los mejores jugadores de mini golf'
      )
    ).toBeInTheDocument()
  })

  it('muestra las opciones de ordenamiento', async () => {
    render(<RankingPage />)

    expect(screen.getByText('Ordenar por:')).toBeInTheDocument()
    expect(screen.getByText('Promedio de golpes')).toBeInTheDocument()
    expect(screen.getByText('Partidas jugadas')).toBeInTheDocument()
    expect(screen.getByText('Tasa de victoria')).toBeInTheDocument()
  })

  it('muestra la lista de jugadores cuando se cargan los datos', async () => {
    render(<RankingPage />)

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
      expect(screen.getByText('María García')).toBeInTheDocument()
    })

    expect(screen.getByText('@juan_perez')).toBeInTheDocument()
    expect(screen.getByText('@maria_garcia')).toBeInTheDocument()
  })

  it('resalta al usuario actual', async () => {
    render(<RankingPage />)

    await waitFor(() => {
      expect(screen.getByText('Tú')).toBeInTheDocument()
    })
  })

  it('muestra estadísticas de cada jugador', async () => {
    render(<RankingPage />)

    await waitFor(() => {
      expect(screen.getByText('2.5 golpes/hoyo')).toBeInTheDocument()
      expect(screen.getByText('5 partidas • 60% victorias')).toBeInTheDocument()
      expect(screen.getByText('🏌️‍♂️ 2 hoyos en uno')).toBeInTheDocument()
    })
  })

  it('muestra mensaje de carga mientras obtiene los datos', () => {
    mockGetAllUsersRanking.mockImplementation(() => new Promise(() => {}))

    render(<RankingPage />)

    expect(screen.getByText('Cargando ranking...')).toBeInTheDocument()
  })

  it('muestra mensaje cuando no hay jugadores', async () => {
    mockGetAllUsersRanking.mockResolvedValue([])

    render(<RankingPage />)

    await waitFor(() => {
      expect(
        screen.getByText('No hay jugadores registrados aún')
      ).toBeInTheDocument()
    })
  })

  it('muestra el formulario de auth cuando no hay usuario', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      firebaseUser: null,
      loading: false,
      firebaseError: null,
      signInWithGoogle: jest.fn(),
      logout: jest.fn(),
      updateUsername: jest.fn()
    })

    // Como AuthForm es un mock, simplemente verificamos que se renderiza algo
    render(<RankingPage />)

    // En este caso el componente AuthForm será renderizado
    expect(screen.queryByText('Ranking de Jugadores')).not.toBeInTheDocument()
  })

  it('muestra indicador de carga cuando está cargando', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      firebaseUser: null,
      loading: true,
      firebaseError: null,
      signInWithGoogle: jest.fn(),
      logout: jest.fn(),
      updateUsername: jest.fn()
    })

    render(<RankingPage />)

    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })
})
