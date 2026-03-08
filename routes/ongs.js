const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/ongs — Obtener todas las ONGs
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM ongs ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        console.error('Error GET /api/ongs:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/ongs/:id — Obtener una ONG por ID
router.get('/:id', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM ongs WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'ONG no encontrada' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error GET /api/ongs/:id:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/ongs — Crear una nueva ONG
router.post('/', async (req, res) => {
    try {
        const { name, description, logo, link } = req.body;
        const result = await db.query(
            'INSERT INTO ongs (name, description, logo, link) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, description, logo, link]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error POST /api/ongs:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/ongs/:id — Actualizar una ONG
router.put('/:id', async (req, res) => {
    try {
        const { name, description, logo, link } = req.body;
        const result = await db.query(
            'UPDATE ongs SET name=$1, description=$2, logo=$3, link=$4 WHERE id=$5 RETURNING *',
            [name, description, logo, link, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'ONG no encontrada' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error PUT /api/ongs/:id:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/ongs/:id — Eliminar una ONG
router.delete('/:id', async (req, res) => {
    try {
        const result = await db.query('DELETE FROM ongs WHERE id=$1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'ONG no encontrada' });
        res.json({ message: 'ONG eliminada', ong: result.rows[0] });
    } catch (err) {
        console.error('Error DELETE /api/ongs/:id:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
