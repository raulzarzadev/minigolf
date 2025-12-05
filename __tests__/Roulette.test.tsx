import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

import { Roulette } from '@/components/roulette/roulette'
import { PrizeRecord } from '@/lib/prizes'

const buildPrize = (overrides: Partial<PrizeRecord> = {}): PrizeRecord => ({
  id: 'default-id',
  title: 'Premio demo',
  description: 'Demo description',
  tier: 'small',
  odds: 10,
  stock: 1,
  imageUrl: undefined,
  isActive: true,
  createdAt: undefined,
  updatedAt: undefined,
  ...overrides
})

const demoPrizes: PrizeRecord[] = [
  buildPrize({ id: 'p-small', title: 'Premio chico', tier: 'small', odds: 15 }),
  buildPrize({
    id: 'p-medium',
    title: 'Premio mediano',
    tier: 'medium',
    odds: 10
  }),
  buildPrize({ id: 'p-large', title: 'Premio grande', tier: 'large', odds: 5 })
]

describe('Roulette component', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('delivers the winning prize through onResult when the wheel stops on that segment', async () => {
    const onResult = jest.fn()
    const randomSpy = jest
      .spyOn(global.Math, 'random')
      .mockReturnValueOnce(0.05)
      .mockReturnValue(0)

    render(<Roulette prizes={demoPrizes} onResult={onResult} spinTime={200} />)

    fireEvent.click(screen.getByRole('button', { name: /girar/i }))

    await act(async () => {
      jest.advanceTimersByTime(220)
    })

    await waitFor(() => {
      expect(onResult).toHaveBeenCalledTimes(1)
    })

    expect(onResult).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'p-small', title: 'Premio chico' })
    )

    randomSpy.mockRestore()
  })

  it('calls onResult with null when the wheel lands on the no-prize segment', async () => {
    const onResult = jest.fn()
    const randomSpy = jest
      .spyOn(global.Math, 'random')
      .mockReturnValueOnce(0.95)
      .mockReturnValue(0)

    render(<Roulette prizes={demoPrizes} onResult={onResult} spinTime={200} />)

    fireEvent.click(screen.getByRole('button', { name: /girar/i }))

    await act(async () => {
      jest.advanceTimersByTime(220)
    })

    await waitFor(() => {
      expect(onResult).toHaveBeenCalledWith(null)
    })

    randomSpy.mockRestore()
  })
})
