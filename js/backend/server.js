const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const db = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

const webRoot = path.resolve(__dirname, '..', '..');
app.use('/css', express.static(path.join(webRoot, 'css')));
app.use('/js', express.static(path.join(webRoot, 'js')));
app.use('/db', express.static(path.join(webRoot, 'db')));

app.get('/', (_req, res) => {
  res.sendFile(path.join(webRoot, 'index.html'));
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/health/db', async (_req, res) => {
  try {
    const ping = await db.query('SELECT 1 AS ok');
    const personas = await db.query('SELECT COUNT(*)::int AS total FROM personas');
    res.json({
      ok: true,
      db: ping.rows[0].ok === 1,
      personas: personas.rows[0].total
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.use('/api/personas', require('./routes/personas'));
app.use('/api/productos', require('./routes/productos'));
app.use('/api/pedidos', require('./routes/pedidos'));
app.use('/api/rotaciones', require('./routes/rotaciones'));

function resolveEstado(item, fallbackActivo) {
  if (typeof item.estado !== 'undefined' && item.estado !== null) return Number(item.estado);
  if (typeof fallbackActivo !== 'undefined') return fallbackActivo ? 1 : 0;
  return 1;
}

app.get('/api/snapshot', async (_req, res) => {
  try {
    const [personas, productos, pedidos, rotaciones] = await Promise.all([
      db.query('SELECT id, nombre, estado FROM personas ORDER BY nombre'),
      db.query('SELECT id, nombre, descripcion, precio, estado FROM productos ORDER BY nombre'),
      db.query('SELECT id, persona_id, descripcion, cantidad, precio, estado FROM pedidos ORDER BY created_at'),
      db.query('SELECT id, fecha_iso, excluidos, estado FROM rotaciones ORDER BY fecha_iso DESC')
    ]);

    const rotacionesConAsignaciones = [];
    for (const rot of rotaciones.rows) {
      const asigs = await db.query(
        'SELECT dia, persona_id, estado FROM rotacion_asignaciones WHERE rotacion_id = $1 ORDER BY id',
        [rot.id]
      );
      rotacionesConAsignaciones.push({
        id: rot.id,
        fechaISO: rot.fecha_iso,
        excluidos: rot.excluidos || [],
        estado: rot.estado,
        asignaciones: asigs.rows.map(a => ({ dia: a.dia, personaId: a.persona_id, estado: a.estado }))
      });
    }

    res.json({
      personas: personas.rows,
      productos: productos.rows,
      pedidos: pedidos.rows,
      rotaciones: rotacionesConAsignaciones
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/snapshot/replace', async (req, res) => {
  const snapshot = req.body;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM rotacion_asignaciones');
    await client.query('DELETE FROM rotaciones');
    await client.query('DELETE FROM pedidos');
    await client.query('DELETE FROM productos');
    await client.query('DELETE FROM personas');

    for (const p of snapshot.personas || []) {
      await client.query(
        'INSERT INTO personas (id, nombre, estado) VALUES ($1, $2, $3)',
        [p.id, p.nombre, resolveEstado(p, p.activo)]
      );
    }

    for (const p of snapshot.productos || []) {
      await client.query(
        'INSERT INTO productos (id, nombre, descripcion, precio, estado) VALUES ($1, $2, $3, $4, $5)',
        [p.id, p.nombre, p.descripcion || '', Number(p.precio || 0), resolveEstado(p, p.activo)]
      );
    }

    for (const p of snapshot.pedidos || []) {
      await client.query(
        'INSERT INTO pedidos (id, persona_id, descripcion, cantidad, precio, estado) VALUES ($1, $2, $3, $4, $5, $6)',
        [p.id, p.persona_id || p.personaId, p.descripcion, Number(p.cantidad || 1), Number(p.precio || 0), resolveEstado(p)]
      );
    }

    for (const r of snapshot.rotaciones || []) {
      await client.query(
        'INSERT INTO rotaciones (id, fecha_iso, excluidos, estado) VALUES ($1, $2, $3, $4)',
        [r.id, r.fechaISO || r.fecha_iso, JSON.stringify(r.excluidos || []), resolveEstado(r)]
      );
      for (const a of r.asignaciones || []) {
        await client.query(
          'INSERT INTO rotacion_asignaciones (rotacion_id, dia, persona_id, estado) VALUES ($1, $2, $3, $4)',
          [r.id, a.dia, a.persona_id || a.personaId || null, resolveEstado(a)]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});

function pingHealth(port, callback) {
  const req = http.get({ host: '127.0.0.1', port, path: '/api/health', timeout: 1500 }, (res) => {
    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
      callback(res.statusCode === 200 && body.indexOf('"ok":true') !== -1);
    });
  });
  req.on('timeout', () => { req.destroy(); callback(false); });
  req.on('error', () => callback(false));
}

server.on('error', (error) => {
  if (error && error.code === 'EADDRINUSE') {
    return pingHealth(PORT, (isOurApiRunning) => {
      if (isOurApiRunning) {
        console.log(`API ya estaba ejecutándose en http://localhost:${PORT}`);
        process.exit(0);
      }
      console.error(`El puerto ${PORT} está ocupado por otro proceso.`);
      console.error('Usa `npm run start:clean` para liberar el puerto y arrancar.');
      process.exit(1);
    });
  }
  console.error(error);
  process.exit(1);
});
