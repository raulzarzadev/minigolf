import { RewardPrize } from '@/lib/rewards'

export const rouletteSegments: Array<{
  tier: RewardPrize
  label: string
  color: string
}> = [
  { tier: 'large', label: 'Gran premio', color: '#a855f7' },
  { tier: 'medium', label: 'Premio mediano', color: '#3b82f6' },
  { tier: 'small', label: 'Premio chico', color: '#22c55e' },
  { tier: 'none', label: 'Sin premio', color: '#f97316' }
]

export const rouletteSegmentAngle = 360 / rouletteSegments.length

export const rouletteGradient = (() => {
  const segments = rouletteSegments.map((segment, index) => {
    const start = index * rouletteSegmentAngle
    const end = start + rouletteSegmentAngle
    return `${segment.color} ${start}deg ${end}deg`
  })
  return `conic-gradient(${segments.join(', ')})`
})()

export const ROULETTE_SPIN_DURATION_MS = 2400
