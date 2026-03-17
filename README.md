# Gestión de Pedidos

Aplicación web para gestionar personas, productos, pedidos y rotación de responsables, con persistencia en PostgreSQL.

## Estructura
- `index.html`
- `css/styles.css`
- `js/frontend/app.js`
- `js/frontend/data.js`
- `js/backend/server.js`
- `js/backend/routes/*.js`
- `js/backend/db/index.js`
- `db/db.sql`

## Base de datos
1. Ejecuta el script `db/db.sql` en PostgreSQL.
2. La conexión por defecto del backend es:

```txt
postgresql://postgres.kcizzknlbhzcegsmqxrv:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres
```

Si deseas cambiarla, define la variable de entorno `DATABASE_URL`.

## Ejecutar backend
```bash
npm install
npm start
```

La app completa queda en `http://localhost:3001` y la API en `http://localhost:3001/api`.

## Ejecutar frontend
Si deseas servir solo archivos estáticos por separado (no recomendado para este setup), puedes usar:

```bash
npx serve -l 5500 .
```

Abre `http://localhost:5500`.

## Deploy en Render
Este repo ya incluye configuración en `render.yaml` para desplegar frontend + backend en un solo servicio.

1. Sube el repositorio a GitHub.
2. En Render: **New + > Blueprint** y selecciona el repo.
3. Configura la variable `DATABASE_URL` en Render (Environment).
4. Deploy.

El health check es `GET /api/health`.

## Comportamiento de borrado
- Personas: borrado lógico (`estado=0`).
- Productos: borrado lógico (`estado=0`).
- Pedidos: borrado lógico (`estado=0`).
- Rotación actual: limpiar cambia `estado=0` en rotación y asignaciones.

## Datos de ejemplo
Archivos JSON en carpeta `db/`:
- `db_pedidos.json`
- `pedidos-2025-11-26.json`
- `pedidos-2025-11-26_v2.json`
