# Panel de Administrador - Minigolf App

## Descripción

El panel de administrador permite a los usuarios con permisos de administrador gestionar la aplicación de minigolf, incluyendo:

- Ver estadísticas generales del sistema
- Gestionar usuarios registrados
- Monitorear partidas activas y finalizadas
- Revisar datos de uso de la aplicación

## Características

### Resumen (Overview)

- Estadísticas totales: usuarios, partidas, torneos
- Datos de actividad: partidas activas, partidas diarias, semanales y mensuales
- Visualización de datos en tarjetas informativas

### Gestión de Usuarios

- Lista completa de usuarios registrados
- Información detallada: email, partidas jugadas, promedio de puntuación
- Estado de actividad (activo/inactivo basado en último login)
- Fecha de último acceso

### Gestión de Partidas

- Lista de partidas recientes (últimas 100)
- Información detallada: fecha, jugadores, hoyos, estado
- Duración de partidas completadas
- Promedio de puntuación por partida

## Acceso al Panel

### Requisitos

1. El usuario debe estar autenticado
2. El usuario debe tener permisos de administrador (`isAdmin: true`)

### URL

El panel está disponible en `/admin` una vez autenticado con permisos.

### Navegación

- El enlace "Admin" aparece automáticamente en la barra de navegación para usuarios administradores
- Icono: engranaje (Settings)
- Accesible tanto en versión desktop como móvil

## Cómo Hacer un Usuario Administrador

Para hacer que un usuario sea administrador, puedes usar las funciones utilitarias:

```typescript
import { makeUserAdmin } from '@/lib/adminUtils'

// Hacer administrador
await makeUserAdmin('user-id-aqui')

// Remover permisos de administrador
await removeUserAdmin('user-id-aqui')
```

### Manualmente en Firebase Console

1. Ir a Firebase Console → Firestore Database
2. Buscar la colección `users`
3. Encontrar el documento del usuario
4. Agregar/editar el campo `isAdmin` y establecerlo como `true`

## Protección de Rutas

El panel utiliza el componente `AdminProtectedRoute` que:

- Verifica autenticación del usuario
- Verifica permisos de administrador
- Muestra mensajes de error apropiados si no se cumplen los requisitos
- Redirige automáticamente si es necesario

## Estructura de Archivos

```
src/
├── app/admin/page.tsx           # Página principal del panel
├── components/
│   └── AdminProtectedRoute.tsx  # Componente de protección
├── lib/
│   ├── admin.ts                 # Funciones de datos admin
│   └── adminUtils.ts            # Utilidades para gestión de admins
└── types/index.ts               # Tipos TypeScript actualizados
```

## Tipos de Datos

### AdminStats

```typescript
interface AdminStats {
  totalUsers: number
  totalGames: number
  totalTournaments: number
  activeGames: number
  todayGames: number
  weeklyGames: number
  monthlyGames: number
}
```

### AdminUser

```typescript
interface AdminUser extends User {
  lastLoginAt?: Date
  isActive: boolean
  gameHistory: {
    gameId: string
    finishedAt: Date
    totalStrokes: number
  }[]
}
```

### AdminGame

```typescript
interface AdminGame extends Game {
  duration?: number // en minutos
  averageScore: number
  playerCount: number
}
```

## Seguridad

- ✅ Protección de rutas implementada
- ✅ Verificación de permisos en frontend
- ⚠️ **Importante**: Se recomienda implementar verificación de permisos también en el backend/reglas de Firestore
- ✅ Validación de tipos TypeScript
- ✅ Manejo de errores

## Mejoras Futuras

- [ ] Gráficos y visualizaciones de datos
- [ ] Exportación de datos a CSV/Excel
- [ ] Filtros avanzados en tablas
- [ ] Acciones de moderación (banear usuarios, eliminar partidas)
- [ ] Sistema de logs de actividad administrativa
- [ ] Notificaciones en tiempo real
- [ ] Dashboard de métricas en tiempo real

## Troubleshooting

### Error: "No se encuentra el módulo @/lib/admin"

- Verificar que el archivo `src/lib/admin.ts` existe
- Verificar configuración de TypeScript paths en `tsconfig.json`

### Error: "Acceso Denegado"

- Verificar que el usuario esté autenticado
- Verificar que el usuario tenga `isAdmin: true` en Firestore

### Error: "Sin Permisos de Administrador"

- El usuario está autenticado pero no tiene permisos de admin
- Usar `makeUserAdmin(userId)` para otorgar permisos
