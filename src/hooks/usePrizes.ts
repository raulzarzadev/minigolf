import { useEffect, useState } from 'react'
import { listPrizes, PrizeRecord } from '@/lib/prizes'

export type PrizeCatalog = PrizeRecord[]

export function usePrizes() {
  const [prizes, setPrizes] = useState<PrizeCatalog>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPrizes() {
      try {
        const allPrices = await listPrizes()
        const activePrices = allPrices.filter(
          (candidate: PrizeRecord) => candidate.isActive
        )

        setPrizes(activePrices)
      } catch (error) {
        console.error('Failed to fetch prizes', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPrizes()
  }, [])

  return { prizes, loading }
}
