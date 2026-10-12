# VALLE DE LAS NOTAS: arquitectura de producto

PRODUCT: VALLE DE LAS NOTAS
PRIMARY INSTRUMENT: PIANO
PRIMARY EXPERIENCE: 3D ADVENTURE
EDUCATIONAL ENGINE: PIANOMAGICO

## Flujo oficial

TITLE -> PROFILE -> ADVENTURE -> EXPLORE -> DISCOVER -> PIANO ACTIVITY -> RESULT -> WORLD PROGRESSION.

- ENTRY EXPERIENCE 2 reemplaza la entrada PROFILE-first por portada del mundo real. `main.jsx` monta `MusicSuite`; no existe seleccion de instrumento. Ver `ENTRY_EXPERIENCE_2.md`.
- `entry/entryExperience.js` controla TITLE/PROFILES/ADVENTURE. Recargar vuelve a TITLE; Salir del Valle vuelve a PROFILES; Volver desde perfiles vuelve a TITLE. `profileEntryFlow.js` queda como helper legacy compatible, no como autoridad de la entrada.
- Revision de entrada solicitada por el usuario: `GameApp` abre siempre `AdventureStart` con el selector de aventurero, tanto para perfiles nuevos como existentes. PERFIL -> AVENTURERO/ARMAS/MASCOTA -> JUGAR -> MUNDO. Se retira la pantalla resumen/Continuar y no se intercala la intro en el flujo normal (el componente narrativo se conserva). JUGAR espera el guardado cosmetico y ejecuta START_ADVENTURE, nunca RESET_ADVENTURE; conserva cofres, objetivos y progreso educativo. Volver desde el selector regresa a perfiles. La personalizacion dentro del mundo conserva Listo y su retorno al mismo contexto.
- GAME UI 2 autoriza una excepcion de presentacion a ENTRY EXPERIENCE 2: `TitleScene` es un decorado 3D independiente, autorado y liviano; no genera ni cambia el Valle jugable. `SharedWorldProvider` monta World3DView al entrar al mundo y conserva ese renderer pausado al salir. La portada no carga WorldGenerator. Previews de perfiles usan un renderer con scissor; la personalizacion usa una escena activa y miniaturas cacheadas de los modelos reales. Ver `GAME_UI_2.md`.
- Revision visual posterior solicitada por el usuario: TITLE utiliza una ilustracion fantastica raster, con versiones horizontal/vertical y controles HTML reales. No monta TitleScene en la portada; ese decorado 3D se conserva como fondo de perfiles/preparacion. No cambia el flujo ni el mundo. Ver `TITLE_ARTWORK.md`.
- Seleccion de perfiles actualizada: fondo/pedestales raster con personajes y mascotas 3D reales encima, un solo renderer con scissor. TitleScene se reserva para preparacion de Adventure, no se carga detras de los fondos ilustrados de TITLE ni PROFILES. Los perfiles y la entrada a Adventure conservan sus contratos existentes.
- Nueva Aventura con progreso requiere confirmacion antes de reiniciar Adventure. Cancelar no modifica nada. El reinicio no toca usuario, XP, interpretaciones ni medallas.
- El perfil identifica al alumno y su historial educativo. Knight / Mage / Barbarian / Rogue son su identidad visual de aventura, persistida con el campo avatar existente del perfil; no son clases ni perfiles educativos nuevos.
- `LoginScreen` selecciona perfiles, nunca personajes. El personaje se elige al crear la aventura o en desarrollo explicito.
- Lesson Chests y Practice Stations abren `PianoStageView`, que reutiliza `PianoMagico`. Challenges y Secret Rewards siguen siendo tipos previstos, no nuevas actividades implementadas.
- Resultado o cancelacion vuelve al mismo contexto del mundo. Recargar conserva Adventure por perfil y origen del navegador, no la posicion exacta; el inicio restaurado sigue en Plaza.

## Legacy conservado

`InstrumentSelection`, `UkeHero` y `MusicStudio` permanecen en el repositorio, sin imports ni rutas desde MusicSuite. No se borraron ni se presentan como opciones de Valle.

El menu/mapa, compositor y administracion anteriores de PianoMagico permanecen en su modulo. La integracion de Valle usa exclusivamente actividades embebidas; no abre su producto independiente ni su antiguo mapa como entrada al juego.

Las referencias galacticas de modulos historicos desconectados no se reinterpretan como marca de Valle. No agregarlas a la experiencia principal.

## Desarrollo

Las herramientas de AdventureStart y World3DView requieren DEV y `?debug=1`. No aparecen en el flujo normal ni en produccion.

Los botones de caminar automatico y Prueba funcional pertenecen a paginas auxiliares de validacion fuera del repositorio, no al juego. Las capturas del nuevo entry flow deben comenzar en portada y usar la experiencia normal.

SYSTEMS 4 + ENTRY FLOW 4.5 aprobados; checkpoint `734efe3 - Valle de las Notas new adventure and unified entry flow`. Arquitectura oficial congelada: no reintroducir seleccion de instrumento.

## Progresion global
WORLD BUILD 2 materializa el cierre del Valle: Gruta opcional con Secret Reward, Ruinas con dos lecciones y Challenge, Observatorio con Challenge final y pantalla Continuar explorando. Los tipos previstos ahora tienen bindings reales al motor de piano existente. Reemplaza las restricciones historicas de alcance que siguen abajo como registro. Ver `WORLD_BUILD_2.md`.
WORLD BUILD 1 incorpora rutas fisicas de Rio/Montana, bifurcacion y entrada de Gruta, reutilizando los contratos existentes. Las dos rutas requieren tres cofres reales cada una y habilitan Ruinas conjuntamente; no hay menu de eleccion ni monedas nuevas. Checkpoint SYSTEMS 5 aprobado: fba5ee4. Ruinas/Observatorio siguen fuera de alcance.

SYSTEMS 5 extiende Adventure con hechos versionados y requisitos declarativos. `getValleyProgress` deriva regiones, gates, objetivos y final; no duplica XP, medallas, performances ni rangos. Ver `VALLEY_PROGRESSION.md` para contratos, topologia y migracion v1 -> v2.

Bosque utiliza sus tres cofres reales. Rio y Montana quedan disponibles juntos al completarlo; ambas completadas habilitan Ruinas; Ruinas habilita Observatorio y su completion representa el final. Gruta es secreta/opcional. Los hitos de futuras regiones son provisionales y solo simulables; no hay regiones nuevas construidas.

SYSTEMS 5 pendiente de aprobacion humana: sin commit final, sin push ni nuevas regiones.
