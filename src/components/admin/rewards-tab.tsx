import {
  CheckCircle2,
  Edit3,
  Gift,
  Loader2,
  RefreshCw,
  Save,
  Trash2
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  createPrize,
  deletePrize,
  PrizeRecord,
  updatePrize
} from '@/lib/prizes'
import { deliverPrizeForUser } from '@/lib/tries'
import { AdminUser } from '@/types'
import { PrizeTier } from '@/types/rewards'

type PriceFormState = {
  title: string
  description: string
  tier: PrizeTier | 'bonus'
  odds: string
  stock: string
  isActive: boolean
}

const emptyPriceForm = (): PriceFormState => ({
  title: '',
  description: '',
  tier: 'small',
  odds: '',
  stock: '',
  isActive: true
})

const toPriceFormState = (record: PrizeRecord): PriceFormState => ({
  title: record.title,
  description: record.description,
  tier: record.tier,
  odds: record.odds != null ? String(record.odds) : '',
  stock: record.stock != null ? String(record.stock) : '',
  isActive: record.isActive ?? true
})

const formToPayload = (form: PriceFormState) => ({
  title: form.title.trim(),
  description: form.description.trim(),
  tier: form.tier,
  odds: form.odds ? Number(form.odds) : undefined,
  stock: form.stock ? Number(form.stock) : undefined,
  isActive: form.isActive
})

type TierStats = Record<
  'small' | 'medium' | 'large' | 'bonus',
  { pending: number; delivered: number }
>

type RecentPrizeRow = {
  id: string
  userId: string
  username: string
  userName: string
  prizeId: string
  prizeTitle: string
  prizeDescription: string
  tier: PrizeTier | 'bonus'
  wonAt: Date
  deliveredAt: Date | null
}

export function RewardsTab({
  users,
  prices,
  loading,
  onRefreshRewards
}: {
  users: AdminUser[]
  prices: PrizeRecord[]
  loading: boolean
  onRefreshRewards: () => void
}) {
  const { isAdmin } = useAuth()
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [priceDraft, setPriceDraft] = useState<PriceFormState>(() =>
    emptyPriceForm()
  )
  const [editBuffers, setEditBuffers] = useState<
    Record<string, PriceFormState>
  >({})
  const [creatingPrice, setCreatingPrice] = useState(false)
  const [savingPriceId, setSavingPriceId] = useState<string | null>(null)
  const [deletingPriceId, setDeletingPriceId] = useState<string | null>(null)
  const [deliveringPrizeId, setDeliveringPrizeId] = useState<string | null>(
    null
  )

  const hasAccess = !!isAdmin
  const priceList = prices

  const prizeMap = useMemo(() => {
    const map = new Map<string, PrizeRecord>()
    prices.forEach((price) => {
      map.set(price.id, price)
    })
    return map
  }, [prices])

  const tierStats = useMemo<TierStats>(() => {
    const base: TierStats = {
      small: { pending: 0, delivered: 0 },
      medium: { pending: 0, delivered: 0 },
      large: { pending: 0, delivered: 0 },
      bonus: { pending: 0, delivered: 0 }
    }

    users.forEach((candidate) => {
      candidate.tries?.prizesWon?.forEach((entry) => {
        const record = prizeMap.get(entry.prizeId)
        const tier = (record?.tier ?? 'bonus') as keyof TierStats
        const bucket = base[tier] ?? base.bonus
        if (entry.deliveredAt) {
          bucket.delivered += 1
        } else {
          bucket.pending += 1
        }
      })
    })

    return base
  }, [users, prizeMap])

  const totalTriesAvailable = useMemo(
    () =>
      users.reduce(
        (sum, candidate) => sum + (candidate.tries?.triesLeft ?? 0),
        0
      ),
    [users]
  )

  const totalTriesPlayed = useMemo(
    () =>
      users.reduce(
        (sum, candidate) => sum + (candidate.tries?.triesPlayed ?? 0),
        0
      ),
    [users]
  )

  const totalPendingPrizes = useMemo(
    () =>
      Object.values(tierStats).reduce((sum, bucket) => sum + bucket.pending, 0),
    [tierStats]
  )

  const recentPrizes = useMemo<RecentPrizeRow[]>(() => {
    const rows: RecentPrizeRow[] = []

    users.forEach((candidate) => {
      candidate.tries?.prizesWon?.forEach((entry, index) => {
        const record = prizeMap.get(entry.prizeId)
        const tier = (record?.tier ?? 'bonus') as PrizeTier | 'bonus'

        const wonAt = entry.wonAt ?? new Date()
        rows.push({
          id: `${candidate.id}-${entry.prizeId}-${wonAt.getTime()}-${index}`,
          userId: candidate.id,
          username: candidate.username,
          userName: candidate.name,
          prizeId: entry.prizeId,
          prizeTitle: record?.title ?? 'Premio sorpresa',
          prizeDescription:
            record?.description ?? 'Valida este premio con el staff.',
          tier,
          wonAt,
          deliveredAt: entry.deliveredAt ?? null
        })
      })
    })

    return rows
      .sort((a, b) => b.wonAt.getTime() - a.wonAt.getTime())
      .slice(0, 20)
  }, [users, prizeMap])

  const handleDeliver = async (prize: RecentPrizeRow) => {
    if (!hasAccess || prize.deliveredAt) return
    try {
      setDeliveringPrizeId(prize.id)
      await deliverPrizeForUser(prize.userId, prize.prizeId)
      setStatusMessage('Premio marcado como entregado')
      await onRefreshRewards()
    } catch (error) {
      console.error('Error marcando premio como entregado:', error)
      setStatusMessage('No se pudo marcar el premio')
    } finally {
      setDeliveringPrizeId(null)
      setTimeout(() => setStatusMessage(null), 2500)
    }
  }

  const handleDraftChange = (
    field: keyof PriceFormState,
    value: string | boolean
  ) => {
    setPriceDraft((prev) => {
      const next = { ...prev }
      if (field === 'isActive') {
        next.isActive = Boolean(value)
      } else if (field === 'tier') {
        next.tier = value as PrizeTier | 'bonus'
      } else {
        next[field] = value as string
      }
      return next
    })
  }

  const handleCreatePrice = async () => {
    if (!hasAccess) {
      setStatusMessage('No tienes permisos para agregar premios')
      return
    }
    if (!priceDraft.title.trim()) {
      setStatusMessage('Ingresa un nombre de premio')
      return
    }
    setCreatingPrice(true)
    try {
      await createPrize(formToPayload(priceDraft))
      setPriceDraft(emptyPriceForm())
      setStatusMessage('Premio agregado correctamente')
      await onRefreshRewards()
    } catch (error) {
      console.error('Error creando premio:', error)
      setStatusMessage('Error al crear el premio')
    } finally {
      setCreatingPrice(false)
      setTimeout(() => setStatusMessage(null), 2500)
    }
  }

  const handleStartEdit = (record: PrizeRecord) => {
    if (!hasAccess) return
    setEditBuffers((prev) => ({
      ...prev,
      [record.id]: toPriceFormState(record)
    }))
  }

  const handleCancelEdit = (priceId: string) => {
    setEditBuffers((prev) => {
      const next = { ...prev }
      delete next[priceId]
      return next
    })
  }

  const handleEditChange = (
    priceId: string,
    field: keyof PriceFormState,
    value: string | boolean
  ) => {
    setEditBuffers((prev) => {
      const draft = prev[priceId] ?? emptyPriceForm()
      const nextDraft: PriceFormState = { ...draft }
      if (field === 'isActive') {
        nextDraft.isActive = Boolean(value)
      } else if (field === 'tier') {
        nextDraft.tier = value as PrizeTier | 'bonus'
      } else if (field === 'title') {
        nextDraft.title = value as string
      } else if (field === 'description') {
        nextDraft.description = value as string
      } else if (field === 'odds') {
        nextDraft.odds = value as string
      } else if (field === 'stock') {
        nextDraft.stock = value as string
      }
      return { ...prev, [priceId]: nextDraft }
    })
  }

  const handleUpdatePrice = async (priceId: string) => {
    if (!hasAccess) return
    const draft = editBuffers[priceId]
    if (!draft) return
    if (!draft.title.trim()) {
      setStatusMessage('El premio necesita un nombre')
      return
    }
    setSavingPriceId(priceId)
    try {
      await updatePrize(priceId, formToPayload(draft))
      setStatusMessage('Premio actualizado')
      await onRefreshRewards()
      handleCancelEdit(priceId)
    } catch (error) {
      console.error('Error actualizando premio:', error)
      setStatusMessage('No se pudo actualizar el premio')
    } finally {
      setSavingPriceId(null)
      setTimeout(() => setStatusMessage(null), 2500)
    }
  }

  const handleDeletePrice = async (priceId: string) => {
    if (!hasAccess) return
    setDeletingPriceId(priceId)
    try {
      await deletePrize(priceId)
      setStatusMessage('Premio eliminado')
      await onRefreshRewards()
    } catch (error) {
      console.error('Error eliminando premio:', error)
      setStatusMessage('No se pudo eliminar el premio')
    } finally {
      setDeletingPriceId(null)
      setTimeout(() => setStatusMessage(null), 2500)
    }
  }

  const statOrder: Array<keyof TierStats> = [
    'large',
    'medium',
    'small',
    'bonus'
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            Premios y tiradas
          </h3>
          <p className="text-sm text-gray-500">
            Controla el catálogo de premios y el seguimiento de entregas.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefreshRewards}
          className="inline-flex items-center gap-1 text-sm font-semibold text-green-600 hover:text-green-700"
        >
          <RefreshCw className="h-4 w-4" />
          Refrescar datos
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-green-600" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {statOrder.map((tier) => {
              const bucket = tierStats[tier]
              const tierLabel =
                tier === 'bonus' ? 'Premios bonus' : `Premio ${tier}`
              const accent =
                tier === 'large'
                  ? 'text-purple-700'
                  : tier === 'medium'
                    ? 'text-blue-600'
                    : tier === 'small'
                      ? 'text-green-600'
                      : 'text-amber-600'

              return (
                <div
                  key={`stat-${tier}`}
                  className="bg-white rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase text-gray-500">
                        {tierLabel}
                      </p>
                      <p className={`text-2xl font-bold ${accent}`}>
                        {bucket.delivered + bucket.pending}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {bucket.delivered} entregados · {bucket.pending}{' '}
                        pendientes
                      </p>
                    </div>
                    <Gift className="h-8 w-8 text-gray-300" />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
              <h4 className="text-sm font-semibold text-gray-900">
                Resumen de tiradas
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Tiradas usadas</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {totalTriesPlayed}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Tiradas disponibles</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {totalTriesAvailable}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Premios pendientes</p>
                  <p className="text-2xl font-semibold text-amber-600">
                    {totalPendingPrizes}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">
                  Catálogo de premios
                </h4>
                <span className="text-xs text-gray-500">
                  {priceList.length} registrados
                </span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {priceList.map((price) => {
                  const draft = editBuffers[price.id]
                  return (
                    <div
                      key={price.id}
                      className="border border-gray-200 rounded px-3 py-2 text-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {price.title}
                          </p>
                          <p className="text-gray-500 whitespace-pre-line">
                            {price.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1 text-[11px] text-gray-500">
                            <span className="font-semibold uppercase">
                              {price.tier === 'bonus'
                                ? 'Bonus'
                                : `Premio ${price.tier}`}
                            </span>
                            {typeof price.odds === 'number' && (
                              <span>{price.odds}%</span>
                            )}
                            {typeof price.stock === 'number' && (
                              <span>Stock {price.stock}</span>
                            )}
                            <span
                              className={
                                price.isActive
                                  ? 'text-green-600 font-semibold'
                                  : 'text-gray-400'
                              }
                            >
                              {price.isActive ? 'Activo' : 'Pausado'}
                            </span>
                          </div>
                        </div>
                        {hasAccess && !draft && (
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(price)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600"
                            >
                              <Edit3 className="h-3.5 w-3.5" /> Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePrice(price.id)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600"
                              disabled={deletingPriceId === price.id}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {deletingPriceId === price.id
                                ? 'Eliminando...'
                                : 'Eliminar'}
                            </button>
                          </div>
                        )}
                      </div>
                      {draft && (
                        <div className="space-y-2 text-[11px]">
                          <input
                            type="text"
                            value={draft.title}
                            onChange={(event) =>
                              handleEditChange(
                                price.id,
                                'title',
                                event.target.value
                              )
                            }
                            className="w-full border border-gray-300 rounded px-2 py-1"
                            placeholder="Nombre"
                          />
                          <textarea
                            value={draft.description}
                            onChange={(event) =>
                              handleEditChange(
                                price.id,
                                'description',
                                event.target.value
                              )
                            }
                            className="w-full border border-gray-300 rounded px-2 py-1"
                            placeholder="Descripción"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={draft.tier}
                              onChange={(event) =>
                                handleEditChange(
                                  price.id,
                                  'tier',
                                  event.target.value as PrizeTier | 'bonus'
                                )
                              }
                              className="border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="small">Premio chico</option>
                              <option value="medium">Premio mediano</option>
                              <option value="large">Premio grande</option>
                              <option value="bonus">Bonus</option>
                            </select>
                            <input
                              type="number"
                              value={draft.odds}
                              onChange={(event) =>
                                handleEditChange(
                                  price.id,
                                  'odds',
                                  event.target.value
                                )
                              }
                              placeholder="Probabilidad (%)"
                              className="border border-gray-300 rounded px-2 py-1"
                              min={0}
                              step={0.5}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              value={draft.stock}
                              onChange={(event) =>
                                handleEditChange(
                                  price.id,
                                  'stock',
                                  event.target.value
                                )
                              }
                              placeholder="Stock"
                              className="border border-gray-300 rounded px-2 py-1"
                              min={0}
                            />
                            <label className="flex items-center gap-1 text-gray-600">
                              <input
                                type="checkbox"
                                checked={draft.isActive}
                                onChange={(event) =>
                                  handleEditChange(
                                    price.id,
                                    'isActive',
                                    event.target.checked
                                  )
                                }
                              />
                              Activo
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdatePrice(price.id)}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded bg-green-600 text-white font-semibold"
                              disabled={savingPriceId === price.id}
                            >
                              <Save className="h-3.5 w-3.5" />
                              {savingPriceId === price.id
                                ? 'Guardando...'
                                : 'Guardar'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelEdit(price.id)}
                              className="text-gray-500 font-semibold"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
                {priceList.length === 0 && (
                  <p className="text-xs text-gray-500">
                    Aún no hay premios en Firebase.
                  </p>
                )}
              </div>
              {hasAccess && (
                <div className="space-y-2 text-xs border-t border-dashed border-gray-200 pt-3 mt-3">
                  <p className="font-semibold text-gray-900">
                    Agregar nuevo premio
                  </p>
                  <input
                    type="text"
                    placeholder="Nombre del premio"
                    value={priceDraft.title}
                    onChange={(event) =>
                      handleDraftChange('title', event.target.value)
                    }
                    className="w-full border border-gray-300 rounded px-2 py-1"
                  />
                  <textarea
                    placeholder="Descripción"
                    value={priceDraft.description}
                    onChange={(event) =>
                      handleDraftChange('description', event.target.value)
                    }
                    className="w-full border border-gray-300 rounded px-2 py-1"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={priceDraft.tier}
                      onChange={(event) =>
                        handleDraftChange(
                          'tier',
                          event.target.value as PrizeTier | 'bonus'
                        )
                      }
                      className="border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="small">Premio chico</option>
                      <option value="medium">Premio mediano</option>
                      <option value="large">Premio grande</option>
                      <option value="bonus">Bonus</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Probabilidad (%)"
                      value={priceDraft.odds}
                      onChange={(event) =>
                        handleDraftChange('odds', event.target.value)
                      }
                      className="border border-gray-300 rounded px-2 py-1"
                      min={0}
                      step={0.5}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Stock"
                      value={priceDraft.stock}
                      onChange={(event) =>
                        handleDraftChange('stock', event.target.value)
                      }
                      className="border border-gray-300 rounded px-2 py-1"
                      min={0}
                    />
                    <label className="flex items-center gap-2 text-gray-600">
                      <input
                        type="checkbox"
                        checked={priceDraft.isActive}
                        onChange={(event) =>
                          handleDraftChange('isActive', event.target.checked)
                        }
                      />
                      Activo
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreatePrice}
                    className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded bg-black text-white font-semibold"
                    disabled={creatingPrice}
                  >
                    {creatingPrice ? 'Guardando...' : 'Agregar premio'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900">
                Historial reciente de premios
              </h4>
              <span className="text-xs text-gray-500">
                {recentPrizes.length} registros
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-500 uppercase tracking-wide">
                    <th className="px-2 py-2">Premio</th>
                    <th className="px-2 py-2">Jugador</th>
                    <th className="px-2 py-2">Nivel</th>
                    <th className="px-2 py-2">Fecha</th>
                    <th className="px-2 py-2">Estado</th>
                    <th className="px-2 py-2">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentPrizes.map((prize) => {
                    const isDelivered = Boolean(prize.deliveredAt)
                    const tierLabel =
                      prize.tier === 'bonus'
                        ? 'Bonus'
                        : prizeCatalog[prize.tier]?.label || prize.tier

                    return (
                      <tr key={prize.id} className="text-gray-700">
                        <td className="px-2 py-2">
                          <p className="font-semibold">{prize.prizeTitle}</p>
                          <p className="text-[11px] text-gray-500">
                            {prize.prizeDescription}
                          </p>
                        </td>
                        <td className="px-2 py-2">
                          <p className="font-semibold">{prize.userName}</p>
                          <p className="text-[11px] text-gray-500 font-mono">
                            @{prize.username || 'sin-usuario'}
                          </p>
                        </td>
                        <td className="px-2 py-2 text-[11px] text-gray-500">
                          {tierLabel}
                        </td>
                        <td className="px-2 py-2 text-[11px]">
                          {prize.wonAt.toLocaleString('es-MX', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-2 py-2">
                          {isDelivered ? (
                            <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                              <CheckCircle2 className="h-4 w-4" /> Entregado
                            </span>
                          ) : (
                            <span className="text-amber-600 font-semibold">
                              Pendiente
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          {!isDelivered ? (
                            <button
                              type="button"
                              onClick={() => handleDeliver(prize)}
                              className="text-[11px] font-semibold text-green-600 hover:underline disabled:opacity-50"
                              disabled={deliveringPrizeId === prize.id}
                            >
                              {deliveringPrizeId === prize.id
                                ? 'Marcando...'
                                : 'Marcar entregado'}
                            </button>
                          ) : (
                            <span className="text-[11px] text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {statusMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded px-3 py-2">
              {statusMessage}
            </div>
          )}
        </>
      )}
    </div>
  )
}
