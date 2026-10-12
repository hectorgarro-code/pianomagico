import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { EQUIPMENT } from './characterEquipment.js';

let server, Customizer;
before(async()=>{
  server=await createServer({server:{middlewareMode:true,hmr:false},optimizeDeps:{noDiscovery:true,include:[]},appType:'custom',logLevel:'error'});
  Customizer=(await server.ssrLoadModule('/src/game/presentation/VisualCustomizer.jsx')).default;
});
after(async()=>{await server?.close();});
const render=initialTab=>renderToStaticMarkup(React.createElement(Customizer,{profile:{id:4,avatarId:1},gameplay:{unlockedPets:[],equippedPetId:null},initialTab}));
test('visual customization preserves five real heroes, four icon categories and action previews',()=>{
  const html=render('CHARACTER');
  for(const name of ['Knight','Mage','Barbarian','Rogue','Ranger'])assert.match(html,new RegExp(`aria-label="${name}"`));
  for(const label of ['Personaje','Armas','Mascotas','Coleccion','Probar accion Q','Probar accion E','Girar a la izquierda'])assert.match(html,new RegExp(`aria-label="${label}"`));
  assert.doesNotMatch(html,/<select|Aplicar cambios|2H_Melee|Spellcast/);
  assert.match(html,/Informacion del aventurero/);assert.match(html,/is-character-showcase/);
  assert.match(html,/Piano/);assert.match(html,/Espada y escudo/);
  assert.doesNotMatch(html,/<meter|<progress|hitPoints|armadura/i);
  assert.ok(existsSync('public/images/entry/character-sanctuary-v1.webp'));
});
test('arsenal renders existing compatible choices as visual previews, not dropdowns or clip names',()=>{
  const html=render('EQUIPMENT');
  for(const eq of EQUIPMENT[1])assert.match(html,new RegExp(`aria-label="${eq.label}"`));
  assert.match(html,/visual-choice-grid/);assert.doesNotMatch(html,/<select|Melee_Attack|Aplicar cambios/);
});
test('locked pets conceal identity and use paginated discovery silhouettes',()=>{
  const html=render('PET');
  assert.equal((html.match(/aria-label="Mascota por descubrir"/g)||[]).length,9);
  assert.match(html,/Pagina 3/);assert.match(html,/Mas mascotas/);assert.doesNotMatch(html,/<select|animal-deer|Elefante/);
});
test('title uses existing local scenery and remains independent from gameplay generation',()=>{
  const source=readFileSync(new URL('../entry/TitleScene.jsx',import.meta.url),'utf8');
  assert.doesNotMatch(source,/WorldGenerator|plazaComposition|Math.random/);
  for(const [,name]of source.matchAll(/\['([^']+\.(?:glb|gltf))'/g))assert.ok(existsSync(`public/models/props/${name.endsWith('.glb')?'':'Assets/gltf/'}${name}`),name);
  assert.match(source,/loadCharacterPresentation\(1\)/);assert.match(source,/heroVisible/);
});
test('initial cover uses responsive illustrated assets without mounting the title renderer',()=>{
  const title=readFileSync(new URL('../entry/TitleScreen.jsx',import.meta.url),'utf8');
  for(const [,path]of title.matchAll(/(?:src|srcSet)="(images\/entry\/[^"]+)"/g))assert.ok(existsSync(`public/${path}`),path);
  assert.match(title,/<picture/);assert.match(title,/max-aspect-ratio/);assert.match(title,/fetchPriority="high"/);
  assert.match(title,/onClick=\{onEnter\}/);assert.match(title,/className="sr-only">VALLE DE LAS NOTAS/);
  const suite=readFileSync(new URL('../../modules/core/MusicSuite.jsx',import.meta.url),'utf8');
  assert.match(suite,/entry.screen === 'ADVENTURE' \? <TitleScene[^]*: null/);
});
test('selection reuses existing persistence, keeps previews mounted across categories and confines keys',()=>{
  const source=readFileSync(new URL('./VisualCustomizer.jsx',import.meta.url),'utf8');
  assert.match(source,/await onSelect\?\.\(c,e,p\)/);assert.match(source,/await onConfirm\(character,equipment,pet\)/);
  assert.doesNotMatch(source,/RESET_ADVENTURE|resetAdventure|<select|key=\{tab\}[^]*<AssetStage/);
  assert.match(source,/stopImmediatePropagation/);assert.match(source,/onTouchEnd/);
  const preview=readFileSync(new URL('./VisualPreview.jsx',import.meta.url),'utf8');
  assert.match(preview,/cache.has\(key\)/);assert.match(preview,/queue.catch/);assert.match(preview,/forceContextLoss/);
});
