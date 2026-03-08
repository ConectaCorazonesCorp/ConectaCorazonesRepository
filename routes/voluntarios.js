const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/voluntarios
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM voluntarios ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        console.error('Error GET /api/voluntarios:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/voluntarios/:id
router.get('/:id', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM voluntarios WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Voluntario no encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error GET /api/voluntarios/:id:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/voluntarios
router.post('/', async (req, res) => {
    try {
        const { name, description, photo, phone, email } = req.body;
        const result = await db.query(
            'INSERT INTO voluntarios (name, description, photo, phone, email) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, description, photo, phone, email]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error POST /api/voluntarios:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/voluntarios/:id
router.put('/:id', async (req, res) => {
    try {
        const { name, description, photo, phone, email } = req.body;
        const result = await db.query(
            'UPDATE voluntarios SET name=$1, description=$2, photo=$3, phone=$4, email=$5 WHERE id=$6 RETURNING *',
            [name, description, photo, phone, email, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Voluntario no encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error PUT /api/voluntarios/:id:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/voluntarios/:id
router.delete('/:id', async (req, res) => {
    try {
        const result = await db.query('DELETE FROM voluntarios WHERE id=$1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Voluntario no encontrado' });
        res.json({ message: 'Voluntario eliminado', voluntario: result.rows[0] });
    } catch (err) {
        console.error('Error DELETE /api/voluntarios/:id:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
