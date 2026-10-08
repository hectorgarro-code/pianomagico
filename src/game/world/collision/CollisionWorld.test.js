import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {CollisionWorld,circleContact,PLAYER_COLLIDER} from './CollisionWorld.js';
import {getModelCollisionBounds,materializeCollider} from './modelColliders.js';
import {PLAZA_COMPOSITION as plaza} from '../composition/plazaComposition.js';
import {FOREST_COMPOSITION as forest} from '../composition/forestComposition.js';
import {validateComposition} from '../composition/validateComposition.js';

const circle={type:'solid',shape:'circle',x:0,z:0,radius:1};
const box={type:'solid',shape:'box',x:0,z:0,halfWidth:.5,halfDepth:2,yaw:0};
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,`${a} != ${b}`);

test('circle versus circle handles contact, tangent and coincident centers',()=>{
  close(circleContact({x:1,z:0},.5,circle).depth,.5);
  assert.equal(circleContact({x:1.5,z:0},.5,circle),null);
  assert.equal(circleContact({x:0,z:0},.5,circle).x,1);
});
test('circle versus oriented box handles sides, corners and inside',()=>{
  close(circleContact({x:.7,z:0},.3,box).depth,.1);
  assert.equal(circleContact({x:1,z:2.5},.3,box),null);
  assert.ok(circleContact({x:.6,z:2.1},.3,box));
  close(circleContact({x:0,z:0},.3,box).depth,.8);
  assert.equal(circleContact({x:0,z:2},.3,{...box,yaw:Math.PI/2}),null);
});
test('free movement preserves requested displacement without mutating caller or Y',()=>{
  const p={x:1,y:4,z:2},world=new CollisionWorld([circle]);
  const next=world.move(p,{x:2,z:1});close(next.x,3);close(next.z,3);
  assert.deepEqual(p,{x:1,y:4,z:2});
});
test('direct movement is blocked; fast travel cannot tunnel through a thin wall',()=>{
  const world=new CollisionWorld([circle]);
  const p=world.move({x:0,z:3},{x:0,z:-6});
  close(p.z,1+PLAYER_COLLIDER.radius);assert.equal(world.overlaps(p),false);
  const wall=new CollisionWorld([{...box,halfWidth:.015,halfDepth:4}]);
  const q=wall.move({x:-5,z:0},{x:10,z:0});close(q.x,-.015-PLAYER_COLLIDER.radius);
});
test('diagonal movement slides along walls and around trunks',()=>{
  const wall=new CollisionWorld([box]);
  const p=wall.move({x:-1.5,z:-1},{x:2,z:1.5});
  close(p.x,-.5-PLAYER_COLLIDER.radius);close(p.z,.5);
  const trunk=new CollisionWorld([circle]);
  const q=trunk.move({x:-1.8,z:1.2},{x:2,z:-.5});
  assert.ok(q.x>-.9);assert.equal(trunk.overlaps(q),false);
});
test('non-solid visuals do not block; nearby query excludes distant models',()=>{
  const world=new CollisionWorld([{...circle,type:'none'},...Array.from({length:100},(_,i)=>({...circle,x:100+i*5}))]);
  const p=world.move({x:0,z:2},{x:0,z:-4});close(p.z,-2);assert.equal(world.lastChecks,0);
});
test('spawn overlap depenetrates; a visually sufficient gap remains traversable',()=>{
  const world=new CollisionWorld([{...circle,x:-1.1,radius:.5},{...circle,x:1.1,radius:.5}]);
  const p=world.move({x:0,z:2},{x:0,z:-4});close(p.z,-2);close(p.x,0);
  const single=new CollisionWorld([circle]);assert.equal(single.overlaps(single.move({x:0,z:0},{x:0,z:0})),false);
});
test('transformed box and circle include parent origin, rotation and nonuniform scale',()=>{
  const model=new THREE.Mesh(new THREE.BoxGeometry(2,4,1));
  const parent=new THREE.Group();parent.position.set(10,0,20);
  const instance=model.clone();instance.position.set(2,0,3);instance.scale.set(2,1,3);instance.rotation.y=Math.PI/2;parent.add(instance);
  const definition={id:'wall',collision:{type:'solid',shape:'box',source:'bounds'}};
  const c=materializeCollider(instance,definition,model,'test');
  close(c.x,12);close(c.z,23);close(c.halfWidth,2);close(c.halfDepth,1.5);close(c.yaw,Math.PI/2);
  const r=materializeCollider(instance,{...definition,collision:{type:'solid',shape:'circle',source:'base',radius:.2}},model,'test');close(r.radius,.6);
  assert.equal(getModelCollisionBounds(model),getModelCollisionBounds(model));
});
test('trunk sampling excludes the wide crown and reuses cached native bounds',()=>{
  const tree=new THREE.Group();
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.15,.25,2,12));trunk.position.y=1;
  const crown=new THREE.Mesh(new THREE.BoxGeometry(8,3,8));crown.position.y=4;
  tree.add(trunk,crown);
  const bounds=getModelCollisionBounds(tree);assert.ok(bounds.baseRadius<.4);
  assert.equal(bounds.bounds.max.x,4);
  const clone=tree.clone();clone.scale.setScalar(2);
  const c=materializeCollider(clone,{id:'tree',collision:{type:'solid',shape:'circle',source:'base'}},tree,'test');
  assert.ok(c.radius<.8);
  assert.equal(new CollisionWorld([c]).overlaps({x:2,z:0}),false);
});
test('current coverage keeps floors, crown and lintels free; interaction is separate',()=>{
  const solid=p=>p.instances.filter(i=>i.collision?.type==='solid');
  assert.equal(solid(plaza).length,18);assert.equal(solid(forest).length,33);
  for(const i of [...plaza.instances,...forest.instances].filter(i=>i.kind==='trees'))assert.deepEqual(i.collision,{type:'solid',shape:'circle',source:'base'});
  for(const i of plaza.instances.filter(i=>i.id.includes('lintel')||i.role==='floor'))assert.notEqual(i.collision?.type,'solid');
  assert.equal(plaza.stations[0].interactionRadius,3);
  const chest=plaza.instances.find(i=>i.id===plaza.stations[0].instanceId);assert.equal(chest.collision.shape,'box');
});
test('composition collision contract rejects malformed or unsupported shapes',()=>{
  const registeredAssets=[...new Set(plaza.instances.map(i=>i.assetUrl))];
  for(const collision of [null,{type:'magic'},{type:'solid',shape:'mesh',source:'bounds'},{type:'solid',shape:'circle',source:'base',radius:0},{type:'solid',shape:'box',source:'bounds',size:[1,-1]}]) {
    const copy=structuredClone(plaza);copy.instances[0].collision=collision;
    assert.equal(validateComposition(copy,{registeredAssets}).valid,false);
  }
});
