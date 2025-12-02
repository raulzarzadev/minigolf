'use client'

import {
  CheckCircle2,
  Dice5,
  Edit3,
  Gift,
  Loader2,
  RefreshCw,
  Save,
  Trash2
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import AdminProtectedRoute from '@/components/AdminProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { getAdminGames, getAdminStats, getAdminUsers } from '@/lib/admin'
import { checkMigrationStatus, migrateExistingUsers } from '@/lib/migration'
import {
  createPrice,
  deletePrice,
  listPrices,
  PriceRecord,
  updatePrice
} from '@/lib/prices'
import {
  getAllRewardStates,
  getPrizeDeliveryStats,
  getRewardConfig,
  grantAdminRolls,
  markPrizeDelivered,
  PrizeTier,
  prizeCatalog,
  RewardConfig,
  RewardPrize,
  RewardRoll,
  RewardState,
  updateRewardOdds
} from '@/lib/rewards'
import { createSampleData } from '@/lib/sampleData'
import { AdminGame, AdminStats, AdminUser, User } from '@/types'

export default function AdminPanel() {
  const { user } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [games, setGames] = useState<AdminGame[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'games' | 'rewards' | 'migration'
  >('overview')
  const [rewardStates, setRewardStates] = useState<RewardState[]>([])
  const [rewardConfig, setRewardConfig] = useState<RewardConfig | null>(null)
  const [deliveryStats, setDeliveryStats] = useState<
    Record<RewardPrize, number>
  >({
    large: 0,
    medium: 0,
    small: 0,
    none: 0
  })
  const [prices, setPrices] = useState<PriceRecord[]>([])
  const [rewardsLoading, setRewardsLoading] = useState(true)
  const refreshRewardCenter = async () => {
    setRewardsLoading(true)
    try {
      const states = getAllRewardStates()
      setRewardStates(states)
      setRewardConfig(getRewardConfig())
      setDeliveryStats(getPrizeDeliveryStats())
      const remotePrices = await listPrices()
      setPrices(remotePrices)
    } catch (error) {
      console.error('Error loading reward data:', error)
    } finally {
      setRewardsLoading(false)
    }
  }

  useEffect(() => {
    refreshRewardCenter()
  }, [])

  useEffect(() => {
    console.log('AdminPanel useEffect - user:', user)
    if (!user || !user.isAdmin) {
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
  }, [user])

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
      <div className="min-h-screen bg-gray-50">
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
            <p>Is Admin: {user?.isAdmin?.toString() || 'false'}</p>
            <p>Stats: {stats ? 'Loaded' : 'Not loaded'}</p>
            <p>Users count: {users.length}</p>
            <p>Games count: {games.length}</p>
          </div>

          {activeTab === 'overview' && <OverviewTab stats={stats} />}
          {activeTab === 'users' && (
            <UsersTab
              users={users}
              games={games}
              rewardStates={rewardStates}
              adminUser={user}
              onRefreshRewards={refreshRewardCenter}
            />
          )}
          {activeTab === 'games' && <GamesTab games={games} />}
          {activeTab === 'rewards' && (
            <RewardsTab
              rewardConfig={rewardConfig}
              deliveryStats={deliveryStats}
              rewardStates={rewardStates}
              games={games}
              users={users}
              prices={prices}
              loading={rewardsLoading}
              onRefreshRewards={refreshRewardCenter}
              adminUser={user}
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
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
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

type PendingPrize = RewardRoll & { gameId: string }

interface UserRewardSummary {
  availableRolls: number
  totalRolls: number
  deliveredPrizes: number
  pendingPrizes: PendingPrize[]
  states: RewardState[]
}

type RecentRoll = RewardRoll & { gameId: string }

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

function RewardsTab({
  rewardConfig,
  deliveryStats,
  rewardStates,
  games,
  users,
  prices,
  loading,
  onRefreshRewards,
  adminUser
}: {
  rewardConfig: RewardConfig | null
  deliveryStats: Record<RewardPrize, number>
  rewardStates: RewardState[]
  games: AdminGame[]
  users: AdminUser[]
  prices: PriceRecord[]
  loading: boolean
  onRefreshRewards: () => void
  adminUser: User | null
}) {
  const [oddsDraft, setOddsDraft] = useState({
    small: '10',
    medium: '5',
    large: '2'
  })
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

  const hasAccess = !!adminUser?.isAdmin

  useEffect(() => {
    if (rewardConfig) {
      setOddsDraft({
        small: Math.round((rewardConfig.odds.small || 0) * 100).toString(),
        medium: Math.round((rewardConfig.odds.medium || 0) * 100).toString(),
        large: Math.round((rewardConfig.odds.large || 0) * 100).toString()
      })
    }
  }, [rewardConfig])

  const gameMap = useMemo(() => {
    const map = new Map<string, AdminGame>()
    games.forEach((game) => map.set(game.id, game))
    return map
  }, [games])

  const userMap = useMemo(() => {
    const map = new Map<string, AdminUser>()
    users.forEach((u) => map.set(u.id, u))
    return map
  }, [users])

  const recentRolls = useMemo<RecentRoll[]>(() => {
    const entries: RecentRoll[] = []
    rewardStates.forEach((state) => {
      state.rollHistory.forEach((roll) => {
        entries.push({ ...roll, gameId: state.gameId })
      })
    })
    return entries.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20)
  }, [rewardStates])

  const priceList = prices

  const handleSaveOdds = async () => {
    if (!hasAccess) {
      setStatusMessage('Solo los administradores pueden editar probabilidades')
      return
    }
    updateRewardOdds({
      small: Number(oddsDraft.small) / 100,
      medium: Number(oddsDraft.medium) / 100,
      large: Number(oddsDraft.large) / 100
    })
    setStatusMessage('Probabilidades actualizadas')
    await onRefreshRewards()
    setTimeout(() => setStatusMessage(null), 2500)
  }

  const handleDeliver = async (roll: RecentRoll) => {
    if (!hasAccess || roll.tier === 'none') return
    const result = markPrizeDelivered({
      admin: adminUser,
      gameId: roll.gameId,
      rollId: roll.id
    })
    if (result) {
      setStatusMessage('Premio marcado como entregado')
      await onRefreshRewards()
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

  const statOrder: RewardPrize[] = ['large', 'medium', 'small', 'none']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            Premios y dados
          </h3>
          <p className="text-sm text-gray-500">
            Controla las probabilidades, catálogo de premios y seguimiento de
            entregas.
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
              const count = deliveryStats[tier] || 0
              const label =
                tier === 'none'
                  ? 'Intentos sin premio'
                  : prizeCatalog[tier as PrizeTier]?.label || `Premio ${tier}`
              const accent =
                tier === 'large'
                  ? 'text-purple-700'
                  : tier === 'medium'
                  ? 'text-blue-600'
                  : tier === 'small'
                  ? 'text-green-600'
                  : 'text-gray-500'

              return (
                <div
                  key={`stat-${tier}`}
                  className="bg-white rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase text-gray-500">{label}</p>
                      <p className={`text-2xl font-bold ${accent}`}>{count}</p>
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
                Probabilidades de premios
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {(['small', 'medium', 'large'] as PrizeTier[]).map((tier) => (
                  <label
                    key={`odds-${tier}`}
                    className="text-xs text-gray-600 space-y-1"
                  >
                    <span className="font-semibold capitalize">
                      {tier === 'small'
                        ? 'Premio chico'
                        : tier === 'medium'
                        ? 'Premio mediano'
                        : 'Premio grande'}
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={oddsDraft[tier]}
                      onChange={(event) =>
                        setOddsDraft((prev) => ({
                          ...prev,
                          [tier]: event.target.value
                        }))
                      }
                      className="w-full border border-gray-300 rounded px-2 py-1"
                    />
                    <span className="text-[11px] text-gray-400">
                      Probabilidad %
                    </span>
                  </label>
                ))}
              </div>
              <button
                type="button"
                onClick={handleSaveOdds}
                className="inline-flex items-center px-3 py-1.5 rounded bg-green-600 text-white text-xs font-semibold"
              >
                Guardar probabilidades
              </button>
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
                Historial reciente de tiradas
              </h4>
              <span className="text-xs text-gray-500">
                {recentRolls.length} registros
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-500 uppercase tracking-wide">
                    <th className="px-2 py-2">Premio</th>
                    <th className="px-2 py-2">Jugador</th>
                    <th className="px-2 py-2">Juego</th>
                    <th className="px-2 py-2">Fecha</th>
                    <th className="px-2 py-2">Estado</th>
                    <th className="px-2 py-2">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentRolls.map((roll) => {
                    const prizeMeta =
                      roll.tier === 'none'
                        ? {
                            label: 'Sin premio',
                            description: 'No hubo premio en esta tirada.'
                          }
                        : prizeCatalog[roll.tier as PrizeTier]
                    const game = gameMap.get(roll.gameId)
                    const owner = game ? userMap.get(game.createdBy) : null
                    const isDelivered = !!roll.delivered

                    return (
                      <tr key={roll.id} className="text-gray-700">
                        <td className="px-2 py-2">
                          <p className="font-semibold">{prizeMeta?.label}</p>
                          <p className="text-[11px] text-gray-500">
                            {prizeMeta?.description}
                          </p>
                        </td>
                        <td className="px-2 py-2">
                          <p className="font-semibold">
                            {owner?.name || 'Jugador desconocido'}
                          </p>
                          <p className="text-[11px] text-gray-500 font-mono">
                            {owner ? `@${owner.username}` : game?.createdBy}
                          </p>
                        </td>
                        <td className="px-2 py-2 text-[11px] text-gray-500">
                          {roll.gameId}
                        </td>
                        <td className="px-2 py-2 text-[11px]">
                          {new Date(roll.timestamp).toLocaleString('es-MX', {
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
                          ) : roll.tier === 'none' ? (
                            <span className="text-gray-500">Sin premio</span>
                          ) : (
                            <span className="text-amber-600 font-semibold">
                              Pendiente
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          {!isDelivered && roll.tier !== 'none' ? (
                            <button
                              type="button"
                              onClick={() => handleDeliver(roll)}
                              className="text-[11px] font-semibold text-green-600 hover:underline"
                            >
                              Marcar entregado
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
  games,
  rewardStates,
  adminUser,
  onRefreshRewards
}: {
  users: AdminUser[]
  games: AdminGame[]
  rewardStates: RewardState[]
  adminUser: User | null
  onRefreshRewards: () => void
}) {
  const [grantInputs, setGrantInputs] = useState<Record<string, string>>({})
  const [rowStatus, setRowStatus] = useState<Record<string, string | null>>({})

  const gameMap = useMemo(() => {
    const map = new Map<string, AdminGame>()
    games.forEach((game) => {
      map.set(game.id, game)
    })
    return map
  }, [games])

  const rewardSummary = useMemo<Record<string, UserRewardSummary>>(() => {
    const summary: Record<string, UserRewardSummary> = {}

    rewardStates.forEach((state) => {
      const game = gameMap.get(state.gameId)
      if (!game) return
      const ownerId = game.createdBy
      if (!summary[ownerId]) {
        summary[ownerId] = {
          availableRolls: 0,
          totalRolls: 0,
          deliveredPrizes: 0,
          pendingPrizes: [],
          states: []
        }
      }

      const entry = summary[ownerId]
      entry.availableRolls += state.availableRolls
      entry.totalRolls += state.rollHistory.length
      entry.states.push(state)

      state.rollHistory.forEach((roll) => {
        if (roll.tier === 'none') {
          return
        }
        if (roll.delivered) {
          entry.deliveredPrizes += 1
        } else {
          entry.pendingPrizes.push({ ...roll, gameId: state.gameId })
        }
      })
    })

    return summary
  }, [rewardStates, gameMap])

  const handleGrantRolls = (userId: string) => {
    const entry = rewardSummary[userId]
    if (!entry || entry.states.length === 0) {
      setRowStatus((prev) => ({
        ...prev,
        [userId]: 'No hay partidas elegibles'
      }))
      return
    }
    if (!adminUser?.isAdmin) {
      setRowStatus((prev) => ({
        ...prev,
        [userId]: 'Permisos insuficientes'
      }))
      return
    }

    const amount = Number(grantInputs[userId] ?? '1')
    if (!Number.isFinite(amount) || amount <= 0) {
      setRowStatus((prev) => ({
        ...prev,
        [userId]: 'Ingresa una cantidad válida'
      }))
      return
    }

    const targetState = [...entry.states].sort(
      (a, b) => b.updatedAt - a.updatedAt
    )[0]
    grantAdminRolls({
      admin: adminUser,
      gameId: targetState.gameId,
      rolls: amount
    })
    setRowStatus((prev) => ({
      ...prev,
      [userId]: `Se otorgaron ${amount} tiro(s)`
    }))
    setGrantInputs((prev) => ({ ...prev, [userId]: '1' }))
    onRefreshRewards()
    setTimeout(() => {
      setRowStatus((prev) => ({ ...prev, [userId]: null }))
    }, 2500)
  }

  const handleDeliverPrize = (userId: string, prize: PendingPrize) => {
    if (!adminUser?.isAdmin) {
      setRowStatus((prev) => ({
        ...prev,
        [userId]: 'Permisos insuficientes'
      }))
      return
    }

    const result = markPrizeDelivered({
      admin: adminUser,
      gameId: prize.gameId,
      rollId: prize.id
    })
    if (result) {
      setRowStatus((prev) => ({
        ...prev,
        [userId]: 'Premio validado'
      }))
      onRefreshRewards()
      setTimeout(() => {
        setRowStatus((prev) => ({ ...prev, [userId]: null }))
      }, 2500)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Usuarios Registrados ({users.length})
            </h3>
            <p className="text-sm text-gray-500">
              Visualiza dados utilizados, pendientes y valida premios desde
              aquí.
            </p>
          </div>
          <button
            type="button"
            onClick={onRefreshRewards}
            className="inline-flex items-center gap-1 text-sm font-semibold text-green-600 hover:text-green-700"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
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
                  Dados
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
              {users.map((user) => {
                const entry =
                  rewardSummary[user.id] ||
                  ({
                    availableRolls: 0,
                    totalRolls: 0,
                    deliveredPrizes: 0,
                    pendingPrizes: [],
                    states: []
                  } as UserRewardSummary)
                const grantValue = grantInputs[user.id] ?? '1'

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
                        <Dice5 className="h-4 w-4 text-green-600" />
                        Tiradas usadas:{' '}
                        <span className="font-semibold text-gray-900">
                          {entry.totalRolls}
                        </span>
                      </p>
                      <p className="flex items-center gap-1 mt-1">
                        <Dice5 className="h-4 w-4 text-amber-600" />
                        Por tirar:{' '}
                        <span className="font-semibold text-gray-900">
                          {entry.availableRolls}
                        </span>
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top text-xs text-gray-600">
                      <p>
                        Entregados:{' '}
                        <span className="font-semibold text-gray-900">
                          {entry.deliveredPrizes}
                        </span>
                      </p>
                      <p className="mt-1">
                        Pendientes:{' '}
                        <span className="font-semibold text-gray-900">
                          {entry.pendingPrizes.length}
                        </span>
                      </p>
                      {entry.pendingPrizes.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {entry.pendingPrizes.slice(0, 2).map((prize) => (
                            <div
                              key={prize.id}
                              className="flex items-center justify-between gap-2 bg-gray-50 border border-gray-200 rounded px-2 py-1"
                            >
                              <span className="text-[11px] font-semibold text-gray-700">
                                {prizeCatalog[prize.tier as PrizeTier]?.label ||
                                  'Premio'}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeliverPrize(user.id, prize)
                                }
                                className="text-[11px] text-green-600 font-semibold hover:underline"
                              >
                                Validar
                              </button>
                            </div>
                          ))}
                          {entry.pendingPrizes.length > 2 && (
                            <p className="text-[11px] text-gray-500">
                              + {entry.pendingPrizes.length - 2} premio(s)
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
                            value={grantValue}
                            onChange={(event) =>
                              setGrantInputs((prev) => ({
                                ...prev,
                                [user.id]: event.target.value
                              }))
                            }
                            className="w-16 border border-gray-300 rounded px-1 py-1 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleGrantRolls(user.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-600 text-white font-semibold text-xs disabled:opacity-50"
                            disabled={entry.states.length === 0}
                          >
                            Dar tiros
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
            onClick={loadMigrationStatus}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Actualizar Estado
          </button>

          {migrationStatus?.needsMigration && (
            <button
              onCli
              type="button"
              ck={runMigration}
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
