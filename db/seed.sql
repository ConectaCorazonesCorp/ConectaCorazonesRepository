-- ============================================
-- SCHEMA: Conecta Corazones
-- ============================================

-- Tabla de ONGs
CREATE TABLE IF NOT EXISTS ongs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    logo VARCHAR(500),
    link VARCHAR(500),
    tags TEXT DEFAULT ''
);

-- Agregar columna tags si no existe
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ongs' AND column_name='tags') THEN
        ALTER TABLE ongs ADD COLUMN tags TEXT DEFAULT '';
    END IF;
END $$;

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
    value VARCHAR(100) NOT NULL,
    tag VARCHAR(100) DEFAULT ''
);

-- Agregar columna tag si no existe
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='survey_options' AND column_name='tag') THEN
        ALTER TABLE survey_options ADD COLUMN tag VARCHAR(100) DEFAULT '';
    END IF;
END $$;

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Limpiar datos de encuesta previos para reinsertar
DELETE FROM survey_options;
DELETE FROM survey_questions;

-- ============================================
-- ONGs (insertar si vacía, actualizar tags siempre)
-- ============================================
INSERT INTO ongs (name, description, logo, link, tags)
SELECT * FROM (VALUES
    ('Cruz Roja', 'Cruz Roja proporciona asistencia sanitaria, social y de emergencia a toda la comunidad.', './images/ONGS/CruzRojaLogo.png', 'https://www.cruzroja.es', 'salud,alimento,emergencia,refugio,legal'),
    ('HogarSí', 'HogarSí trabaja para proporcionar vivienda y acompañamiento a personas sin hogar.', './images/ONGS/HogarSiLogo.png', 'https://hogarsi.org', 'refugio,empleo,compania,alimento,calle'),
    ('Plena Inclusión', 'Plena Inclusión promueve la inclusión social y laboral de personas con discapacidad intelectual.', './images/ONGS/PlenaInclusionLogo.png', 'https://www.plenainclusion.org', 'discapacidad,inclusion,empleo,educacion,compania'),
    ('Apaside', 'Apaside es una organización dedicada a apoyar a personas con discapacidad y sus familias.', './images/ONGS/ApascideLogo.png', 'https://apaside.org', 'discapacidad,movilidad,compania,educacion,salud'),
    ('Atam', 'Atam brinda atención integral y apoyo a personas mayores en situación de vulnerabilidad.', './images/ONGS/AtamLogo.png', 'https://www.atam.es', 'mayores,discapacidad,salud,compania,movilidad')
) AS v(name, description, logo, link, tags)
WHERE NOT EXISTS (SELECT 1 FROM ongs);

-- Actualizar tags de ONGs existentes
UPDATE ongs SET tags = 'salud,alimento,emergencia,refugio,legal' WHERE name = 'Cruz Roja';
UPDATE ongs SET tags = 'refugio,empleo,compania,alimento,calle' WHERE name = 'HogarSí';
UPDATE ongs SET tags = 'discapacidad,inclusion,empleo,educacion,compania' WHERE name = 'Plena Inclusión';
UPDATE ongs SET tags = 'discapacidad,movilidad,compania,educacion,salud' WHERE name = 'Apaside';
UPDATE ongs SET tags = 'mayores,discapacidad,salud,compania,movilidad' WHERE name = 'Atam';

-- ============================================
-- FAQs (insertar si vacía)
-- ============================================
INSERT INTO faqs (question, answer, sort_order)
SELECT * FROM (VALUES
    ('¿Cómo saben cuál es la mejor organización para mi caso?', 'Analizamos tus respuestas para conectarte con la ONG que mejor se adapte a tus necesidades específicas.', 1),
    ('¿Recibiré ayuda económica directa de esta página?', 'No, somos un puente para conectarte con las organizaciones que brindan la ayuda.', 2),
    ('¿Cómo contacto con una ONG?', 'Pulsa "Acceder" en la ficha de la ONG para solicitar información; te guiaremos en los siguientes pasos.', 3)
) AS v(question, answer, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM faqs);

-- ============================================
-- ENCUESTA: 10 PREGUNTAS CON 3 RESPUESTAS CADA UNA
-- ============================================

-- P1
INSERT INTO survey_questions (question, sort_order) VALUES ('¿Qué tipo de ayuda necesitas principalmente?', 1);
INSERT INTO survey_options (question_id, label, value, tag) VALUES
    (currval('survey_questions_id_seq'), '🍽️ Alimentación y necesidades básicas', 'alimento', 'alimento'),
    (currval('survey_questions_id_seq'), '🏥 Atención médica o sanitaria', 'salud', 'salud'),
    (currval('survey_questions_id_seq'), '🏠 Un lugar donde vivir', 'refugio', 'refugio');

-- P2
INSERT INTO survey_questions (question, sort_order) VALUES ('¿Cuál es tu situación de vivienda?', 2);
INSERT INTO survey_options (question_id, label, value, tag) VALUES
    (currval('survey_questions_id_seq'), '🏡 Tengo vivienda estable', 'vivienda_estable', 'compania'),
    (currval('survey_questions_id_seq'), '🏚️ Vivo en un lugar temporal', 'vivienda_temporal', 'refugio'),
    (currval('survey_questions_id_seq'), '🚶 No tengo un lugar fijo', 'sin_vivienda', 'calle');

-- P3
INSERT INTO survey_questions (question, sort_order) VALUES ('¿Necesitas ayuda para moverte?', 3);
INSERT INTO survey_options (question_id, label, value, tag) VALUES
    (currval('survey_questions_id_seq'), '🚶 Me muevo sin dificultad', 'sin_movilidad', 'empleo'),
    (currval('survey_questions_id_seq'), '🦽 Tengo movilidad reducida', 'movilidad_reducida', 'movilidad'),
    (currval('survey_questions_id_seq'), '🚌 Necesito transporte adaptado', 'transporte', 'movilidad');

-- P4
INSERT INTO survey_questions (question, sort_order) VALUES ('¿Cuál es tu rango de edad?', 4);
INSERT INTO survey_options (question_id, label, value, tag) VALUES
    (currval('survey_questions_id_seq'), '👤 Menos de 40 años', 'joven', 'empleo'),
    (currval('survey_questions_id_seq'), '👤 Entre 40 y 65 años', 'adulto', 'salud'),
    (currval('survey_questions_id_seq'), '👴 Más de 65 años', 'mayor', 'mayores');

-- P5
INSERT INTO survey_questions (question, sort_order) VALUES ('¿Tienes alguna discapacidad?', 5);
INSERT INTO survey_options (question_id, label, value, tag) VALUES
    (currval('survey_questions_id_seq'), '✅ No tengo ninguna discapacidad', 'sin_discapacidad', 'empleo'),
    (currval('survey_questions_id_seq'), '🦽 Sí, discapacidad física', 'disc_fisica', 'discapacidad'),
    (currval('survey_questions_id_seq'), '🧠 Sí, discapacidad intelectual', 'disc_intelectual', 'inclusion');

-- P6
INSERT INTO survey_questions (question, sort_order) VALUES ('¿Necesitas apoyo legal o con trámites?', 6);
INSERT INTO survey_options (question_id, label, value, tag) VALUES
    (currval('survey_questions_id_seq'), '📋 No lo necesito', 'sin_legal', 'compania'),
    (currval('survey_questions_id_seq'), '📝 Necesito ayuda con trámites', 'tramites', 'legal'),
    (currval('survey_questions_id_seq'), '⚖️ Necesito asesoría legal', 'asesoria_legal', 'legal');

-- P7
INSERT INTO survey_questions (question, sort_order) VALUES ('¿Te sientes solo/a o aislado/a?', 7);
INSERT INTO survey_options (question_id, label, value, tag) VALUES
    (currval('survey_questions_id_seq'), '😊 Tengo buena compañía', 'con_compania', 'empleo'),
    (currval('survey_questions_id_seq'), '😐 A veces me siento solo/a', 'algo_solo', 'compania'),
    (currval('survey_questions_id_seq'), '😔 Me siento muy aislado/a', 'aislado', 'compania');

-- P8
INSERT INTO survey_questions (question, sort_order) VALUES ('¿Buscas formación o empleo?', 8);
INSERT INTO survey_options (question_id, label, value, tag) VALUES
    (currval('survey_questions_id_seq'), '💼 No, tengo trabajo', 'con_trabajo', 'salud'),
    (currval('survey_questions_id_seq'), '📚 Busco formarme o estudiar', 'formacion', 'educacion'),
    (currval('survey_questions_id_seq'), '🔍 Busco un empleo', 'busco_empleo', 'empleo');

-- P9
INSERT INTO survey_questions (question, sort_order) VALUES ('¿Cómo prefieres recibir la ayuda?', 9);
INSERT INTO survey_options (question_id, label, value, tag) VALUES
    (currval('survey_questions_id_seq'), '🏢 Presencial, en un centro', 'presencial', 'salud'),
    (currval('survey_questions_id_seq'), '🏠 A domicilio', 'domicilio', 'movilidad'),
    (currval('survey_questions_id_seq'), '📱 Online o telefónica', 'online', 'educacion');

-- P10
INSERT INTO survey_questions (question, sort_order) VALUES ('¿Qué es lo más urgente para ti ahora?', 10);
INSERT INTO survey_options (question_id, label, value, tag) VALUES
    (currval('survey_questions_id_seq'), '🍽️ Comida y productos básicos', 'urgente_comida', 'alimento'),
    (currval('survey_questions_id_seq'), '🏥 Atención sanitaria urgente', 'urgente_salud', 'emergencia'),
    (currval('survey_questions_id_seq'), '🛏️ Un techo y seguridad', 'urgente_techo', 'refugio');
