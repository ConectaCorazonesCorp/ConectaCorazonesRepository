const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/faqs
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM faqs ORDER BY sort_order, id');
        res.json(result.rows);
    } catch (err) {
        console.error('Error GET /api/faqs:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/faqs/:id
router.get('/:id', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM faqs WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'FAQ no encontrada' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error GET /api/faqs/:id:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/faqs
router.post('/', async (req, res) => {
    try {
        const { question, answer, sort_order } = req.body;
        const result = await db.query(
            'INSERT INTO faqs (question, answer, sort_order) VALUES ($1, $2, $3) RETURNING *',
            [question, answer, sort_order || 0]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error POST /api/faqs:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/faqs/:id
router.put('/:id', async (req, res) => {
    try {
        const { question, answer, sort_order } = req.body;
        const result = await db.query(
            'UPDATE faqs SET question=$1, answer=$2, sort_order=$3 WHERE id=$4 RETURNING *',
            [question, answer, sort_order, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'FAQ no encontrada' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error PUT /api/faqs/:id:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/faqs/:id
router.delete('/:id', async (req, res) => {
    try {
        const result = await db.query('DELETE FROM faqs WHERE id=$1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'FAQ no encontrada' });
        res.json({ message: 'FAQ eliminada', faq: result.rows[0] });
    } catch (err) {
        console.error('Error DELETE /api/faqs/:id:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
