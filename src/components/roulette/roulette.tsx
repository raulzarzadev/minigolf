import { useEffect, useMemo, useRef, useState } from 'react'

import { PrizeRecord } from '@/lib/prizes'

const DEFAULT_SPIN_TIME = 4500

const tierColors: Record<string, string> = {
  small: '#34d399',
  medium: '#60a5fa',
  large: '#c084fc',
  bonus: '#f472b6'
}

const NO_PRIZE_COLOR = '#e5e7eb'

const tierLabels: Record<string, string> = {
  small: 'Premio chico',
  medium: 'Premio mediano',
  large: 'Premio grande',
  bonus: 'Premio bonus'
}

type Segment = {
  id: string
  prize: PrizeRecord | null
  startAngle: number
  endAngle: number
  midAngle: number
  percentage: number
  color: string
  displayLabel: string
  labelPosition: { x: number; y: number }
  weightFraction: number
  isNoPrize: boolean
}

const polarToCartesian = (radius: number, angle: number) => {
  const radians = ((angle - 90) * Math.PI) / 180
  return {
    x: radius * Math.cos(radians),
    y: radius * Math.sin(radians)
  }
}

const describeArc = (radius: number, startAngle: number, endAngle: number) => {
  const start = polarToCartesian(radius, endAngle)
  const end = polarToCartesian(radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1
  return `M 0 0 L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`
}

const normalizeAngle = (value: number) => {
  const normalized = value % 360
  return normalized < 0 ? normalized + 360 : normalized
}

const isAngleWithin = (angle: number, start: number, end: number) => {
  if (Math.abs(start - end) < 0.0001) {
    return true
  }
  if (start < end) {
    return angle >= start && angle < end
  }
  return angle >= start || angle < end
}

const findSegmentByAngle = (angle: number, segmentList: Segment[]) => {
  for (const segment of segmentList) {
    const start = normalizeAngle(segment.startAngle)
    const end = normalizeAngle(segment.endAngle)
    if (isAngleWithin(angle, start, end)) {
      return segment
    }
  }
  return segmentList[segmentList.length - 1] ?? null
}

export function Roulette({
  prizes,
  spinTime,
  onResult,
  onStart
}: {
  prizes: PrizeRecord[]
  onResult: (prize: PrizeRecord | null) => void
  onStart?: () => void
  spinTime?: number
}) {
  const [rotation, setRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState<PrizeRecord | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasOutcome, setHasOutcome] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rotationTargetRef = useRef(0)
  const duration = spinTime ?? DEFAULT_SPIN_TIME

  const activePrizes = useMemo(
    () => prizes.filter((prize) => prize.isActive),
    [prizes]
  )

  const segments = useMemo(() => {
    if (activePrizes.length === 0) {
      return [] as Segment[]
    }

    const weightedPrizes = activePrizes
      .map((prize) => ({
        prize,
        weight: Math.max(0, Math.min(100, prize.odds ?? 0))
      }))
      .filter((entry) => entry.weight > 0)

    const totalPrizeWeight = weightedPrizes.reduce(
      (sum, entry) => sum + entry.weight,
      0
    )

    const noneWeight = totalPrizeWeight >= 100 ? 0 : 100 - totalPrizeWeight
    const totalWeight =
      totalPrizeWeight + noneWeight > 0 ? totalPrizeWeight + noneWeight : 100

    const segmentsList: Segment[] = []
    let cursor = 0

    const pushSegment = (
      payload:
        | { prize: PrizeRecord; weight: number }
        | { prize: null; weight: number }
    ) => {
      if (payload.weight <= 0) {
        return
      }

      const normalized = payload.weight / totalWeight
      const sweep = normalized * 360
      const startAngle = cursor
      const endAngle = cursor + sweep
      const percentage = normalized * 100
      cursor = endAngle

      const isNoPrize = payload.prize === null
      const tier = payload.prize?.tier || 'small'
      const color = isNoPrize ? NO_PRIZE_COLOR : tierColors[tier] || '#fbbf24'
      const label = isNoPrize
        ? 'Sin premio'
        : percentage >= 12
          ? (payload.prize?.title ?? tierLabels[tier])
          : tierLabels[tier] || tier.toUpperCase()

      const midAngle = startAngle + sweep / 2
      const labelPosition = polarToCartesian(110, midAngle)

      segmentsList.push({
        id: isNoPrize ? 'no-prize' : payload.prize!.id,
        prize: payload.prize,
        startAngle,
        endAngle,
        midAngle,
        percentage,
        color,
        displayLabel: label,
        labelPosition,
        weightFraction: normalized,
        isNoPrize
      })
    }

    weightedPrizes.forEach((entry) => {
      pushSegment(entry)
    })
    if (noneWeight > 0 || segmentsList.length === 0) {
      pushSegment({ prize: null, weight: noneWeight > 0 ? noneWeight : 100 })
    }

    return segmentsList
  }, [activePrizes])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const resolveResult = (segment: Segment | null) => {
    const prize = segment && !segment.isNoPrize ? segment.prize : null
    setHasOutcome(true)
    setResult(prize)
    onResult(prize)
    setIsSpinning(false)
  }

  const pickWinningSegment = (segmentList: Segment[]) => {
    if (segmentList.length === 0) {
      return null
    }
    const randomValue = Math.random()
    let cumulative = 0

    for (const segment of segmentList) {
      cumulative += segment.weightFraction
      if (randomValue <= cumulative) {
        return segment
      }
    }

    return segmentList[segmentList.length - 1] ?? null
  }

  const handleSpin = () => {
    if (isSpinning || segments.length === 0) {
      return
    }

    setError(null)
    setResult(null)
    setHasOutcome(false)
    onStart?.()
    setIsSpinning(true)

    const segmentSnapshot = segments
    const winningSegment = pickWinningSegment(segmentSnapshot)

    if (!winningSegment) {
      setError('No hay premios activos con porcentaje configurado.')
      resolveResult(null)
      return
    }

    const extraSpins = 5 + Math.random() * 2
    const landingAngle = 360 - winningSegment.midAngle
    setRotation((current) => {
      const normalizedCurrent = normalizeAngle(current)
      const normalizedLanding = normalizeAngle(landingAngle)
      const delta = normalizedLanding - normalizedCurrent
      const targetRotation = extraSpins * 360 + delta
      const nextRotation = current + targetRotation
      rotationTargetRef.current = nextRotation
      return nextRotation
    })

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      const finalRotation = rotationTargetRef.current
      const pointerAngle = normalizeAngle(-finalRotation)
      const landedSegment =
        findSegmentByAngle(pointerAngle, segmentSnapshot) ?? winningSegment
      resolveResult(landedSegment)
    }, duration)
  }

  const handleReset = () => {
    if (isSpinning) {
      return
    }
    setResult(null)
    setError(null)
    setHasOutcome(false)
  }

  if (prizes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        No hay premios configurados para la ruleta.
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <div className="absolute -top-4 left-1/2 z-20 flex -translate-x-1/2 items-center justify-center">
          <div className="h-8 w-6 rounded-b-full bg-slate-900" />
        </div>
        <div
          className="relative h-80 w-80 rounded-full bg-white shadow-xl"
          style={{
            transition: `transform ${duration}ms cubic-bezier(0.17, 0.67, 0.37, 0.99)`,
            transform: `rotate(${rotation}deg)`
          }}
        >
          <svg viewBox="-200 -200 400 400" className="h-full w-full">
            <g>
              {segments.map((segment) => (
                <g key={segment.id}>
                  <path
                    d={describeArc(180, segment.startAngle, segment.endAngle)}
                    fill={segment.color}
                  />
                  <text
                    x={segment.labelPosition.x}
                    y={segment.labelPosition.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="pointer-events-none select-none fill-slate-900 text-xs font-semibold"
                  >
                    {segment.displayLabel}
                  </text>
                  <text
                    x={segment.labelPosition.x}
                    y={segment.labelPosition.y + 16}
                    textAnchor="middle"
                    className="pointer-events-none select-none fill-slate-700 text-[10px]"
                  >
                    {segment.percentage.toFixed(1)}%
                  </text>
                </g>
              ))}
            </g>
          </svg>
        </div>
        <div className="pointer-events-none absolute top-0 left-1/2 z-30 -translate-x-1/2">
          <div className="h-10 w-10 -translate-y-5 rotate-45 rounded bg-white shadow" />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSpin}
          disabled={isSpinning || segments.length === 0}
          className="rounded-full bg-emerald-500 px-6 py-2 font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-emerald-300"
        >
          {isSpinning ? 'Girando...' : 'Girar'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={isSpinning}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          Reiniciar
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {hasOutcome && !error && (
        <div className="w-full rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
          {result ? (
            <>
              <p className="text-sm font-medium text-emerald-800">
                Resultado: <span className="font-semibold">{result.title}</span>{' '}
                ({tierLabels[result.tier] || result.tier})
              </p>
              {result.description && (
                <p className="mt-2 text-xs text-emerald-700">
                  {result.description}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm font-medium text-emerald-800">
              Resultado: <span className="font-semibold">Sin premio</span>.
              Intenta de nuevo.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
