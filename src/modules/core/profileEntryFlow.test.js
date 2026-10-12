import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { profileEntryReducer, getEntryScreen } from './profileEntryFlow.js';
import { createAdventureState, beginAdventureActivity, settleAdventureActivity } from '../../game/adventure/adventureState.js';
import { getNewAdventurePhase, hasAdventureProgress } from '../../game/adventure/adventureStart.js';
import { createWorldActivityState, worldActivityReducer } from '../../game/state/worldActivityFlow.js';
import { createAdventurePersistence } from '../../game/services/adventurePersistence.js';

let server, LoginScreen, AdventureStart, ValleyLessonEntry, pianoHelpers, TitleScreen;
before(async () => {
  server = await createServer({ server: { middlewareMode: true }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom', logLevel: 'error' });
  LoginScreen = (await server.ssrLoadModule('/src/modules/core/LoginScreen.jsx')).default;
  TitleScreen = (await server.ssrLoadModule('/src/game/entry/TitleScreen.jsx')).default;
  AdventureStart = (await server.ssrLoadModule('/src/game/adventure/AdventureStart.jsx')).default;
  ValleyLessonEntry = (await server.ssrLoadModule('/src/game/piano/ValleyLessonEntry.jsx')).default;
  pianoHelpers = await server.ssrLoadModule('/src/modules/piano-magico/PianoMagico.jsx');
});
after(async () => { await server?.close(); });
const profile = { id: 2, avatarId: 2, name: 'SOPHIA', total_score: 2500 };
const renderEntry = props => renderToStaticMarkup(React.createElement(AdventureStart, { phase: 'ENTRY', profile, canContinue: false, ...props }));

test('Valley preparation renders real notes and one configurable practice/challenge/final card', () => {
  for (const [object, label] of [[{id:'practice',type:'PRACTICE_STATION'},'Practica libre'],[{id:'challenge',type:'CHALLENGE'},'Desafio musical'],[{id:'observatory-final-challenge',type:'CHALLENGE'},'Desafio final del Valle']]) {
    const html = renderToStaticMarkup(React.createElement(ValleyLessonEntry, {object,song:{id:2,title:'2. Subiendo la Escalera',sequence:['C4','D4','E4']}}));
    assert.match(html, new RegExp(label)); assert.match(html, /Escuchar ejemplo/); assert.match(html, /Comenzar leccion/);
    for (const note of ['DO4','RE4','MI4']) assert.match(html,new RegExp(note));
    assert.doesNotMatch(html,/2\. 2\./);
  }
});
test('preview uses existing solfege, frequency and legacy speed semantics unchanged', () => {
  assert.deepEqual(pianoHelpers.getSequenceArray('DO4 RE4:2 SILENCIO:1'),['C4:1','D4:2','R:1']);
  assert.equal(pianoHelpers.getIntervalMs(1300),1300);
  assert.equal(pianoHelpers.getIntervalMs(120),500);
  assert.equal(pianoHelpers.getIntervalMs(null),600);
  assert.equal(pianoHelpers.getNoteFrequency('A4'),440);
});

test('legacy profile reducer remains compatible and ignores instrument selection; entry experience owns fresh load', () => {
  assert.equal(getEntryScreen(null), 'PROFILE');
  const loggedIn = profileEntryReducer(null, { type: 'SELECT_PROFILE', userId: 2 });
  assert.equal(getEntryScreen(loggedIn), 'VALLE');
  assert.equal(profileEntryReducer(loggedIn, { type: 'SELECT_INSTRUMENT', instrument: 'guitar' }), loggedIn);
  assert.equal(profileEntryReducer(null, { type: 'SELECT_PROFILE', userId: 'not-a-user' }), null);
  assert.equal(getEntryScreen(profileEntryReducer(loggedIn, { type: 'EXIT_VALLE' })), 'PROFILE');
  assert.equal(getEntryScreen(profileEntryReducer(null, { type: 'SELECT_PROFILE', userId: '2' })), 'VALLE');
});

test('title presents only the game identity and native accessible entry button, never profile or Adventure HUD', () => {
  const html = renderToStaticMarkup(React.createElement(TitleScreen));
  assert.match(html, /VALLE DE LAS NOTAS/); assert.match(html, /Una aventura musical/); assert.match(html, /Entrar al Valle/);
  assert.doesNotMatch(html, /BASTIAN|XP|Debug World|Abrir mapa|Cofre|Elige tu perfil/);
});
test('existing profile opens adventurer preparation directly with JUGAR, never the resume screen', () => {
  const html = renderEntry({sharedEntry:true,canContinue:true,summary:{region:'Rio del Ritmo',objective:'Explora el Rio',completed:2,total:6},gameplay:{equippedPetId:'kenney-cube-pets:animal-deer'}});
  assert.match(html,/Elige tu aventurero/);assert.match(html,/aria-label="JUGAR"/);assert.match(html,/Personaje 3D/);assert.match(html,/aria-label="Armas"/);
  assert.doesNotMatch(html,/entry-resume-layout|entry-region-dots|Continuar aventura|Personalizar"|Nueva Aventura|aria-label="Listo"/);
});

test('rendered profile screen has real profiles, never instrument selection or character customization', () => {
  const html = renderToStaticMarkup(React.createElement(LoginScreen, { users: [profile] }));
  assert.match(html, /Elige tu perfil/);
  assert.match(html, /Entrar como SOPHIA/);
  assert.match(html, /Comenzar aventura/);
  assert.doesNotMatch(html, /Galáctica|Galactic|Instrumento|Uke Hero|Piano Mágico|Personaje Anterior|canvas/i);
});

test('profile presentation uses authored art and dynamic names without inventing players or pets',()=>{
  const users=[profile,{id:4,avatarId:5,name:'QA GAMEPLAY CONTENT 1',summary:{existing:true}}];
  const html=renderToStaticMarkup(React.createElement(LoginScreen,{users}));
  assert.equal((html.match(/class="valley-profile"/g)||[]).length,2);
  for(const art of ['profile-valley-v1.webp','profile-heading-v1.webp','profile-pedestal-v1.webp'])assert.match(html,new RegExp(art));
  assert.match(html,/Entrar como QA GAMEPLAY CONTENT 1/);assert.match(html,/Continuar aventura/);assert.match(html,/data-profile-portrait="4"/);
  assert.doesNotMatch(html,/BASTIAN|TIZIANO|Nueva mascota|<select/);
});

test('new profile prepares its character and JUGAR starts approved Plaza; legacy intro remains available', () => {
  const adventure = createAdventureState();
  assert.equal(getNewAdventurePhase(adventure), 'CHARACTER');
  assert.doesNotMatch(renderEntry(), /Continuar/);
  const characters = renderEntry({ phase: 'CHARACTER' });
  for (const name of ['Knight', 'Mage', 'Barbarian', 'Rogue']) assert.match(characters, new RegExp(name));
  assert.match(characters, /JUGAR/);
  const intro = renderEntry({ phase: 'INTRO' });
  assert.match(intro, /Tu aventura comienza en la Plaza/);
  assert.match(intro, /Comenzar/);
  const playing = worldActivityReducer(createWorldActivityState(adventure), { type: 'START_ADVENTURE' });
  assert.equal(playing.mode, 'WORLD');
  assert.deepEqual(playing.game.player.position, { x: 0, y: 0.15, z: 5 });
});

test('existing adventure offers JUGAR; explicit New still requires confirmation and cannot silently reset progress', () => {
  const completed = settleAdventureActivity(beginAdventureActivity(createAdventureState(), 'forest-chest-01', 1), 'forest-chest-01', { activityId: 1, completed: true });
  const before = structuredClone(completed);
  assert.equal(getNewAdventurePhase(completed), 'CONFIRM_NEW');
  assert.deepEqual(completed, before);
  assert.match(renderEntry({ canContinue: true }), /JUGAR/);
  assert.doesNotMatch(renderEntry({ canContinue: true }), /Continuar|Nueva Aventura/);
  const confirmation = renderEntry({ phase: 'CONFIRM_NEW' });
  assert.match(confirmation, /alertdialog/);
  assert.match(confirmation, /Cancelar/);
  assert.match(confirmation, /progreso educativo/);
  assert.equal(getNewAdventurePhase(completed, true), 'CHARACTER');
});

test('Continue restores character, objective and chests; confirmed New resets only Adventure', () => {
  const storage = new Map([['educational-history', 'performances-and-medals'], ['user_avatar_2', '2']]);
  const persistence = createAdventurePersistence(() => ({ getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) }));
  let adventure = settleAdventureActivity(beginAdventureActivity(createAdventureState(), 'forest-chest-01', 1), 'forest-chest-01', { activityId: 1, completed: true });
  adventure = { ...adventure, journey: { started: true, objective: 'FIND_FIRST_CHEST' } };
  persistence.save(2, adventure);
  let flow = createWorldActivityState(persistence.load(2));
  flow = worldActivityReducer(flow, { type: 'PROFILE', profile });
  flow = worldActivityReducer(flow, { type: 'START_ADVENTURE' });
  assert.equal(flow.game.player.characterId, 2);
  assert.equal(flow.game.adventure.entries['forest-chest-01'].state, 'COMPLETED');
  assert.equal(flow.game.adventure.journey.objective, 'FIND_FIRST_CHEST');
  const reset = worldActivityReducer(flow, { type: 'RESET_ADVENTURE' });
  persistence.save(2, reset.game.adventure);
  assert.equal(hasAdventureProgress(persistence.load(2)), false);
  assert.equal(reset.game.progression.xp, 2500);
  assert.equal(reset.game.player.characterId, 2);
  assert.equal(storage.get('educational-history'), 'performances-and-medals');
  assert.equal(storage.get('user_avatar_2'), '2');
});

test('normal startup hides development controls; explicit debug can expose them', () => {
  assert.doesNotMatch(renderEntry(), /Desarrollo|Saltar intro|Reiniciar aventura/);
  assert.match(renderEntry({ phase:'INTRO', debugEnabled: true }), /Desarrollo/);
});
