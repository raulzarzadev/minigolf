import { Aperture, RefreshCw, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { prizeCatalog } from '@/constants/prizes'
import { useAuth } from '@/contexts/AuthContext'
import { PrizeRecord } from '@/lib/prizes'
import { deliverPrizeForUser, incrementUserTries } from '@/lib/tries'
import { AdminUser } from '@/types'

export function UsersTab({
  users,
  prices,
  onRefreshRewards
}: {
  users: AdminUser[]
  prices: PrizeRecord[]
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
    const map = new Map<string, PrizeRecord>()
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
