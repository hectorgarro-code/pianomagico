import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { CARTOGRAPHY_ASSETS, cartographyAsset, cartographicPathKind, cartographyFrame } from './mapCartography.js';
import { MAP_LANDMARKS, mapIllustration } from './mapLandmarks.js';
import { getValleyMap, playerMapMarker, worldToMap, MAP_COMPOSITIONS } from './valleyNavigation.js';
import { createAdventureState, ALL_ADVENTURE_OBJECTS, beginAdventureActivity, settleAdventureActivity } from '../adventure/adventureState.js';
import { applyValleyEvent } from '../adventure/valleyProgression.js';
import { REGION_IDS as R } from '../adventure/valleyBlueprint.js';

let server, Drawing, Icon, Navigation;
before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr:false }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom', logLevel:'error' });
  const module = await server.ssrLoadModule('/src/game/navigation/CartographyLayer.jsx');
  Drawing = module.default; Icon = module.CartographyIcon;
  Navigation = (await server.ssrLoadModule('/src/game/navigation/WorldNavigation.jsx')).default;
});
after(async () => { await server?.close(); });
const pose = {position:{x:0,z:5},rotation:Math.PI,cameraYaw:0};
const discover = (s, regionId) => applyValleyEvent(s,{type:'REGION_DISCOVERED',regionId});
const render = (model, enlarged = true) => renderToStaticMarkup(React.createElement(Drawing,{model,pose,enlarged}));

test('registry points exclusively to existing local assets and license is CC0', () => {
  for (const path of Object.values(CARTOGRAPHY_ASSETS)) assert.ok(fs.existsSync('public'+path), path);
  assert.match(fs.readFileSync('public/models/kenney_cartography-pack/License.txt','utf8'), /CC0/);
  assert.equal(cartographyAsset('missing'), null);
  assert.match(renderToStaticMarkup(React.createElement(Icon,{asset:'missing',x:5,y:5})), /data-asset-fallback="missing"/);
});
test('landmarks all reference real composition instances without altering their position', () => {
  for (const landmark of MAP_LANDMARKS) {
    const instance = MAP_COMPOSITIONS.find(c=>c.instances.some(i=>i.id===landmark.id)).instances.find(i=>i.id===landmark.id);
    assert.deepEqual(landmark.position,{x:instance.position[0],z:instance.position[2]});
  }
});
test('new Adventure renders only Plaza ink, no unknown region or secret', () => {
  const model=getValleyMap(createAdventureState()), html=render(model);
  assert.match(html,/Plaza de/); assert.doesNotMatch(html,/forest-master-tree|grotto|RIO_DEL_RITMO|MONTA/);
  assert.ok(mapIllustration(model).landmarks.every(l=>l.regionId===R.PLAZA));
});
test('Forest discovery draws actual master tree, fork and chests', () => {
  const html=render(getValleyMap(discover(createAdventureState(),R.FOREST)));
  assert.match(html,/forest-master-tree/); assert.match(html,/junction-west/); assert.match(html,/is-available/); assert.match(html,/is-locked/);
});
test('secret ink only appears after the existing secret discovery', () => {
  let state=discover(createAdventureState(),R.FOREST);
  assert.doesNotMatch(render(getValleyMap(state)),/grotto-interior|Gruta/);
  state=applyValleyEvent(state,{type:'DISCOVERY_RECORDED',id:'echo-grotto-found'});
  state=discover(state,R.GROTTO);
  const html=render(getValleyMap(state));
  assert.match(html,/grotto-interior/); assert.match(html,/is-secret/); assert.match(html,/Gruta del/);
});
test('UNKNOWN chests stay hidden, COMPLETED receives the small check and target remains derived', () => {
  let state=discover(createAdventureState(),R.FOREST);
  state=settleAdventureActivity(beginAdventureActivity(state,'forest-chest-01',1),'forest-chest-01',{completed:true,activityId:1});
  const model=getValleyMap(state);
  const html=render({...model,chests:[...model.chests,{id:'unknown-test',state:'UNKNOWN',position:{x:0,z:0}}]});
  assert.doesNotMatch(html,/unknown-test/); assert.match(html,/cartography-check/); assert.match(html,/data-map-target="forest-chest-02"/);
  assert.doesNotMatch(render(getValleyMap(state,null)),/data-map-target/);
});
test('map representation keeps world transform, north and player orientation', () => {
  const marker=playerMapMarker(pose);
  assert.deepEqual(marker,{...worldToMap(pose.position),angle:0});
  assert.match(render(getValleyMap(createAdventureState())),new RegExp('translate\\('+marker.x+' '+marker.y+'\\) rotate\\(0\\)'));
  assert.ok(worldToMap({x:0,z:-10}).y<worldToMap({x:0,z:10}).y);
});
test('local framing follows player while full framing includes all discovered authored paths', () => {
  const model=getValleyMap(Object.values(R).reduce(discover,createAdventureState())), illustration=mapIllustration(model), marker=playerMapMarker(pose);
  assert.deepEqual(cartographyFrame(illustration,marker,false),{x:marker.x-65,y:marker.y-85,width:130,height:170});
  const frame=cartographyFrame(illustration,marker,true);
  for(const p of illustration.mapPoints) assert.ok(p.x>=frame.x && p.x<=frame.x+frame.width && p.y>=frame.y && p.y<=frame.y+frame.height);
  assert.equal(cartographicPathKind({id:'river-island-detour'}),'secondary');
  const forward={...getValleyMap(createAdventureState()),target:{id:'forward-target',label:'Destino',position:{x:0,z:-124}}};
  const forwardFrame=cartographyFrame(mapIllustration(forward),marker,true),target=worldToMap(forward.target.position);
  assert.ok(target.y>=forwardFrame.y && target.y<=forwardFrame.y+forwardFrame.height);
  assert.doesNotMatch(render(forward),/data-map-region="OBSERVATORIO_MUSICAL"/);
});
test('all progress stages preserve discovered labels without leaking other regions', () => {
  let state=createAdventureState();
  let expected=0;
  for(const id of [R.PLAZA,R.FOREST,R.RIVER,R.MOUNTAIN,R.GROTTO,R.RUINS,R.OBSERVATORY]) {
    if(id===R.GROTTO) state=applyValleyEvent(state,{type:'DISCOVERY_RECORDED',id:'echo-grotto-found'});
    state=discover(state,id); const model=getValleyMap(state),html=render(model);
    assert.equal(model.regions.length,++expected);
    for(const region of model.regions) assert.match(html,new RegExp('data-map-region="'+region.id+'"'));
    for(const object of ALL_ADVENTURE_OBJECTS.filter(o=>!model.regions.some(r=>r.id===o.regionId))) assert.ok(!html.includes('data-map-chest="'+object.id+'"'));
    for(const object of ALL_ADVENTURE_OBJECTS.filter(o=>o.regionId===id && o.activityId)) {
      state=beginAdventureActivity(state,object.id,object.activityId);
      state=settleAdventureActivity(state,object.id,{completed:true,activityId:object.activityId});
    }
  }
  assert.equal(getValleyMap(state).target,null);
});
test('desktop local map and compact mobile control share one accessible map contract', () => {
  const html=renderToStaticMarkup(React.createElement(Navigation,{adventure:createAdventureState(),pose,active:true,onOpenChange(){}}));
  assert.match(html,/valley-minimap/);assert.match(html,/valley-mobile-map/);assert.match(html,/Abrir mapa/);
  const css=fs.readFileSync('src/game/navigation/worldNavigation.css','utf8');
  assert.match(css,/@media\(max-width:767px\)/);assert.match(css,/\.valley-minimap \{ display:none/);assert.match(css,/100dvh/);assert.match(css,/prefers-reduced-motion/);
});
