import { useEffect, useState } from 'react'
import { listPrices, PriceRecord } from '@/lib/prices'
import { PrizeTier } from '@/types/rewards'

export type PrizeCatalog = Record<PrizeTier, PriceRecord | undefined>

export function usePrizes() {
  const [prizes, setPrizes] = useState<PrizeCatalog>({
    small: undefined,
    medium: undefined,
    large: undefined
  })
  const [loading, setLoading] = useState(true)
  const [byId, setById] = useState<Record<string, PriceRecord>>({})

  useEffect(() => {
    async function fetchPrizes() {
      try {
        const allPrices = await listPrices()
        const activePrices = allPrices.filter(
          (candidate: PriceRecord) => candidate.isActive
        )

        // Prioritize most recently created/updated if multiple exist?
        // listPrices sorts by createdAt desc.
        const catalog: PrizeCatalog = {
          small: activePrices.find(
            (record: PriceRecord) => record.tier === 'small'
          ),
          medium: activePrices.find(
            (record: PriceRecord) => record.tier === 'medium'
          ),
          large: activePrices.find(
            (record: PriceRecord) => record.tier === 'large'
          )
        }
        setPrizes(catalog)
        setById(
          activePrices.reduce<Record<string, PriceRecord>>(
            (map: Record<string, PriceRecord>, prize: PriceRecord) => {
              map[prize.id] = prize
              return map
            },
            {}
          )
        )
      } catch (error) {
        console.error('Failed to fetch prizes', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPrizes()
  }, [])

  return { prizes, byId, loading }
}
