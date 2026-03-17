// productos-api.js
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT id, nombre, descripcion, precio, estado FROM productos ORDER BY nombre');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { id, nombre, descripcion = '', precio = 0, estado = 1 } = req.body;
  try {
    await db.query('INSERT INTO productos (id, nombre, descripcion, precio, estado) VALUES ($1, $2, $3, $4, $5)', [id, nombre, descripcion, precio, estado]);
    res.status(201).json({ message: 'Producto creado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { nombre, descripcion = '', precio = 0, estado = 1 } = req.body;
  try {
    await db.query('UPDATE productos SET nombre=$1, descripcion=$2, precio=$3, estado=$4, updated_at=NOW() WHERE id=$5', [nombre, descripcion, precio, estado, req.params.id]);
    res.json({ message: 'Producto actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/estado', async (req, res) => {
  const { estado } = req.body;
  try {
    await db.query('UPDATE productos SET estado=$1, updated_at=NOW() WHERE id=$2', [estado, req.params.id]);
    res.json({ message: 'Estado actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
