import React from 'react'
import { render, screen } from '@testing-library/react'
import Scorecard from '@/components/Scorecard'
import { Game, Player } from '@/types'

// Mock db functions
jest.mock('@/lib/db', () => ({
  updatePlayerScore: jest.fn(),
  calculateGameStats: (scores: number[]) => ({
    totalStrokes: scores.reduce((a, c) => a + c, 0),
    averagePerHole: scores.length
      ? scores.reduce((a, c) => a + c, 0) / scores.length
      : 0,
    bestHole: Math.min(...scores),
    worstHole: Math.max(...scores),
    holesInOne: scores.filter((s) => s === 1).length
  }),
  updateGame: jest.fn()
}))

describe('Scorecard component', () => {
  const players: Player[] = [
    { id: 'p1', name: 'Alice', userId: 'u1', isGuest: false },
    { id: 'p2', name: 'Bob', userId: 'u2', isGuest: true }
  ]
  const game: Game = {
    id: 'g1',
    createdBy: 'u1',
    createdAt: new Date(),
    holeCount: 3,
    players,
    scores: { p1: [0, 0, 0], p2: [0, 0, 0] },
    status: 'in_progress',
    tournamentId: null,
    isMultiplayer: true,
    currentHole: 1
  }

  it('renders game info and holes', () => {
    render(<Scorecard game={game} canEdit={false} />)
    expect(screen.getByText('Partida Multijugador')).toBeInTheDocument()
    expect(screen.getByText('3 hoyos • 2 jugadores')).toBeInTheDocument()

    // Verificar que se muestren los nombres de los jugadores
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('shows disabled inputs when cannot edit', () => {
    render(<Scorecard game={game} canEdit={false} />)
    // No + buttons
    expect(screen.queryByRole('button', { name: '+' })).toBeNull()
  })

  it('shows edit buttons when canEdit is true', () => {
    render(<Scorecard game={game} canEdit={true} currentPlayer={players[0]} />)
    const plusButtons = screen.getAllByRole('button', { name: '' })
    expect(plusButtons.length).toBeGreaterThan(0)
  })

  // Nuevas pruebas UX/UI
  it('displays player scores correctly', () => {
    const gameWithScores: Game = {
      ...game,
      scores: { p1: [2, 3, 1], p2: [4, 2, 5] }
    }

    render(<Scorecard game={gameWithScores} canEdit={false} />)

    // Verificar que el total de golpes se calcule correctamente usando selectores más específicos
    const aliceScoreElements = screen.getAllByText('6')
    expect(aliceScoreElements.length).toBeGreaterThan(0) // Alice total
    const bobScoreElements = screen.getAllByText('11')
    expect(bobScoreElements.length).toBeGreaterThan(0) // Bob total
  })

  it('shows game status correctly', () => {
    render(<Scorecard game={game} canEdit={false} />)

    // El componente debería mostrar información del estado del juego
    expect(screen.getByText('Partida Multijugador')).toBeInTheDocument()
    expect(screen.getByText('3 hoyos • 2 jugadores')).toBeInTheDocument()
    expect(screen.getByText('En progreso')).toBeInTheDocument()
  })

  it('handles player interaction correctly when editable', async () => {
    render(<Scorecard game={game} canEdit={true} currentPlayer={players[0]} />)

    // Buscar botones de edición (+ y -)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)

    // Verificar que hay indicador de editable usando getAllByText para múltiples elementos
    const editableElements = screen.getAllByText('Editable')
    expect(editableElements.length).toBeGreaterThan(0)
  })

  it('displays correct hole count and progress', () => {
    render(<Scorecard game={game} canEdit={false} />)

    // Verificar que se muestren todos los hoyos - simplificar la prueba
    expect(screen.getByText('1 de 3')).toBeInTheDocument() // Progreso de hoyo
    expect(screen.getByText('Hoyo 1')).toBeInTheDocument() // Hoyo actual

    // Verificar progreso
    expect(screen.getByText('Progreso')).toBeInTheDocument()
    expect(screen.getByText('1 de 3')).toBeInTheDocument()
  })

  it('shows appropriate UI for guest vs registered players', () => {
    render(<Scorecard game={game} canEdit={false} />)

    // Verificar que se muestren ambos tipos de jugadores
    expect(screen.getByText('Alice')).toBeInTheDocument() // Usuario registrado
    expect(screen.getByText('Bob')).toBeInTheDocument() // Usuario invitado
    expect(screen.getByText('Usuario registrado')).toBeInTheDocument()
    expect(screen.getByText('Invitado')).toBeInTheDocument()
  })
})
