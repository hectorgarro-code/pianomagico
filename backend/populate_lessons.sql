-- Reset songs table for the new 40-level curriculum
USE pianomagicoweb;
DELETE FROM songs WHERE user_id IS NULL;

-- NIVEL 1-5: PRIMER CONTACTO
INSERT INTO songs (title, sequence, sticker_id, speed, rhythm, is_user_created) VALUES 
('Primeros Pasos', '["C","D","E"]', 1, 1200, 'bubble', 0),
('Saltitos de Do', '["C","E","C","E","C"]', 2, 1100, 'bubble', 0),
('El Tren de Do', '["C","C","D","D","E","E","C"]', 3, 1000, 'bubble', 0),
('Campanitas', '["E","D","C","D","E","E","E"]', 4, 1000, 'pop', 0),
('Pin Pon es un muñeco', '["G","E","E","F","D","D","C","E","G"]', 5, 950, 'pop', 0);

-- NIVEL 6-10: CUIDADO CON LA MANO
INSERT INTO songs (title, sequence, sticker_id, speed, rhythm, is_user_created) VALUES 
('Un Elefante', '["C","C","D","C","E","C","F","E","D"]', 6, 900, 'pop', 0),
('Los Pollitos Dicen', '["C","D","E","F","G","G","A","A","A","A","G"]', 7, 850, 'pop', 0),
('En la Granja de mi Tío', '["G","G","G","D","E","E","D","B","B","A","A","G"]', 8, 850, 'pop', 0),
('La Vaca Lola', '["C","C","G","G","A","A","G","F","F","E","E","D","D","C"]', 9, 800, 'pop', 0),
('Estrellita donde estás', '["C","C","G","G","A","A","G","F","F","E","E","D","D","C"]', 10, 800, 'pop', 0);

-- NIVEL 11-15: RITMOS Y SALTOS
INSERT INTO songs (title, sequence, sticker_id, speed, rhythm, is_user_created) VALUES 
('Baby Shark', '["D","E","G","G","G","G","G","G","G","D","E","G"]', 11, 600, 'rock', 0),
('Las Ruedas del Autobús', '["C","F","F","F","F","A","C","A","F","G","E","C"]', 12, 800, 'pop', 0),
('Feliz Cumpleaños', '["C","C","D","C","F","E","C","C","D","C","G","F"]', 13, 900, 'pop', 0),
('You Are My Sunshine', '["C","F","G","A","A","A","G","A","F","F"]', 14, 900, 'pop', 0),
('Osito Gominola', '["C","C","D","D","E","E","F","G","A","B","C","G","E","C"]', 15, 700, 'rock', 0);

-- NIVEL 16-20: MELODÍAS COMPLETAS
INSERT INTO songs (title, sequence, sticker_id, speed, rhythm, is_user_created) VALUES 
('Amazing Grace', '["C","F","A","F","A","G","F","D","C"]', 1, 1000, 'bubble', 0),
('Don''t Worry Be Happy', '["G","E","G","G","E","A","G","F","E","D"]', 2, 850, 'pop', 0),
('Yo soy tu amigo fiel', '["C","E","G","A","G","E","C","D","E","D","C"]', 3, 800, 'pop', 0),
('Escala de Blues', '["C","D","E","G","A","A","G","E","D","C"]', 4, 700, 'rock', 0),
('Claro de Luna (Debussy)', '["G","E","G","E","G","E","G","E","F","D","F","D","F","D","E","C"]', 20, 1200, 'bubble', 0);

-- DESAFÍOS MAESTROS (21-40) - Generando algunas inserciones estáticas para asegurar persistencia
INSERT INTO songs (title, sequence, sticker_id, speed, rhythm, is_user_created) VALUES 
('Desafío Maestro 1', '["C","G","A","F","D","E","C","B","G","A","C"]', 1, 780, 'pop', 0),
('Desafío Maestro 2', '["G","E","C","D","F","A","B","C","G","E","D","C"]', 2, 760, 'rock', 0),
('Desafío Maestro 3', '["A","F","D","G","C","E","B","A","G","F","E","D","C"]', 3, 740, 'pop', 0),
('Desafío Maestro 4', '["C","D","E","F","G","A","B","C","B","A","G","F","E","D"]', 4, 720, 'rock', 0),
('Desafío Maestro 5', '["E","G","C","F","A","D","B","G","C","E","D","A","F","G","C"]', 5, 700, 'pop', 0);
