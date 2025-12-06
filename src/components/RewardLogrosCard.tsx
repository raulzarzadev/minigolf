'use client'

import { CheckCircle2, Gift, Info, Loader2, Sparkles } from 'lucide-react'
import { FC, useEffect, useMemo, useRef, useState } from 'react'
import { prizeCatalog } from '@/constants/prizes'
import { useAuth } from '@/contexts/AuthContext'
import { usePrizes } from '@/hooks/usePrizes'
import { PrizeRecord } from '@/lib/prizes'
import { ROULETTE_SPIN_DURATION_MS } from '@/lib/roulette'
import { assignPrizeToUser, incrementUserTries } from '@/lib/tries'
import { PrizeTier, RewardPrize } from '@/types/rewards'
import { Roulette } from './roulette/roulette'

const isCorePrizeTier = (tier: PrizeRecord['tier']): tier is PrizeTier =>
  tier === 'small' || tier === 'medium' || tier === 'large'

const RewardLogrosCard: FC = () => {
  const { user, refreshUser } = useAuth()
  const { prizes, loading: prizesLoading } = usePrizes()
  const [lastResult] = useState<RewardPrize | null>(null)
  const [lastPrize] = useState<PrizeRecord | null>(null)
  const [showPending, setShowPending] = useState(false)
  const [showEarnModal, setShowEarnModal] = useState(false)
  const spinTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) {
        window.clearTimeout(spinTimeoutRef.current)
      }
    }
  }, [])

  const rollsAvailable = user?.tries?.triesLeft ?? 0

  const findPrizeMeta = (prizeId: string) =>
    prizes.find((p) => p.id === prizeId) ?? null
  const prizeEntries = user?.tries?.prizesWon ?? []
  const pendingPrizes = useMemo(
    () => prizeEntries.filter((entry) => !entry.deliveredAt),
    [prizeEntries]
  )
  const claimedPrizes = useMemo(
    () => prizeEntries.filter((entry) => !!entry.deliveredAt),
    [prizeEntries]
  )

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
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase font-semibold text-gray-500">
            Logros y premios
          </p>
          <p className="text-sm text-gray-600">
            Consulta tus tiradas, premios ganados y reclámalos en un solo lugar.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowEarnModal(true)}
          className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          <Info className="h-3.5 w-3.5" />
          Cómo ganar más
        </button>
      </div>
      <div className="flex flex-col lg:flex-row md:gap-6 gap-4">
        {/* //* RULETA  */}
        <div className="flex flex-col gap-3 items-center">
          <div className="relative">
            <div
              className={
                rollsAvailable === 0 ? 'pointer-events-none opacity-40' : ''
              }
            >
              <Roulette
                prizes={prizes}
                onResult={async (result) => {
                  await incrementUserTries(user.id, -1)
                  if (result) {
                    await assignPrizeToUser(user.id, result)
                  }
                  refreshUser()
                  return
                }}
                spinTime={ROULETTE_SPIN_DURATION_MS}
              />
            </div>
            {rollsAvailable === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-gray-600 border border-gray-200">
                  {rollsAvailable === 0
                    ? 'Sin tiradas disponibles'
                    : 'Completa una partida para activar'}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-2 w-full max-w-md">
            {prizesLoading && (
              <p className="text-[11px] text-gray-400">
                Actualizando catálogo de premios...
              </p>
            )}
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-4">
          {/* //* PREMIOS RECLAMADOS  */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-emerald-900">
                Premios ganados
              </p>
              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            </div>
            {claimedPrizes.length === 0 ? (
              <p className="text-xs text-emerald-800">
                Aún no has reclamado premios.
              </p>
            ) : (
              claimedPrizes.map((entry) => {
                const record = findPrizeMeta(entry.prizeId)
                const fallback =
                  record && isCorePrizeTier(record.tier)
                    ? prizeCatalog[record.tier as PrizeTier]
                    : undefined
                const deliveredDate = entry.deliveredAt ?? entry.wonAt
                return (
                  <div
                    key={`${entry.prizeId}-${entry.wonAt?.toString()}-delivered`}
                    className="flex items-start justify-between gap-3 rounded-lg bg-white border border-emerald-100 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {record?.title ?? fallback?.label ?? 'Premio reclamado'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {record?.description ?? fallback?.description ?? ''}
                      </p>
                      <span className="text-[11px] text-gray-400">
                        Entregado el {formatDate(deliveredDate)}
                      </span>
                    </div>
                    <span className="inline-flex items-center text-[11px] font-semibold text-emerald-800">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Entregado
                    </span>
                  </div>
                )
              })
            )}
          </div>
          {/* //* NUMBERS  */}

          <div className="grid grid-cols-2  gap-3">
            <StatPill
              label="Tiradas pendientes"
              value={rollsAvailable}
              tone="emerald"
            />
            <StatPill
              label="Premios por reclamar"
              value={pendingPrizes.length}
              tone="amber"
              onClick={() => setShowPending((prev) => !prev)}
              interactive
            />
            <StatPill
              label="Premios ganados"
              value={claimedPrizes.length}
              tone="purple"
            />
            <StatPill
              label="Último resultado"
              value={
                lastPrize?.title ??
                (lastResult === 'none' ? 'Sin premio' : '--')
              }
              tone="blue"
            />
          </div>

          {/* //* PREMIOS POR RECLAMAR  */}
          {showPending && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-amber-900">
                  Premios por reclamar
                </p>
                <Gift className="h-4 w-4 text-amber-700" />
              </div>
              {pendingPrizes.length === 0 ? (
                <p className="text-xs text-amber-800">
                  No tienes premios pendientes.
                </p>
              ) : (
                pendingPrizes.map((entry) => {
                  const record = findPrizeMeta(entry.prizeId)
                  const fallback =
                    record && isCorePrizeTier(record.tier)
                      ? prizeCatalog[record.tier as PrizeTier]
                      : undefined
                  return (
                    <div
                      key={`${entry.prizeId}-${entry.wonAt?.toString()}`}
                      className="flex items-start justify-between gap-3 rounded-lg bg-white border border-amber-100 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {record?.title ??
                            fallback?.label ??
                            'Premio sorpresa'}
                        </p>
                        <p className="text-xs text-gray-600">
                          {record?.description ??
                            fallback?.description ??
                            'Reclámalo con el staff.'}
                        </p>
                        <span className="text-[11px] text-gray-400">
                          Ganado el {formatDate(entry.wonAt)}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-amber-800">
                        Mostrar a staff
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>
      {showEarnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Cómo ganar más premios
                </p>
                <p className="text-xs text-gray-500">
                  Completa estas acciones y pide al staff validar tu premio.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEarnModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600 mt-0.5" />
                Comparte tu partida en redes sociales y etiqueta al club.
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600 mt-0.5" />
                Síguenos y muestra tu perfil al staff.
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600 mt-0.5" />
                Completa retos especiales durante tus partidas.
              </li>
            </ul>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEarnModal(false)}
                className="text-xs font-semibold text-gray-700 hover:text-gray-900"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEarnModal(false)
                }}
                className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-emerald-600"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const StatPill = ({
  label,
  value,
  tone = 'emerald',
  onClick,
  interactive = false
}: {
  label: string
  value: number | string
  tone?: 'emerald' | 'amber' | 'blue' | 'purple'
  onClick?: () => void
  interactive?: boolean
}) => {
  const toneMap: Record<typeof tone, string> = {
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700'
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      className={`w-full rounded-2xl border border-gray-200 bg-white p-3 text-left shadow-sm flex items-center justify-between ${interactive ? 'hover:border-gray-300 active:scale-[0.99]' : ''}`}
    >
      <div className="space-y-1">
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        <div
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold ${toneMap[tone]}`}
        >
          {value}
        </div>
      </div>
      {interactive && (
        <span className="text-[11px] text-emerald-700 font-semibold">Ver</span>
      )}
    </button>
  )
}

export default RewardLogrosCard
