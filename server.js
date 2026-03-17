require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/images', express.static(path.join(__dirname, 'images')));

// Rutas API
app.use('/api/ongs', require('./routes/ongs'));
app.use('/api/voluntarios', require('./routes/voluntarios'));
app.use('/api/faqs', require('./routes/faqs'));
app.use('/api/survey', require('./routes/survey'));
app.use('/api/match', require('./routes/match'));

// Ruta para obtener info de todas las tablas (para el admin)
const db = require('./db');
app.get('/api/admin/tables', async (req, res) => {
    try {
        const tables = ['ongs', 'voluntarios', 'faqs', 'survey_questions', 'survey_options'];
        const result = {};
        for (const table of tables) {
            // Obtener columnas
            const cols = await db.query(
                `SELECT column_name, data_type, is_nullable
                 FROM information_schema.columns
                 WHERE table_name = $1
                 ORDER BY ordinal_position`, [table]
            );
            // Obtener datos
            const data = await db.query(`SELECT * FROM ${table} ORDER BY id`);
            result[table] = {
                columns: cols.rows,
                rows: data.rows
            };
        }
        res.json(result);
    } catch (err) {
        console.error('Error fetching tables:', err);
        res.status(500).json({ error: err.message });
    }
});

// Inicializar tablas al arrancar
const fs = require('fs');
app.listen(PORT, async () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    try {
        const seedSQL = fs.readFileSync(path.join(__dirname, 'db', 'seed.sql'), 'utf8');
        await db.query(seedSQL);
        console.log('Base de datos inicializada correctamente');
    } catch (err) {
        console.error('Error inicializando BD:', err.message);
    }
});
