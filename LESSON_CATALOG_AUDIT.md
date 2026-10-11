# Lesson catalog audit

CP1 agrega posteriormente estado/revision en `valle_lesson_meta`, sin sustituir `songs`. Esta auditoria y su snapshot conservan la lectura PREVIA a esa migracion. Para nuevas auditorias se usa el lector CLI local `backend/content/audit-catalog.php`; ya no depende de un endpoint administrativo abierto.

Captured 2026-10-11T00:31:42.610Z. Read-only MySQL query before migration. 40 real piano rows; 40 global lessons. Snapshot is evidence, NOT a second runtime catalog. No assignments corrected.

## Sources

MYSQL: songs is loaded by PianoMagico through backend/api.php get_songs; Adventure uses progressService.getSongs against the same endpoint. get_admin_songs formerly exposes all rows without auth. No hardcoded educational lesson array is used by PianoMagico.

HARDCODED: Adventure activity IDs/requirements/rewards and Plaza first-song selector, stickers, rhythm defaults and solfege lookup. These are not another lesson database.

DERIVED: mode (solo/oido/detective etc.), octave 4 when missing, duration 1 when missing, labels, synthesized preview, and speed interpretation (value >300 is interval ms; otherwise BPM). No persisted difficulty, description, lesson type, melody/audio URL or activation flag currently exists. sequence IS the melody. These fields must not be fabricated as editable motor features.

LEGACY: songs.sql and pianomagicoweb.sql contain old 40-row seeds, including ID40 Gran Concierto Final, absent from the current MySQL catalog. backend/populate_lessons.sql is an old destructive reseed script, not a runtime source; NOT executed. backend/schema.sql lacks current instrument/order_index fields.

DUPLICATED: SQL seeds overlap; equal real sequences at IDs [[19,23],[22,24]] are distinct lessons, not automatically removable duplicates. User performances and medals are player data, not content.

## Inventory

All rows retain id, user_id, title, sequence, sticker_id, speed, rhythm, is_user_created, order_index and instrument. API additionally derives stickerId/isUserCreated aliases. State before migration: no disabled flag, all returned. Full exact raw fields in docs/audits/lesson-catalog-snapshot.json.

| ID | Title | Order (0-based) | Owner | Speed | Units | Rhythm | Sequence |
|---|---|---|---|---|---|---|---|
| 2 | 2. Subiendo la Escalera | 0 | GLOBAL | 120 | BPM | bubble | C / D / E |
| 1 | 1. El Saludo del Elefante | 1 | GLOBAL | 1300 | LEGACY ms | bubble | C / C / C |
| 3 | 3. Bajando la Escalera | 2 | GLOBAL | 1250 | LEGACY ms | bubble | E / D / C |
| 4 | 4. El Tren se detiene | 3 | GLOBAL | 1200 | LEGACY ms | bubble | C / C / D / D / C |
| 82 | PARA ELISA 1ERA PARTE | 4 | GLOBAL | 136 | BPM | bubble | E:0.5 / D#:0.5 / E:0.5 / D#:0.5 / E:0.5 / B:0.5 / D:0.5 / C:0.5 / A:1 / C:0.5 / E:0.5 / A:0.5 / B:1 / E:0.5 / G#:0.5 / B:0.5 / C:1 / E:1 |
| 5 | 5. Saltitos de Rana (C-E) | 5 | GLOBAL | 1200 | LEGACY ms | bubble | C / E / C / E |
| 6 | 6. Campanitas (Parte 1) | 6 | GLOBAL | 1100 | LEGACY ms | pop | E / D / C / D |
| 7 | 7. Campanitas (Final) | 7 | GLOBAL | 1100 | LEGACY ms | pop | E / E / E |
| 8 | 8. Campanitas Completo | 8 | GLOBAL | 100 | BPM | pop | E:1 / E:1 / E:1 / E:1 / E:1 / E:1 / E:1 / E:1 / E:1 / G:1 / C:1 / D:1 / E:1 / R:1 / F:1 / F:1 / F:1 / F:1 / F:1 / E:1 / E:1 / E:1 / G:1 / G:1 / F:1 / D:1 / C:1 |
| 9 | 9. El Gatito Curioso | 9 | GLOBAL | 1050 | LEGACY ms | bubble | C / D / E / F / G |
| 10 | 10. Tobogán Largo | 10 | GLOBAL | 1050 | LEGACY ms | bubble | G / F / E / D / C |
| 11 | 11. Pin Pon (El Lavado) | 11 | GLOBAL | 1000 | LEGACY ms | pop | G / E / E / F / D / D |
| 12 | 12. Pin Pon (Final) | 12 | GLOBAL | 1000 | LEGACY ms | pop | C / E / G / G |
| 13 | 13. Pin Pon Completo | 13 | GLOBAL | 950 | LEGACY ms | pop | G / E / E / F / D / D / C / E / G |
| 14 | 14. Un Elefante (La Red) | 14 | GLOBAL | 950 | LEGACY ms | pop | C / C / D / C / E / C |
| 15 | 15. Un Elefante Completo | 15 | GLOBAL | 900 | LEGACY ms | pop | C / C / D / C / E / C / F / E / D |
| 16 | 16. Los Pollitos (El Coro) | 16 | GLOBAL | 900 | LEGACY ms | pop | C / D / E / F / G / G |
| 17 | 17. Los Pollitos (Pío Pío) | 17 | GLOBAL | 900 | LEGACY ms | pop | A / A / A / A / G |
| 18 | 18. Los Pollitos Completo | 18 | GLOBAL | 850 | LEGACY ms | pop | C / D / E / F / G / G / A / A / A / A / G |
| 19 | 19. Estrellita (El Cielo) | 19 | GLOBAL | 900 | LEGACY ms | pop | C / C / G / G / A / A / G |
| 20 | 20. Estrellita (El Camino) | 20 | GLOBAL | 900 | LEGACY ms | pop | F / F / E / E / D / D / C |
| 21 | 21. Estrellita (El Brillo) | 21 | GLOBAL | 900 | LEGACY ms | pop | G / G / F / F / E / E / D |
| 22 | 22. Estrellita COMPLETA | 22 | GLOBAL | 850 | LEGACY ms | pop | C / C / G / G / A / A / G / F / F / E / E / D / D / C |
| 23 | 23. La Vaca Lola (Inicio) | 23 | GLOBAL | 850 | LEGACY ms | pop | C / C / G / G / A / A / G |
| 24 | 24. La Vaca Lola Completa | 24 | GLOBAL | 800 | LEGACY ms | pop | C / C / G / G / A / A / G / F / F / E / E / D / D / C |
| 25 | 25. En la Granja (IEIAO) | 25 | GLOBAL | 850 | LEGACY ms | pop | G / G / G / D / E / E / D |
| 26 | 26. En la Granja Completo | 26 | GLOBAL | 850 | LEGACY ms | pop | G / G / G / D / E / E / D / B / B / A / A / G |
| 27 | 27. Baby Shark (Ataque) | 27 | GLOBAL | 700 | LEGACY ms | rock | D / E / G / G / G / G / G / G / G |
| 28 | 28. Baby Shark Completo | 28 | GLOBAL | 650 | LEGACY ms | rock | D / E / G / G / G / G / G / G / G / D / E / G |
| 29 | 29. Autobús (Ruedas) | 29 | GLOBAL | 850 | LEGACY ms | pop | C / F / F / F / F / A / C |
| 30 | 30. Autobús Completo | 30 | GLOBAL | 800 | LEGACY ms | pop | C / F / F / F / F / A / C / A / F / G / E / C |
| 31 | 31. Feliz Cumple (Deseo) | 31 | GLOBAL | 900 | LEGACY ms | pop | C / C / D / C / F / E |
| 32 | 32. Feliz Cumple Completo | 32 | GLOBAL | 850 | LEGACY ms | pop | C / C / D / C / F / E / C / C / D / C / G / F |
| 33 | 33. Sunshine (Luz) | 33 | GLOBAL | 900 | LEGACY ms | pop | C / F / G / A / A / A |
| 34 | 34. Sunshine Completo | 34 | GLOBAL | 850 | LEGACY ms | pop | C / F / G / A / A / A / G / A / F / F |
| 35 | 35. Himno a la Alegría | 35 | GLOBAL | 950 | LEGACY ms | march | E / E / F / G / G / F / E / D / C / C / D / E / E / D / D |
| 36 | 36. Amigo Fiel (Toy Story) | 36 | GLOBAL | 800 | LEGACY ms | pop | C / E / G / A / G / E / C / D / E / D / C |
| 37 | 37. El Invierno (Vivaldi) | 37 | GLOBAL | 750 | LEGACY ms | rock | F / F / F / F / F / F / F / F / G / F / E / D / C |
| 38 | 38. Osito Gominola | 38 | GLOBAL | 700 | LEGACY ms | rock | C / C / D / D / E / E / F / G / A / B / C / G / E / C |
| 39 | 39. Escala de Blues (Pro) | 39 | GLOBAL | 650 | LEGACY ms | rock | C / D / E / G / A / A / G / E / D / C |

## Adventure references

VERIFICADA means reference existence in the real catalog, not approval of educational design. PROVISIONAL means mutable first-song binding or missing reference. Secrets have no lesson.

| Object | Type | Reference | Real lesson | Status |
|---|---|---|---|---|
| forest-chest-01 | LESSON_CHEST | 1 | 1. El Saludo del Elefante | VERIFICADA |
| forest-chest-02 | LESSON_CHEST | 2 | 2. Subiendo la Escalera | VERIFICADA |
| forest-chest-03 | LESSON_CHEST | 3 | 3. Bajando la Escalera | VERIFICADA |
| river-chest-01 | LESSON_CHEST | 4 | 4. El Tren se detiene | VERIFICADA |
| river-chest-02 | LESSON_CHEST | 5 | 5. Saltitos de Rana (C-E) | VERIFICADA |
| river-chest-03 | LESSON_CHEST | 6 | 6. Campanitas (Parte 1) | VERIFICADA |
| mountain-chest-01 | LESSON_CHEST | 7 | 7. Campanitas (Final) | VERIFICADA |
| mountain-chest-02 | LESSON_CHEST | 9 | 9. El Gatito Curioso | VERIFICADA |
| mountain-chest-03 | LESSON_CHEST | 10 | 10. Tobogán Largo | VERIFICADA |
| ruins-chest-01 | LESSON_CHEST | 11 | 11. Pin Pon (El Lavado) | VERIFICADA |
| ruins-chest-02 | LESSON_CHEST | 12 | 12. Pin Pon (Final) | VERIFICADA |
| ruins-challenge | CHALLENGE | 13 | 13. Pin Pon Completo | VERIFICADA |
| observatory-final-challenge | CHALLENGE | 35 | 35. Himno a la Alegría | VERIFICADA |
| grotto-echo-reward | SECRET_REWARD | - | - | NOT_APPLICABLE |
| plaza-first-lesson | PRACTICE_STATION | first-song | 2. Subiendo la Escalera | PROVISIONAL |

## Inconsistencies and risks

- Order begins ID2 then ID1; Plaza first-song therefore currently opens Subiendo la Escalera, not ID1. Preserve it; make the binding explicit in Admin rather than silently changing it.
- ID82 Para Elisa occupies order4, shifting the mutable visual order; IDs must never be inferred from display position.
- Original final seed ID40 is absent. Adventure final intentionally references ID35 Himno a la Alegria, not the old Concierto; mark pedagogical assignment provisional until human review.
- River IDs4/5/6 and Mountain7/9/10 are real but provisional educational choices; ID8 exists yet is unused by current Adventure.
- ID2 speed120 and ID8 speed100 differ from old seeds; dual speed semantics must be preserved.
- No auth exists on legacy global song mutation endpoints. Content Platform must close those bypasses, not just hide buttons.
- Admin preview must not award XP, stickers, medals, performances, or change any profile.
