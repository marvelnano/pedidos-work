# Setup rápido (local)

Guía para correr `pedidos-work` en cualquier PC con internet.

## 1) Requisitos

- Node.js **20 LTS** (recomendado)
- npm (viene con Node)
- Internet (la base de datos está en Supabase)

Verifica instalación:

```powershell
node -v
npm -v
```

## 2) Descargar proyecto

```powershell
git clone <URL_DEL_REPO>
cd pedidos-work
```

Si ya tienes el proyecto descargado, solo entra a la carpeta.

## 3) Instalar dependencias

```powershell
npm install
```

## 4) Configurar conexión a base de datos

Crea tu archivo `.env` desde el ejemplo:

```powershell
Copy-Item .env.example .env
```

Abre `.env` y reemplaza `TU_PASSWORD` por tu clave real de Supabase.

Alternativa (solo para la sesión actual de PowerShell):

```powershell
$env:DATABASE_URL="postgresql://postgres.kcizzknlbhzcegsmqxrv:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
```

Notas:
- Usa la URI exacta de Supabase (Session Pooler).
- Si el password tiene caracteres especiales, copia/pega la URI ya generada por Supabase.

## 5) Levantar app

```powershell
npm run start:clean
```

Abre en navegador:

- http://localhost:3001

## 6) Pruebas rápidas

- Salud API: http://localhost:3001/api/health
- Salud DB: http://localhost:3001/api/health/db

Si `api/health/db` devuelve `ok: true`, la conexión a Supabase está bien.

## Solución de problemas

### Puerto ocupado

Usa:

```powershell
npm run start:clean
```

### No carga datos

1. Verifica `http://localhost:3001/api/health/db`
2. Revisa que `DATABASE_URL` sea correcta
3. Confirma que tienes internet

### Error por versión de Node

Actualiza a Node.js 20 LTS.
