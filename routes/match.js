const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/match?tags=tag1,tag2,tag3
router.get('/', async (req, res) => {
    try {
        const tagsParam = req.query.tags;
        if (!tagsParam) {
            return res.json([]);
        }

        // Convert the comma-separated string into a formatted Postgres array literal
        // e.g. "salud,refugio,alimento" -> "{salud,refugio,alimento}"
        const userTags = tagsParam.split(',').map(t => t.trim()).filter(Boolean);
        if (userTags.length === 0) {
            return res.json([]);
        }

        // This query does the following:
        // 1. Unnests the user tags array and the entity tags array (stored as csv string)
        // 2. Finds the intersection (exact matches)
        // 3. Counts the matches
        // 4. Calculates relevance as (matches / total_user_tags) * 100
        // 5. Returns ONGs and Voluntarios combined, sorted by relevance descending
        const query = `
            WITH user_tags AS (
                SELECT unnest($1::text[]) AS tag
            ),
            -- Match ONGs
            ong_matches AS (
                SELECT 
                    o.id, 
                    o.name, 
                    o.description, 
                    o.logo as image, 
                    o.link,
                    NULL::text as phone,
                    NULL::text as email,
                    o.tags,
                    'ong' as type,
                    COUNT(ut.tag) as match_count
                FROM ongs o
                LEFT JOIN LATERAL unnest(string_to_array(o.tags, ',')) AS ong_tag ON true
                LEFT JOIN user_tags ut ON trim(ong_tag) = ut.tag
                GROUP BY o.id, o.name, o.description, o.logo, o.link, o.tags
            ),
            -- Match Voluntarios (assuming they also have a tags column now)
            vol_matches AS (
                SELECT 
                    v.id, 
                    v.name, 
                    v.description, 
                    v.photo as image, 
                    NULL::text as link,
                    v.phone,
                    v.email,
                    v.tags,
                    'voluntario' as type,
                    COUNT(ut.tag) as match_count
                FROM voluntarios v
                LEFT JOIN LATERAL unnest(string_to_array(v.tags, ',')) AS vol_tag ON true
                LEFT JOIN user_tags ut ON trim(vol_tag) = ut.tag
                GROUP BY v.id, v.name, v.description, v.photo, v.phone, v.email, v.tags
            ),
            combined AS (
                SELECT * FROM ong_matches
                UNION ALL
                SELECT * FROM vol_matches
            )
            SELECT 
                *,
                CASE 
                    WHEN $2::int > 0 THEN ROUND((match_count::numeric / $2::numeric) * 100)
                    ELSE 0 
                END as relevance
            FROM combined
            WHERE match_count > 0
            ORDER BY match_count DESC, name ASC;
        `;

        const result = await db.query(query, [userTags, userTags.length]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error in matching algorithm:', err);
        res.status(500).json({ error: 'Error processing matches' });
    }
});

module.exports = router;
