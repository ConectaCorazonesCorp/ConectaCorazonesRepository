-- ============================================
-- SCHEMA: Conecta Corazones
-- ============================================

-- Tabla de ONGs
CREATE TABLE IF NOT EXISTS ongs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    logo VARCHAR(500),
    link VARCHAR(500)
);

-- Tabla de Voluntarios
CREATE TABLE IF NOT EXISTS voluntarios (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    photo VARCHAR(500),
    phone VARCHAR(50),
    email VARCHAR(200)
);

-- Tabla de Preguntas Frecuentes
CREATE TABLE IF NOT EXISTS faqs (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INT DEFAULT 0
);

-- Tabla de Preguntas de la Encuesta
CREATE TABLE IF NOT EXISTS survey_questions (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    sort_order INT DEFAULT 0
);

-- Tabla de Opciones de la Encuesta
CREATE TABLE IF NOT EXISTS survey_options (
    id SERIAL PRIMARY KEY,
    question_id INT NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
    label VARCHAR(200) NOT NULL,
    value VARCHAR(100) NOT NULL
);

-- ============================================
-- DATOS INICIALES
-- ============================================

-- ONGs (solo insertar si la tabla está vacía)
INSERT INTO ongs (name, description, logo, link)
SELECT * FROM (VALUES
    ('Cruz Roja', 'Cruz Roja proporciona asistencia sanitaria, social y de emergencia a toda la comunidad.', './images/ONGS/CruzRojaLogo.png', 'https://www.cruzroja.es'),
    ('HogarSí', 'HogarSí trabaja para proporcionar vivienda y acompañamiento a personas sin hogar.', './images/ONGS/HogarSiLogo.png', 'https://hogarsi.org'),
    ('Plena Inclusión', 'Plena Inclusión promueve la inclusión social y laboral de personas con discapacidad intelectual.', './images/ONGS/PlenaInclusionLogo.png', 'https://www.plenainclusion.org'),
    ('Apaside', 'Apaside es una organización dedicada a apoyar a personas con discapacidad y sus familias.', './images/ONGS/ApascideLogo.png', 'https://apaside.org'),
    ('Atam', 'Atam brinda atención integral y apoyo a personas mayores en situación de vulnerabilidad.', './images/ONGS/AtamLogo.png', 'https://www.atam.es')
) AS v(name, description, logo, link)
WHERE NOT EXISTS (SELECT 1 FROM ongs);

-- FAQs
INSERT INTO faqs (question, answer, sort_order)
SELECT * FROM (VALUES
    ('¿Cómo saben cuál es la mejor organización para mi caso?', 'Analizamos tus respuestas para conectarte con la ONG que mejor se adapte a tus necesidades específicas.', 1),
    ('¿Recibiré ayuda económica directa de esta página?', 'No, somos un puente para conectarte con las organizaciones que brindan la ayuda.', 2),
    ('¿Cómo contacto con una ONG?', 'Pulsa "Acceder" en la ficha de la ONG para solicitar información; te guiaremos en los siguientes pasos.', 3)
) AS v(question, answer, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM faqs);

-- Preguntas de la Encuesta
INSERT INTO survey_questions (question, sort_order)
SELECT * FROM (VALUES
    ('¿Qué tipo de ayuda necesitas?', 1)
) AS v(question, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM survey_questions);

-- Opciones de la Encuesta
INSERT INTO survey_options (question_id, label, value)
SELECT sq.id, v.label, v.value
FROM survey_questions sq,
(VALUES
    ('🍽️ Alimentos', 'food'),
    ('🏥 Salud', 'health'),
    ('📚 Educación', 'education'),
    ('🏠 Vivienda', 'housing')
) AS v(label, value)
WHERE sq.question = '¿Qué tipo de ayuda necesitas?'
AND NOT EXISTS (SELECT 1 FROM survey_options);
