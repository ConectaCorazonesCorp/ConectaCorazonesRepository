const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/survey — Obtener todas las preguntas con sus opciones
router.get('/', async (req, res) => {
    try {
        const questions = await db.query('SELECT * FROM survey_questions ORDER BY sort_order, id');
        const options = await db.query('SELECT * FROM survey_options ORDER BY id');

        const result = questions.rows.map(q => ({
            ...q,
            options: options.rows.filter(o => o.question_id === q.id)
        }));
        res.json(result);
    } catch (err) {
        console.error('Error GET /api/survey:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/survey/questions — Crear pregunta
router.post('/questions', async (req, res) => {
    try {
        const { question, sort_order } = req.body;
        const result = await db.query(
            'INSERT INTO survey_questions (question, sort_order) VALUES ($1, $2) RETURNING *',
            [question, sort_order || 0]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error POST /api/survey/questions:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/survey/questions/:id — Actualizar pregunta
router.put('/questions/:id', async (req, res) => {
    try {
        const { question, sort_order } = req.body;
        const result = await db.query(
            'UPDATE survey_questions SET question=$1, sort_order=$2 WHERE id=$3 RETURNING *',
            [question, sort_order, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Pregunta no encontrada' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error PUT /api/survey/questions/:id:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/survey/questions/:id — Eliminar pregunta (las opciones se borran en cascada)
router.delete('/questions/:id', async (req, res) => {
    try {
        const result = await db.query('DELETE FROM survey_questions WHERE id=$1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Pregunta no encontrada' });
        res.json({ message: 'Pregunta eliminada', question: result.rows[0] });
    } catch (err) {
        console.error('Error DELETE /api/survey/questions/:id:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/survey/options — Crear opción
router.post('/options', async (req, res) => {
    try {
        const { question_id, label, value } = req.body;
        const result = await db.query(
            'INSERT INTO survey_options (question_id, label, value) VALUES ($1, $2, $3) RETURNING *',
            [question_id, label, value]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error POST /api/survey/options:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/survey/options/:id — Actualizar opción
router.put('/options/:id', async (req, res) => {
    try {
        const { question_id, label, value } = req.body;
        const result = await db.query(
            'UPDATE survey_options SET question_id=$1, label=$2, value=$3 WHERE id=$4 RETURNING *',
            [question_id, label, value, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Opción no encontrada' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error PUT /api/survey/options/:id:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/survey/options/:id — Eliminar opción
router.delete('/options/:id', async (req, res) => {
    try {
        const result = await db.query('DELETE FROM survey_options WHERE id=$1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Opción no encontrada' });
        res.json({ message: 'Opción eliminada', option: result.rows[0] });
    } catch (err) {
        console.error('Error DELETE /api/survey/options/:id:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
