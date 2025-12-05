import { AdminStats } from '@/types'

export function OverviewTab({ stats }: { stats: AdminStats | null }) {
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
