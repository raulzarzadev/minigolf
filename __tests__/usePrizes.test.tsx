import { render, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { usePrizes } from '@/hooks/usePrizes'
import { listPrices, PriceRecord } from '@/lib/prices'

jest.mock('@/lib/prices', () => ({
  listPrices: jest.fn()
}))

describe('usePrizes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('organizes active prices by tier and id map', async () => {
    const mockRecords: PriceRecord[] = [
      {
        id: 'p-small-active',
        title: 'Snack Pack',
        description: 'Palomitas gratis',
        tier: 'small',
        isActive: true
      },
      {
        id: 'p-medium-inactive',
        title: 'Old Medium',
        description: 'Caducado',
        tier: 'medium',
        isActive: false
      },
      {
        id: 'p-medium-active',
        title: 'Visor',
        description: 'Acceso al visor',
        tier: 'medium',
        isActive: true
      },
      {
        id: 'p-large-active',
        title: 'Full Experience',
        description: 'Paquete completo',
        tier: 'large',
        isActive: true
      }
    ]
    ;(listPrices as jest.Mock).mockResolvedValue(mockRecords)

    const states: Array<ReturnType<typeof usePrizes>> = []

    const TestComponent = () => {
      const state = usePrizes()
      useEffect(() => {
        states.push(state)
      }, [state])
      return null
    }

    render(<TestComponent />)

    await waitFor(() => {
      expect(states[states.length - 1]?.loading).toBe(false)
    })

    const latest = states[states.length - 1]!

    expect(latest.prizes.small?.id).toBe('p-small-active')
    expect(latest.prizes.medium?.id).toBe('p-medium-active')
    expect(latest.prizes.large?.id).toBe('p-large-active')
    expect(latest.byId).toHaveProperty('p-small-active')
    expect(Object.keys(latest.byId)).toEqual(
      expect.arrayContaining([
        'p-small-active',
        'p-medium-active',
        'p-large-active'
      ])
    )
  })

  it('stops loading even if fetching prices fails', async () => {
    ;(listPrices as jest.Mock).mockRejectedValueOnce(new Error('boom'))

    const states: Array<ReturnType<typeof usePrizes>> = []

    const TestComponent = () => {
      const state = usePrizes()
      useEffect(() => {
        states.push(state)
      }, [state])
      return null
    }

    render(<TestComponent />)

    await waitFor(() => {
      expect(states[states.length - 1]?.loading).toBe(false)
    })

    const latest = states[states.length - 1]!
    expect(latest.prizes.small).toBeUndefined()
    expect(latest.byId).toEqual({})
  })
})
