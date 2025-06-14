import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
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
    // Should render 3 hole inputs per player
    const holeLabels = screen.getAllByText(/Hoyo [1-3]/)
    expect(holeLabels).toHaveLength(6)
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
})
