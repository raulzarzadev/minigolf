# 🔥 Configuración de Firebase para Minigolf

## 📋 Pasos para configurar Firebase

### 1. Crear proyecto en Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Crear un proyecto"
3. Nombra tu proyecto: `minigolf-app` (o el nombre que prefieras)
4. Habilita Google Analytics (opcional)
5. Crea el proyecto

### 2. Configurar Authentication

1. En el panel izquierdo, ve a **Authentication**
2. Haz clic en **Get started**
3. Ve a la pestaña **Sign-in method**
4. Habilita **Google** como proveedor
   - Haz clic en Google
   - Activa el toggle "Enable"
   - Configura el email de soporte del proyecto
   - Guarda los cambios

### 3. Configurar Firestore Database

1. En el panel izquierdo, ve a **Firestore Database**
2. Haz clic en **Create database**
3. Selecciona **Start in test mode** (por ahora)
4. Elige una ubicación cercana (ej: us-central)
5. Crea la base de datos

### 4. Obtener las credenciales

1. Ve a **Project Settings** (ícono de engranaje)
2. En la pestaña **General**, baja hasta **Your apps**
3. Haz clic en **Add app** y selecciona **Web** (</>)
4. Registra tu app con el nombre "Minigolf Web"
5. Copia la configuración que aparece

### 5. Actualizar .env.local

Las credenciales ya están configuradas en el archivo `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
```

## 🛡️ Configurar reglas de seguridad (Firestore)

Ve a **Firestore Database > Rules** y usa estas reglas básicas:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Games can be read and written by authenticated users
    match /games/{gameId} {
      allow read, write: if request.auth != null;
    }

    // Tournaments can be read by all authenticated users
    match /tournaments/{tournamentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null; // Solo admins en producción
    }
  }
}
```

## ✅ Verificar configuración

Una vez configurado todo:

1. Reinicia el servidor: `pnpm dev`
2. Ve a `http://localhost:3004`
3. Haz clic en "Continuar con Google"
4. Deberías poder autenticarte correctamente

## 🔧 Solución de problemas comunes

### Error: "auth/invalid-api-key"

- Verifica que las credenciales en `.env.local` sean correctas
- Asegúrate de haber habilitado Authentication en Firebase

### Error: "auth/unauthorized-domain"

- Ve a Authentication > Settings > Authorized domains
- Agrega `localhost` a la lista de dominios autorizados

### Error de popup bloqueado

- Permite popups en tu navegador para localhost
- O usa `signInWithRedirect` en lugar de `signInWithPopup`

## 🚀 Próximos pasos

Una vez que la autenticación funcione:

1. Crear tu primera partida
2. Invitar amigos
3. ¡Disfrutar del minigolf digital! 🏌️‍♂️
