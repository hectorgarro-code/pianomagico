# VALLE DE LAS NOTAS: arquitectura de producto

PRODUCT: VALLE DE LAS NOTAS
PRIMARY INSTRUMENT: PIANO
PRIMARY EXPERIENCE: 3D ADVENTURE
EDUCATIONAL ENGINE: PIANOMAGICO

## Flujo oficial

PROFILE -> ADVENTURE -> EXPLORE -> DISCOVER -> PIANO ACTIVITY -> RESULT -> WORLD PROGRESSION.

- `main.jsx` monta `MusicSuite`: solo seleccion de perfil y Valle. No existe seleccion de instrumento en el producto.
- `profileEntryFlow.js` deriva PROFILE o VALLE del perfil seleccionado; Salir del Valle vuelve a perfiles. Recargar vuelve a perfiles, y elegir el mismo perfil ofrece Continuar cuando tiene progreso Adventure.
- `GameApp` abre `AdventureStart`: Nueva Aventura -> personaje -> intro -> Plaza. Continuar abre directamente el mundo, preservando personaje, cofres y objetivo.
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

Los botones de caminar automatico y Prueba funcional pertenecen a paginas auxiliares de validacion fuera del repositorio, no al juego. Las capturas de aprobacion del entry flow deben comenzar en perfiles y usar la experiencia normal.

SYSTEMS 4 funcionalidad interna aprobada; integracion de entry flow pendiente de aprobacion humana. Sin commit final, sin push, sin SYSTEMS 5.
