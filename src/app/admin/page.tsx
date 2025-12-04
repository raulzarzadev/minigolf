'use client'

import {
  Aperture,
  CheckCircle2,
  Edit3,
  Gift,
  Loader2,
  RefreshCw,
  Save,
  Search,
  Trash2
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import AdminProtectedRoute from '@/components/AdminProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { prizeCatalog } from '@/constants/prizes'
import { getAdminGames, getAdminStats, getAdminUsers } from '@/lib/admin'
import { checkMigrationStatus, migrateExistingUsers } from '@/lib/migration'
import {
  createPrice,
  deletePrice,
  listPrices,
  PriceRecord,
  updatePrice
} from '@/lib/prices'
import { createSampleData } from '@/lib/sampleData'
import { deliverPrizeForUser, incrementUserTries } from '@/lib/tries'
import { AdminGame, AdminStats, AdminUser } from '@/types'
import { PrizeTier } from '@/types/rewards'

export default function AdminPanel() {
  const { user, isAdmin } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [games, setGames] = useState<AdminGame[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'games' | 'rewards' | 'migration'
  >('overview')
  const [prices, setPrices] = useState<PriceRecord[]>([])
  const [rewardsLoading, setRewardsLoading] = useState(true)
  const refreshRewardCenter = async () => {
    setRewardsLoading(true)
    try {
      const [remotePrices, latestUsers] = await Promise.all([
        listPrices(),
        getAdminUsers()
      ])
      setPrices(remotePrices)
      setUsers(latestUsers)
    } catch (error) {
      console.error('Error loading reward data:', error)
    } finally {
      setRewardsLoading(false)
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: solo se quiere ejecutar una vez
  useEffect(() => {
    refreshRewardCenter()
  }, [])

  useEffect(() => {
    console.log('AdminPanel useEffect - user:', user)
    if (!user || !isAdmin) {
      console.log('User not admin or not logged in')
      return
    }

    const loadAdminData = async () => {
      try {
        console.log('Loading admin data...')
        setLoading(true)

        console.log('Fetching stats...')
        const statsData = await getAdminStats()
        console.log('Stats data:', statsData)

        console.log('Fetching users...')
        const usersData = await getAdminUsers()
        console.log('Users data:', usersData)

        console.log('Fetching games...')
        const gamesData = await getAdminGames()
        console.log('Games data:', gamesData)

        setStats(statsData)
        setUsers(usersData)
        setGames(gamesData)
      } catch (error) {
        console.error('Error loading admin data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAdminData()
  }, [user, isAdmin])

  if (loading) {
    return (
      <AdminProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
        </div>
      </AdminProtectedRoute>
    )
  }
  return (
    <AdminProtectedRoute>
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Panel de Administrador
                </h1>
                <p className="text-gray-600 mt-2">
                  Gestiona usuarios, partidas y estadísticas del sistema
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await createSampleData()
                    alert('Datos de ejemplo creados!')
                    window.location.reload()
                  } catch (error) {
                    console.error('Error creating sample data:', error)
                    alert('Error al crear datos de ejemplo')
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Crear Datos de Ejemplo
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Resumen' },
                { id: 'users', label: 'Usuarios' },
                { id: 'games', label: 'Partidas' },
                { id: 'rewards', label: 'Premios' },
                { id: 'migration', label: 'Migración' }
              ].map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() =>
                    setActiveTab(
                      tab.id as
                        | 'overview'
                        | 'users'
                        | 'games'
                        | 'rewards'
                        | 'migration'
                    )
                  }
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="mb-4 p-4 bg-gray-100 rounded">
            <h3 className="font-bold">Debug Info:</h3>
            <p>Loading: {loading.toString()}</p>
            <p>User: {user?.name || 'No user'}</p>
            <p>Is Admin: {isAdmin?.toString() || 'false'}</p>
            <p>Stats: {stats ? 'Loaded' : 'Not loaded'}</p>
            <p>Users count: {users.length}</p>
            <p>Games count: {games.length}</p>
          </div>

          {activeTab === 'overview' && <OverviewTab stats={stats} />}
          {activeTab === 'users' && (
            <UsersTab
              users={users}
              prices={prices}
              onRefreshRewards={refreshRewardCenter}
            />
          )}
          {activeTab === 'games' && <GamesTab games={games} />}
          {activeTab === 'rewards' && (
            <RewardsTab
              users={users}
              prices={prices}
              loading={rewardsLoading}
              onRefreshRewards={refreshRewardCenter}
            />
          )}
          {activeTab === 'migration' && <MigrationTab />}
        </div>
      </div>
    </AdminProtectedRoute>
  )
}

function OverviewTab({ stats }: { stats: AdminStats | null }) {
  console.log('OverviewTab - stats:', stats)

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Cargando estadísticas...</p>
      </div>
    )
  }

  const statCards = [
    { label: 'Total de Usuarios', value: stats.totalUsers, color: 'blue' },
    { label: 'Total de Partidas', value: stats.totalGames, color: 'green' },
    { label: 'Torneos', value: stats.totalTournaments, color: 'purple' },
    { label: 'Partidas Activas', value: stats.activeGames, color: 'yellow' },
    { label: 'Partidas Hoy', value: stats.todayGames, color: 'indigo' },
    { label: 'Partidas Esta Semana', value: stats.weeklyGames, color: 'pink' }
  ]

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((card, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: false
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="shrink-0">
                <div
                  className={`w-8 h-8 bg-${card.color}-500 rounded-md flex items-center justify-center`}
                >
                  <span className="text-white font-bold">{card.value}</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {card.label}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {card.value.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Actividad Semanal
          </h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
            <p className="text-gray-500">Gráfico de actividad semanal</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Usuarios Más Activos
          </h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
            <p className="text-gray-500">Lista de usuarios más activos</p>
          </div>
        </div>
      </div>
    </div>
  )
}

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

const toPriceFormState = (record: PriceRecord): PriceFormState => ({
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

function RewardsTab({
  users,
  prices,
  loading,
  onRefreshRewards
}: {
  users: AdminUser[]
  prices: PriceRecord[]
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
    const map = new Map<string, PriceRecord>()
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
        const fallback =
          tier === 'bonus' ? null : prizeCatalog[tier as PrizeTier]
        const wonAt = entry.wonAt ?? new Date()
        rows.push({
          id: `${candidate.id}-${entry.prizeId}-${wonAt.getTime()}-${index}`,
          userId: candidate.id,
          username: candidate.username,
          userName: candidate.name,
          prizeId: entry.prizeId,
          prizeTitle: record?.title ?? fallback?.label ?? 'Premio sorpresa',
          prizeDescription:
            record?.description ??
            fallback?.description ??
            'Valida este premio con el staff.',
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
      await createPrice(formToPayload(priceDraft))
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

  const handleStartEdit = (record: PriceRecord) => {
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
      await updatePrice(priceId, formToPayload(draft))
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
      await deletePrice(priceId)
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
                tier === 'bonus'
                  ? 'Premios bonus'
                  : prizeCatalog[tier]?.label || `Premio ${tier}`
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

function UsersTab({
  users,
  prices,
  onRefreshRewards
}: {
  users: AdminUser[]
  prices: PriceRecord[]
  onRefreshRewards: () => void
}) {
  const { isAdmin } = useAuth()
  const [rowStatus, setRowStatus] = useState<Record<string, string | null>>({})
  const [tiradaInputs, setTiradaInputs] = useState<Record<string, string>>({})
  const [tiradaBalances, setTiradaBalances] = useState<Record<string, number>>(
    {}
  )
  const [searchTerm, setSearchTerm] = useState('')

  const prizeMap = useMemo(() => {
    const map = new Map<string, PriceRecord>()
    prices.forEach((prize) => {
      map.set(prize.id, prize)
    })
    return map
  }, [prices])

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) {
      return users
    }

    const normalizedTerm = searchTerm.trim().toLowerCase()
    return users.filter((candidate) =>
      [candidate.name, candidate.email, candidate.username, candidate.id]
        .filter(Boolean)
        .some((value) =>
          (value as string).toLowerCase().includes(normalizedTerm)
        )
    )
  }, [users, searchTerm])

  const handleDeliverPrize = async (userId: string, prizeId: string) => {
    if (!isAdmin) {
      setRowStatus((prev) => ({
        ...prev,
        [userId]: 'Permisos insuficientes'
      }))
      return
    }

    try {
      await deliverPrizeForUser(userId, prizeId)
      setRowStatus((prev) => ({
        ...prev,
        [userId]: 'Premio validado'
      }))
      await onRefreshRewards()
      setTimeout(() => {
        setRowStatus((prev) => ({ ...prev, [userId]: null }))
      }, 2500)
    } catch (error) {
      console.error('Error validando premio:', error)
      setRowStatus((prev) => ({
        ...prev,
        [userId]: 'No se pudo validar'
      }))
    }
  }

  const handleGrantTiradas = async (userId: string) => {
    if (!isAdmin) {
      setRowStatus((prev) => ({
        ...prev,
        [userId]: 'Permisos insuficientes'
      }))
      return
    }

    const amount = Number(tiradaInputs[userId] ?? '1')
    if (!Number.isFinite(amount) || amount <= 0) {
      setRowStatus((prev) => ({
        ...prev,
        [userId]: 'Ingresa una cantidad válida'
      }))
      return
    }

    try {
      const updatedTries = await incrementUserTries(userId, amount)
      setTiradaBalances((prev) => ({
        ...prev,
        [userId]: updatedTries.triesLeft
      }))
      setTiradaInputs((prev) => ({ ...prev, [userId]: '1' }))
      setRowStatus((prev) => ({
        ...prev,
        [userId]: `+${amount} tirada(s) agregada(s)`
      }))
      setTimeout(() => {
        setRowStatus((prev) => ({ ...prev, [userId]: null }))
      }, 2500)
    } catch (error) {
      console.error('Error agregando tiradas:', error)
      setRowStatus((prev) => ({
        ...prev,
        [userId]: 'Error al agregar tiradas'
      }))
    }
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Usuarios Registrados ({filteredUsers.length} de {users.length})
            </h3>
            <p className="text-sm text-gray-500">
              Visualiza tiradas de ruleta, tiradas globales y valida premios
              desde aquí.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar usuario"
                className="w-full border border-gray-300 rounded-md py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
            <button
              type="button"
              onClick={onRefreshRewards}
              className="inline-flex items-center justify-center gap-1 text-sm font-semibold text-green-600 hover:text-green-700"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                  Datos de juego
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                  Tiradas
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                  Premios
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-sm text-gray-500"
                    colSpan={5}
                  >
                    No se encontraron usuarios con ese criterio.
                  </td>
                </tr>
              )}
              {filteredUsers.map((user) => {
                const tiradaValue = tiradaInputs[user.id] ?? '1'
                const triesInfo = user.tries
                const saldoTiradas =
                  tiradaBalances[user.id] ?? triesInfo?.triesLeft ?? 0
                const totalRolls = triesInfo?.triesPlayed ?? 0
                const pendingPrizes =
                  triesInfo?.prizesWon?.filter((entry) => !entry.deliveredAt) ??
                  []
                const deliveredCount =
                  (triesInfo?.prizesWon?.length ?? 0) - pendingPrizes.length

                return (
                  <tr key={user.id}>
                    <td className="px-4 py-4 align-top">
                      <div className="font-semibold text-gray-900">
                        {user.name}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        @{user.username || 'sin-usuario'}
                      </div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                      <div className="mt-2">
                        <span
                          className={`inline-flex px-2 py-1 text-[11px] font-semibold rounded-full ${
                            user.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-xs text-gray-600 space-y-1">
                      <p>
                        Partidas:{' '}
                        <span className="font-semibold">
                          {user.gamesPlayed}
                        </span>
                      </p>
                      <p>
                        Promedio:{' '}
                        <span className="font-semibold">
                          {user.averageScore.toFixed(1)}
                        </span>
                      </p>
                      <p>
                        Último login:{' '}
                        <span className="font-semibold">
                          {user.lastLoginAt
                            ? new Date(user.lastLoginAt).toLocaleDateString()
                            : 'Nunca'}
                        </span>
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top text-xs text-gray-600">
                      <p className="flex items-center gap-1">
                        <Aperture className="h-4 w-4 text-green-600" />
                        Tiradas usadas:{' '}
                        <span className="font-semibold text-gray-900">
                          {totalRolls}
                        </span>
                      </p>
                      <p className="flex items-center gap-1 mt-1 text-green-700">
                        <Aperture className="h-4 w-4" /> Tiradas disponibles:{' '}
                        <span className="font-semibold">{saldoTiradas}</span>
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top text-xs text-gray-600">
                      <p>
                        Entregados:{' '}
                        <span className="font-semibold text-gray-900">
                          {deliveredCount}
                        </span>
                      </p>
                      <p className="mt-1">
                        Pendientes:{' '}
                        <span className="font-semibold text-gray-900">
                          {pendingPrizes.length}
                        </span>
                      </p>
                      {pendingPrizes.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {pendingPrizes.slice(0, 2).map((prize) => {
                            const record = prizeMap.get(prize.prizeId)
                            const tierMeta =
                              record?.tier && record.tier !== 'bonus'
                                ? prizeCatalog[record.tier]
                                : null
                            const label =
                              record?.title ??
                              tierMeta?.label ??
                              'Premio sorpresa'
                            return (
                              <div
                                key={`${prize.prizeId}-${prize.wonAt}`}
                                className="flex items-center justify-between gap-2 bg-gray-50 border border-gray-200 rounded px-2 py-1"
                              >
                                <span className="text-[11px] font-semibold text-gray-700">
                                  {label}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeliverPrize(user.id, prize.prizeId)
                                  }
                                  className="text-[11px] text-green-600 font-semibold hover:underline"
                                >
                                  Validar
                                </button>
                              </div>
                            )
                          })}
                          {pendingPrizes.length > 2 && (
                            <p className="text-[11px] text-gray-500">
                              + {pendingPrizes.length - 2} premio(s)
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top text-xs text-gray-600">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            value={tiradaValue}
                            onChange={(event) =>
                              setTiradaInputs((prev) => ({
                                ...prev,
                                [user.id]: event.target.value
                              }))
                            }
                            className="w-16 border border-gray-300 rounded px-1 py-1 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleGrantTiradas(user.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-600 text-white font-semibold text-xs"
                          >
                            Agregar tiradas
                          </button>
                        </div>
                        {rowStatus[user.id] && (
                          <p className="text-[11px] text-green-600 font-medium">
                            {rowStatus[user.id]}
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function GamesTab({ games }: { games: AdminGame[] }) {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Partidas ({games.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jugadores
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hoyos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duración
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Promedio
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {games.map((game) => (
                <tr key={game.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-gray-900">
                      {game.id.slice(0, 8)}...
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(game.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {game.playerCount}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {game.holeCount}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        game.status === 'finished'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {game.status === 'finished' ? 'Terminada' : 'En Progreso'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {game.duration ? `${game.duration} min` : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {game.averageScore.toFixed(1)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function MigrationTab() {
  const [migrationStatus, setMigrationStatus] = useState<{
    totalUsers: number
    usersWithUsername: number
    needsMigration: boolean
  } | null>(null)
  const [migrating, setMigrating] = useState(false)
  const [migrationResult, setMigrationResult] = useState<{
    migratedCount: number
    skippedCount: number
  } | null>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: false
  useEffect(() => {
    loadMigrationStatus()
  }, [])

  const loadMigrationStatus = async () => {
    try {
      const status = await checkMigrationStatus()
      setMigrationStatus(status)
    } catch (error) {
      console.error('Error loading migration status:', error)
    }
  }

  const runMigration = async () => {
    try {
      setMigrating(true)
      const result = await migrateExistingUsers()
      setMigrationResult(result)
      // Refresh status after migration
      await loadMigrationStatus()
    } catch (error) {
      console.error('Migration failed:', error)
      alert(
        'Error durante la migración: ' +
          (error instanceof Error ? error.message : 'Error desconocido')
      )
    } finally {
      setMigrating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Migración de Usernames
        </h3>
        <p className="text-gray-600 mb-6">
          Esta herramienta permite migrar usuarios existentes para agregar
          usernames únicos.
        </p>
      </div>

      {/* Migration Status */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-3">
          Estado de la Migración
        </h4>

        {migrationStatus ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total de usuarios:</span>
              <span className="font-semibold">
                {migrationStatus.totalUsers}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Usuarios con username:</span>
              <span className="font-semibold">
                {migrationStatus.usersWithUsername}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Necesita migración:</span>
              <span
                className={`font-semibold ${
                  migrationStatus.needsMigration
                    ? 'text-orange-600'
                    : 'text-green-600'
                }`}
              >
                {migrationStatus.needsMigration ? 'Sí' : 'No'}
              </span>
            </div>

            {migrationStatus.needsMigration && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded">
                <p className="text-orange-800 text-sm">
                  Hay{' '}
                  {migrationStatus.totalUsers -
                    migrationStatus.usersWithUsername}{' '}
                  usuario(s) que necesitan username.
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500">Cargando estado...</p>
        )}
      </div>

      {/* Migration Actions */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-3">Acciones</h4>

        <div className="space-y-3">
          <button
            type="button"
            onClick={loadMigrationStatus}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Actualizar Estado
          </button>

          {migrationStatus?.needsMigration && (
            <button
              type="button"
              onClick={runMigration}
              disabled={migrating}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {migrating ? 'Migrando...' : 'Ejecutar Migración'}
            </button>
          )}
        </div>
      </div>

      {/* Migration Results */}
      {migrationResult && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-3">
            Resultado de la Migración
          </h4>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Usuarios migrados:</span>
              <span className="font-semibold text-green-600">
                {migrationResult.migratedCount}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Usuarios omitidos:</span>
              <span className="font-semibold text-gray-600">
                {migrationResult.skippedCount}
              </span>
            </div>
          </div>

          {migrationResult.migratedCount > 0 && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800 text-sm">
                ✅ Migración completada exitosamente.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
