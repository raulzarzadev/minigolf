'use client'

import { CheckCircle2, Gift, Loader2 } from 'lucide-react'
import { FC, useEffect, useMemo, useRef, useState } from 'react'
import { prizeCatalog } from '@/constants/prizes'
import { useAuth } from '@/contexts/AuthContext'
import { usePrizes } from '@/hooks/usePrizes'
import { PrizeRecord } from '@/lib/prizes'
import {
  ROULETTE_SPIN_DURATION_MS,
  rouletteGradient,
  rouletteSegmentAngle,
  rouletteSegments
} from '@/lib/roulette'
import { incrementUserTries, spinPrizeWheel } from '@/lib/tries'
import { Game } from '@/types'
import { RewardPrize } from '@/types/rewards'
import { Roulette } from './roulette/roulette'

interface RewardLogrosCardProps {
  games: Game[]
}

const isCorePrizeTier = (tier: PrizeRecord['tier']): tier is PrizeTier =>
  tier === 'small' || tier === 'medium' || tier === 'large'

const RewardLogrosCard: FC<RewardLogrosCardProps> = ({ games }) => {
  const { user, isAdmin, refreshUser } = useAuth()
  const { prizes, loading: prizesLoading } = usePrizes()
  const [adminRollInput, setAdminRollInput] = useState('1')
  const [adminStatus, setAdminStatus] = useState<string | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [wheelRotation, setWheelRotation] = useState(0)
  const [lastResult, setLastResult] = useState<RewardPrize | null>(null)
  const [lastPrize, setLastPrize] = useState<PrizeRecord | null>(null)
  const spinTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) {
        window.clearTimeout(spinTimeoutRef.current)
      }
    }
  }, [])

  const rollsAvailable = user?.tries?.triesLeft ?? 0
  const hasFinishedGame = useMemo(
    () => games.some((game) => game.status === 'finished'),
    [games]
  )
  const rouletteHelperMessage = hasFinishedGame
    ? rollsAvailable > 0
      ? `${rollsAvailable} tirada(s) disponible(s)`
      : 'Sin tiradas disponibles, completa retos para ganar más.'
    : 'Termina una partida para activar la ruleta.'

  const prizeEntries = user?.tries?.prizesWon ?? []
  const pendingPrizes = useMemo(
    () => prizeEntries.filter((entry) => !entry.deliveredAt),
    [prizeEntries]
  )
  const claimedPrizes = useMemo(
    () => prizeEntries.filter((entry) => !!entry.deliveredAt),
    [prizeEntries]
  )

  const lastResultMeta = (() => {
    if (lastPrize) {
      return {
        label: lastPrize.title,
        description: lastPrize.description || 'Reclámalo con el staff.'
      }
    }
    // if (lastResult && lastResult !== 'none') {
    //   return prizeCatalog[lastResult]
    // }
    return null
  })()

  const rouletteStatusLabel =
    lastResult === 'none'
      ? 'Sin premio esta vez'
      : (lastResultMeta?.label ?? 'Listo para girar')
  const rouletteStatusDescription =
    lastResult === 'none'
      ? 'Esta vez no tocó premio, vuelve a intentarlo.'
      : (lastResultMeta?.description ??
        'Pulsa la ruleta cuando tengas tiradas disponibles.')

  const handleSpinRoulette = async () => {
    if (!user || isSpinning || rollsAvailable <= 0 || !hasFinishedGame) {
      return
    }

    setIsSpinning(true)
    setLastResult(null)
    setLastPrize(null)

    try {
      const spinResult = await spinPrizeWheel(user.id)
      const tier: RewardPrize =
        (spinResult.prize?.tier as RewardPrize | undefined) ?? 'none'

      const segmentIndex = rouletteSegments.findIndex(
        (segment) => segment.tier === tier
      )
      const safeIndex = segmentIndex === -1 ? 0 : segmentIndex
      const extraSpins = 4 + Math.floor(Math.random() * 3)
      const rotationOffset =
        safeIndex * rouletteSegmentAngle + rouletteSegmentAngle / 2

      setWheelRotation((prev) => {
        const normalizedPrev = prev % 360
        const alignmentOffset = rotationOffset - normalizedPrev
        return prev + extraSpins * 360 + alignmentOffset
      })

      if (spinTimeoutRef.current) {
        window.clearTimeout(spinTimeoutRef.current)
      }

      spinTimeoutRef.current = window.setTimeout(() => {
        setLastResult(tier)
        setLastPrize(spinResult.prize ?? null)
        setIsSpinning(false)
        spinTimeoutRef.current = null
      }, ROULETTE_SPIN_DURATION_MS)

      await refreshUser()
    } catch (error) {
      console.error('Error al girar la ruleta:', error)
      setIsSpinning(false)
      if (spinTimeoutRef.current) {
        window.clearTimeout(spinTimeoutRef.current)
        spinTimeoutRef.current = null
      }
    }
  }

  const handleAdminGrant = async () => {
    if (!user || !isAdmin) return
    const rollsToGrant = Math.max(1, Math.floor(Number(adminRollInput) || 0))

    try {
      await incrementUserTries(user.id, rollsToGrant)
      setAdminRollInput('1')
      setAdminStatus(`+${rollsToGrant} tirada(s) asignada(s)`)
      await refreshUser()
    } catch (error) {
      console.error('Error asignando tiradas manuales:', error)
      setAdminStatus('No se pudo asignar tiradas')
    } finally {
      setTimeout(() => setAdminStatus(null), 2500)
    }
  }

  if (!user) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-green-600 mx-auto" />
      </div>
    )
  }

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Fecha pendiente'
    return new Date(date).toLocaleDateString('es-MX', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <>
      {/* <div className="flex flex-wrap items-center justify-between gap-3">
        {games.length > 0 && (
          <p className="text-[11px] text-gray-500">
            {games.filter((game) => game.status === 'finished').length} partidas
            finalizadas
          </p>
        )}
      </div> */}
      <Roulette
        prizes={prizes}
        onResult={(res) => {
          console.log({ res })
        }}
      />

      {/* <div className="space-y-4">
        <div className="rounded-2xl border border-gray-200 p-4 space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleSpinRoulette}
                disabled={
                  !hasFinishedGame || rollsAvailable === 0 || isSpinning
                }
                className="relative h-56 w-56 md:h-64 md:w-64 rounded-full focus-visible:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-4 left-1/2 flex -translate-x-1/2 flex-col items-center"
                >
                  <div className="h-5 w-1 rounded bg-white shadow" />
                  <div
                    className="drop-shadow"
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: '9px solid transparent',
                      borderRight: '9px solid transparent',
                      borderTop: '14px solid white'
                    }}
                  />
                </div>
                <div
                  className="absolute inset-0 rounded-full border-[6px] border-white shadow-xl transition-transform ease-out"
                  style={{
                    backgroundImage: rouletteGradient,
                    transform: `rotate(${wheelRotation}deg)`,
                    transitionDuration: `${ROULETTE_SPIN_DURATION_MS}ms`
                  }}
                />
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <div className="absolute inset-2 flex items-center justify-center">
                    {rouletteSegments.map((segment, index) => {
                      const rotation =
                        index * rouletteSegmentAngle + rouletteSegmentAngle / 2
                      return (
                        <div
                          key={segment.tier}
                          className="absolute inset-4 flex items-center justify-center"
                          style={{ transform: `rotate(${rotation}deg)` }}
                        >
                          <span
                            className="text-[11px] font-semibold uppercase tracking-tight text-center"
                            style={{
                              color: segment.color,
                              transform: `rotate(-${rotation}deg)`
                            }}
                          >
                            {segment.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="absolute inset-5 rounded-full bg-white/95 backdrop-blur flex flex-col items-center justify-center text-center px-4">
                    <p className="text-[11px] uppercase tracking-wide text-gray-400">
                      Ruleta
                    </p>
                    <p className="text-base font-semibold text-gray-900">
                      {isSpinning ? 'Girando...' : 'Tocar para girar'}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {rollsAvailable} tirada(s)
                    </p>
                  </div>
                </div>
              </button>
              <p className="text-[11px] text-gray-500 text-center">
                {hasFinishedGame
                  ? 'Valida el premio con el staff al terminar el giro.'
                  : 'Termina una partida para activar la ruleta.'}
              </p>
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex p-3 bg-gray-50 rounded-xl items-center justify-between">
                <div className="flex-1 space-y-2">
                  <p className="text-xs text-gray-500">Tiradas disponibles</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {rollsAvailable}
                  </p>
                </div>
                {isAdmin && (
                  <div className="flex flex-wrap items-center gap-2 border border-dashed border-gray-200 rounded-lg p-2 text-xs">
                    <span className="font-semibold text-gray-700">
                      Modo staff
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={adminRollInput}
                      onChange={(event) =>
                        setAdminRollInput(event.target.value)
                      }
                      className="w-16 border border-gray-300 rounded px-2 py-1"
                    />
                    <button
                      type="button"
                      onClick={handleAdminGrant}
                      className="px-3 py-1 rounded bg-black text-white font-semibold"
                    >
                      Dar tiradas
                    </button>
                    {adminStatus && (
                      <span className="text-green-600 font-medium">
                        {adminStatus}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <p className="text-[11px] text-gray-500 p-3">
                {rouletteHelperMessage}
              </p>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Último resultado</p>
                <p className="text-sm font-semibold text-gray-900">
                  {rouletteStatusLabel}
                </p>
                <p className="text-[11px] text-gray-500">
                  {rouletteStatusDescription}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSpinRoulette}
                disabled={
                  !hasFinishedGame || rollsAvailable === 0 || isSpinning
                }
                className="w-full inline-flex items-center justify-center px-4 py-2 rounded-2xl bg-green-500 text-white font-semibold text-xs hover:bg-green-400 disabled:opacity-40"
              >
                {isSpinning ? 'Girando...' : 'Girar ruleta'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600">
            {rouletteSegments.map((segment) => (
              <div
                key={segment.tier}
                className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white px-2 py-1.5"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="font-semibold text-gray-900">
                  {segment.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-yellow-900">
              Premios por reclamar
            </p>
            <Gift className="h-4 w-4 text-yellow-700" />
          </div>
          {pendingPrizes.length > 0 ? (
            <div className="space-y-2">
              {pendingPrizes.map((entry) => {
                const record = normalizePrizeMeta(entry.prizeId)
                const fallback =
                  record && isCorePrizeTier(record.tier)
                    ? prizeCatalog[record.tier]
                    : undefined
                return (
                  <div
                    key={`${entry.prizeId}-${entry.wonAt?.toString()}`}
                    className="flex items-start justify-between gap-3 rounded-xl bg-white border border-yellow-100 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {record?.title ?? fallback?.label ?? 'Premio sorpresa'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {record?.description ??
                          fallback?.description ??
                          'Reclámalo con el staff.'}
                      </p>
                      <span className="text-[11px] text-gray-400">
                        Ganado el {formatDate(entry.wonAt)}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-yellow-900">
                      Mostrar a staff
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-yellow-900">
              No tienes premios pendientes por reclamar.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-green-900">
              Premios que ya reclamaste
            </p>
            <CheckCircle2 className="h-4 w-4 text-green-700" />
          </div>
          {claimedPrizes.length > 0 ? (
            <div className="space-y-2">
              {claimedPrizes.map((entry) => {
                const record = normalizePrizeMeta(entry.prizeId)
                const fallback =
                  record && isCorePrizeTier(record.tier)
                    ? prizeCatalog[record.tier]
                    : undefined
                const deliveredDate = entry.deliveredAt ?? entry.wonAt
                return (
                  <div
                    key={`${entry.prizeId}-${entry.wonAt?.toString()}-delivered`}
                    className="flex items-center justify-between rounded-xl bg-white border border-green-100 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {record?.title ?? fallback?.label ?? 'Premio reclamado'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {record?.description ?? fallback?.description ?? ''}
                      </p>
                      <span className="text-[11px] text-gray-400">
                        Entregado el {formatDate(deliveredDate)}
                      </span>
                    </div>
                    <span className="inline-flex items-center text-[11px] font-semibold text-green-700">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Entregado
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-green-900">
              Aún no has reclamado premios.
            </p>
          )}
        </div>
      </div> */}

      {prizesLoading && (
        <p className="text-[11px] text-gray-400">
          Actualizando catálogo de premios...
        </p>
      )}
    </>
  )
}

export default RewardLogrosCard
