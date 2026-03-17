const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT id, persona_id, descripcion, cantidad, precio, estado FROM pedidos WHERE estado = 1 ORDER BY created_at');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { id, persona_id, descripcion, cantidad, precio, estado = 1 } = req.body;
  try {
    await db.query('INSERT INTO pedidos (id, persona_id, descripcion, cantidad, precio, estado) VALUES ($1, $2, $3, $4, $5, $6)', [id, persona_id, descripcion, cantidad, precio, estado]);
    res.status(201).json({ message: 'Pedido creado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { persona_id, descripcion, cantidad, precio, estado = 1 } = req.body;
  try {
    await db.query('UPDATE pedidos SET persona_id=$1, descripcion=$2, cantidad=$3, precio=$4, estado=$5, updated_at=NOW() WHERE id=$6', [persona_id, descripcion, cantidad, precio, estado, req.params.id]);
    res.json({ message: 'Pedido actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/estado', async (req, res) => {
  const { estado } = req.body;
  try {
    await db.query('UPDATE pedidos SET estado=$1, updated_at=NOW() WHERE id=$2', [estado, req.params.id]);
    res.json({ message: 'Estado actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
