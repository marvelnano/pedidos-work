const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT id, nombre, estado FROM personas ORDER BY nombre');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { id, nombre, estado = 1 } = req.body;
  try {
    await db.query('INSERT INTO personas (id, nombre, estado) VALUES ($1, $2, $3)', [id, nombre, estado]);
    res.status(201).json({ message: 'Persona creada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { nombre, estado = 1 } = req.body;
  try {
    await db.query('UPDATE personas SET nombre=$1, estado=$2, updated_at=NOW() WHERE id=$3', [nombre, estado, req.params.id]);
    res.json({ message: 'Persona actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/estado', async (req, res) => {
  const { estado } = req.body;
  try {
    await db.query('UPDATE personas SET estado=$1, updated_at=NOW() WHERE id=$2', [estado, req.params.id]);
    res.json({ message: 'Estado actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
