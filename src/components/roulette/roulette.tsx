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

const POINTER_ANGLE = 90

type Segment = {
  id: string
  prize: PrizeRecord | null
  startAngle: number
  endAngle: number
  midAngle: number
  percentage: number
  color: string
  displayLabel: string
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
  const [buttonScale, setButtonScale] = useState(1)
  const [isPressing, setIsPressing] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rotationTargetRef = useRef(0)
  const pressStartTimeRef = useRef<number>(0)
  const animationFrameRef = useRef<number | null>(null)
  const durationRef = useRef<number>(spinTime ?? DEFAULT_SPIN_TIME)
  const [duration, setDuration] = useState(spinTime ?? DEFAULT_SPIN_TIME)

  const updateDuration = (value: number) => {
    durationRef.current = value
    setDuration(value)
  }

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

    const minWeight =
      weightedPrizes.length > 0
        ? Math.min(...weightedPrizes.map((p) => p.weight))
        : 10

    const prizeChunks = weightedPrizes.flatMap(({ prize, weight }) => {
      const chunkCount = Math.max(1, Math.round(weight / minWeight))
      const chunkWeight = weight / chunkCount
      return Array.from({ length: chunkCount }, (_, index) => ({
        id: `${prize.id}-${index}`,
        prize,
        weight: chunkWeight
      }))
    })

    const fillerCount =
      noneWeight > 0 ? Math.max(1, Math.round(noneWeight / minWeight)) : 0

    const fillerChunks =
      noneWeight > 0
        ? Array.from({ length: fillerCount }, (_, index) => ({
            id: `none-${index}`,
            prize: null,
            weight: noneWeight / fillerCount
          }))
        : []

    const orderedChunks: Array<{
      id: string
      prize: PrizeRecord | null
      weight: number
    }> = []

    if (fillerChunks.length === 0) {
      orderedChunks.push(...prizeChunks)
    } else if (prizeChunks.length === 0) {
      orderedChunks.push(...fillerChunks)
    } else {
      const totalChunks = prizeChunks.length + fillerChunks.length
      const prizeRatio = prizeChunks.length / totalChunks
      let prizeIndex = 0
      let fillerIndex = 0

      for (let i = 0; i < totalChunks; i++) {
        const currentRatio = prizeIndex / (i + 1)
        const shouldAddPrize =
          prizeIndex < prizeChunks.length &&
          (fillerIndex >= fillerChunks.length || currentRatio < prizeRatio)

        if (shouldAddPrize) {
          orderedChunks.push(prizeChunks[prizeIndex++])
        } else {
          orderedChunks.push(fillerChunks[fillerIndex++])
        }
      }
    }

    if (orderedChunks.length === 0) {
      orderedChunks.push({ id: 'none-0', prize: null, weight: 100 })
    }

    const wheelWeight = orderedChunks.reduce(
      (sum, chunk) => sum + chunk.weight,
      0
    )
    let cursor = 0

    return orderedChunks.map((chunk) => {
      const normalized = chunk.weight / wheelWeight
      const sweep = normalized * 360
      const startAngle = cursor
      const endAngle = cursor + sweep
      const percentage = normalized * 100
      cursor = endAngle
      const midAngle = startAngle + sweep / 2

      const isNoPrize = chunk.prize === null
      const tier = chunk.prize?.tier || 'small'
      const color = isNoPrize ? NO_PRIZE_COLOR : tierColors[tier] || '#fbbf24'

      let label: string
      if (isNoPrize) {
        label = 'Sin premio'
      } else {
        label = chunk.prize?.title ?? tierLabels[tier]
      }

      return {
        id: chunk.id,
        prize: chunk.prize,
        startAngle,
        endAngle,
        midAngle,
        percentage,
        color,
        displayLabel: label,
        weightFraction: normalized,
        isNoPrize
      }
    })
  }, [activePrizes])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (isPressing) {
      const animate = () => {
        const elapsed = Date.now() - pressStartTimeRef.current
        const scale = 1 + Math.min(elapsed / 1000, 0.7) // Crece hasta 1.7x en 1 segundo
        setButtonScale(scale)
        animationFrameRef.current = requestAnimationFrame(animate)
      }
      animationFrameRef.current = requestAnimationFrame(animate)
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      setButtonScale(1)
    }
  }, [isPressing])

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

  const handleSpin = (overrideDuration?: number) => {
    if (isSpinning || segments.length === 0) {
      return
    }

    setError(null)
    setResult(null)
    setHasOutcome(false)
    setIsPressing(false)
    onStart?.()
    setIsSpinning(true)

    const useDuration = overrideDuration ?? durationRef.current

    const segmentSnapshot = segments
    const winningSegment = pickWinningSegment(segmentSnapshot)

    if (!winningSegment) {
      setError('No hay premios activos con porcentaje configurado.')
      resolveResult(null)
      return
    }

    const extraSpins = 5 + Math.random() * 2
    const desiredLanding = normalizeAngle(
      POINTER_ANGLE - winningSegment.midAngle
    )
    setRotation((current) => {
      const normalizedCurrent = normalizeAngle(current)
      let delta = desiredLanding - normalizedCurrent
      while (delta <= 0) {
        delta += 360
      }
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
      const pointerAngle = normalizeAngle(POINTER_ANGLE - finalRotation)
      const landedSegment =
        findSegmentByAngle(pointerAngle, segmentSnapshot) ?? winningSegment
      resolveResult(landedSegment)
    }, useDuration)
  }

  const handleMouseDown = () => {
    if (isSpinning || segments.length === 0) return
    setIsPressing(true)
    pressStartTimeRef.current = Date.now()
  }

  const handleMouseUp = () => {
    if (!isPressing) return

    setIsPressing(false)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    const elapsed = Date.now() - pressStartTimeRef.current
    const baseDuration = spinTime ?? DEFAULT_SPIN_TIME
    const maxDuration = baseDuration * 2
    const dynamicDuration = Math.min(
      maxDuration,
      baseDuration + elapsed * 4 // cada ms agrega 2ms al giro, hasta 2x
    )

    updateDuration(dynamicDuration)
    handleSpin(dynamicDuration)
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
        <div
          className="relative h-80 w-80 rounded-full bg-white shadow-xl"
          style={{
            transition: `transform ${duration}ms cubic-bezier(0.17, 0.67, 0.37, 0.99)`,
            transform: `rotate(${rotation}deg)`
          }}
        >
          <svg viewBox="-200 -200 400 400" className="h-full w-full">
            {segments.map((segment) => {
              //const sweep = segment.endAngle - segment.startAngle
              const rotation = segment.midAngle - 90
              const textOffset = 90

              return (
                <g key={segment.id}>
                  <path
                    d={describeArc(180, segment.startAngle, segment.endAngle)}
                    fill={segment.color}
                    stroke="#ffffff"
                    strokeWidth="1"
                  />

                  <text
                    transform={`rotate(${rotation}) translate(${textOffset}, 0)`}
                    textAnchor="start"
                    dominantBaseline="middle"
                    className="pointer-events-none select-none fill-slate-900 text-[11px] font-semibold"
                    style={{ transformOrigin: '0 0' }}
                  >
                    {segment.displayLabel}
                  </text>
                </g>
              )
            })}
          </svg>

          {/* Botón central para girar */}
          <button
            type="button"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => setIsPressing(false)}
            onTouchStart={handleMouseDown}
            onTouchEnd={handleMouseUp}
            disabled={isSpinning || segments.length === 0}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-linear-to-br from-emerald-400 to-emerald-600 text-white font-bold shadow-lg hover:from-emerald-500 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-colors"
            style={{
              width: `${60 * buttonScale}px`,
              height: `${60 * buttonScale}px`,
              transition: isPressing
                ? 'none'
                : 'width 0.2s ease-out, height 0.2s ease-out'
            }}
          >
            <span className="text-sm">{isSpinning ? '...' : 'GIRAR'}</span>
          </button>
        </div>

        <div className="pointer-events-none absolute top-1/2 -right-3 z-30 -translate-y-1/2">
          <div className="flex items-center">
            <div
              className="w-0 h-0"
              style={{
                borderTop: '12px solid transparent',
                borderBottom: '12px solid transparent',
                borderRight: '16px solid #ef4444'
              }}
            />
            <div className="h-8 w-8 rounded-full bg-red-500 shadow-lg -ml-2" />
          </div>
        </div>
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
                ¡Ganaste! <span className="font-semibold">{result.title}</span>
              </p>
              {result.description && (
                <p className="mt-2 text-xs text-emerald-700">
                  {result.description}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm font-medium text-slate-600">
              Sin premio esta vez. ¡Intenta de nuevo!
            </p>
          )}
        </div>
      )}
    </div>
  )
}
