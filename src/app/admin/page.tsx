'use client'

import { useEffect, useState } from 'react'
import AdminProtectedRoute from '@/components/AdminProtectedRoute'
import { GamesTab } from '@/components/admin/games-tab'
import { OverviewTab } from '@/components/admin/over-view-tab'
import { RewardsTab } from '@/components/admin/rewards-tab'
import { UsersTab } from '@/components/admin/users-tab'
import { useAuth } from '@/contexts/AuthContext'
import { getAdminGames, getAdminStats, getAdminUsers } from '@/lib/admin'
import { checkMigrationStatus, migrateExistingUsers } from '@/lib/migration'
import { listPrizes, PrizeRecord } from '@/lib/prizes'
import { createSampleData } from '@/lib/sampleData'
import { AdminGame, AdminStats, AdminUser } from '@/types'

export default function AdminPanel() {
  const { user, isAdmin } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [games, setGames] = useState<AdminGame[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'games' | 'rewards' | 'migration'
  >('overview')
  const [prices, setPrices] = useState<PrizeRecord[]>([])
  const [rewardsLoading, setRewardsLoading] = useState(true)
  const refreshRewardCenter = async () => {
    setRewardsLoading(true)
    try {
      const [remotePrices, latestUsers] = await Promise.all([
        listPrizes(),
        getAdminUsers({ includeHistory: false })
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
        const usersData = await getAdminUsers({ includeHistory: false })
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
