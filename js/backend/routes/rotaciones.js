const express = require('express');
const router = express.Router();
const db = require('../db');

async function mapRotacion(baseRow) {
  const asigs = await db.query(
    'SELECT dia, persona_id FROM rotacion_asignaciones WHERE rotacion_id = $1 AND estado = 1 ORDER BY id',
    [baseRow.id]
  );
  return {
    id: baseRow.id,
    fechaISO: baseRow.fecha_iso,
    excluidos: baseRow.excluidos || [],
    asignaciones: asigs.rows.map(a => ({ dia: a.dia, personaId: a.persona_id }))
  };
}

router.get('/current', async (_req, res) => {
  try {
    const result = await db.query('SELECT id, fecha_iso, excluidos FROM rotaciones WHERE estado = 1 ORDER BY fecha_iso DESC LIMIT 1');
    if (!result.rows.length) return res.json(null);
    res.json(await mapRotacion(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', async (_req, res) => {
  try {
    const result = await db.query('SELECT id, fecha_iso, excluidos FROM rotaciones WHERE estado = 1 ORDER BY fecha_iso DESC OFFSET 1');
    const list = [];
    for (const row of result.rows) {
      list.push(await mapRotacion(row));
    }
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/rotate', async (req, res) => {
  const { id, fechaISO, asignaciones = [], excluidos = [] } = req.body;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('INSERT INTO rotaciones (id, fecha_iso, excluidos, estado) VALUES ($1, $2, $3, 1)', [id, fechaISO, JSON.stringify(excluidos)]);
    for (const a of asignaciones) {
      await client.query('INSERT INTO rotacion_asignaciones (rotacion_id, dia, persona_id, estado) VALUES ($1, $2, $3, 1)', [id, a.dia, (typeof a.personaId === 'undefined' ? null : a.personaId)]);
    }
    await client.query('COMMIT');
    res.status(201).json({ message: 'Rotación creada' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.patch('/current/dia', async (req, res) => {
  const { dia, personaId } = req.body;
  try {
    const current = await db.query('SELECT id, excluidos FROM rotaciones WHERE estado = 1 ORDER BY fecha_iso DESC LIMIT 1');
    if (!current.rows.length) return res.status(404).json({ error: 'No hay rotación actual' });
    const rotacionId = current.rows[0].id;
    const excluidos = Array.isArray(current.rows[0].excluidos) ? current.rows[0].excluidos : [];

    if (personaId === null) {
      const prev = await db.query('SELECT persona_id FROM rotacion_asignaciones WHERE rotacion_id = $1 AND dia = $2 AND estado = 1 LIMIT 1', [rotacionId, dia]);
      const prevId = (prev.rows[0] && prev.rows[0].persona_id) ? prev.rows[0].persona_id : null;
      if (prevId && !excluidos.includes(prevId)) excluidos.push(prevId);
      await db.query('UPDATE rotaciones SET excluidos = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(excluidos), rotacionId]);
    }

    await db.query(
      'UPDATE rotacion_asignaciones SET persona_id = $1, updated_at = NOW() WHERE rotacion_id = $2 AND dia = $3 AND estado = 1',
      [personaId, rotacionId, dia]
    );
    res.json({ message: 'Día actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/clear', async (_req, res) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const current = await client.query('SELECT id FROM rotaciones WHERE estado = 1 ORDER BY fecha_iso DESC LIMIT 1');
    if (current.rows.length) {
      const rotacionId = current.rows[0].id;
      await client.query('UPDATE rotacion_asignaciones SET estado = 0, updated_at = NOW() WHERE rotacion_id = $1 AND estado = 1', [rotacionId]);
      await client.query('UPDATE rotaciones SET estado = 0, updated_at = NOW() WHERE id = $1', [rotacionId]);
    }
    await client.query('COMMIT');
    res.json({ message: 'Rotación limpiada' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
