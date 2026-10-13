import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {EQUIPMENT,readEquipment,saveEquipment} from './characterEquipment.js';
import {getCharacterModel} from '../../modules/core/utils/characterModels.js';
import {loadEquipmentCollection,unlockEquipment,saveEquipmentCollection,canEquip} from './equipmentCollection.js';

const storage=()=>{const values=new Map();return {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};};
test('all eleven native loadouts have their exact sockets and Q/E animation clips in the real GLBs',()=>{
  for(const id of [1,2,3,4]){
    const b=readFileSync('public'+getCharacterModel(id).file);
    const gltf=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString());
    assert.equal(gltf.skins[0].joints.length,41);
    const clips=gltf.animations.map(a=>a.name);
    for(const eq of EQUIPMENT[id]){
      assert.ok(clips.includes(eq.Q),eq.id+' Q');assert.ok(clips.includes(eq.E),eq.id+' E');
      for(const name of eq.nodes){
        const index=gltf.nodes.findIndex(n=>n.name===name);assert.ok(index>=0,name);
        assert.ok(gltf.nodes.some(n=>/^handslot\.[lr]$/.test(n.name)&&n.children?.includes(index)),name+' mounted in native hand');
      }
    }
  }
  assert.equal([1,2,3,4].flatMap(id=>EQUIPMENT[id]).length,11);
});
test('starter collection migrates only actual legacy choices and isolates profiles',()=>{
  const s=storage();saveEquipment(4,1,'dual-swords',s);
  const a=loadEquipmentCollection(4,s);assert.ok(a.includes('dual-swords'));
  assert.ok(!a.includes('greatsword'));assert.ok(!loadEquipmentCollection(5,s).includes('dual-swords'));
  saveEquipmentCollection(4,a,s);assert.deepEqual(loadEquipmentCollection(4,s),a);
  assert.equal(readEquipment(4,1,s),'dual-swords');
  assert.equal(canEquip(2,'dual-swords',a),false);assert.equal(canEquip(1,'greatsword',a),false);
});
test('validated world achievements unlock cosmetics once without educational rewards',()=>{
  const s=storage(),initial=loadEquipmentCollection(1,s);
  const adventure={toy:{completedMechanisms:['forest-three-runes'],collectedNotes:['secret-mountain-chord-a'],discoveredSecrets:['river-bridge-pocket']}};
  const next=unlockEquipment(initial,adventure);
  assert.ok(next.includes('dual-swords'));assert.ok(next.includes('greatsword'));
  assert.ok(!next.includes('heavy-crossbow')); // Serialized discovery alone is not proof.
  assert.deepEqual(unlockEquipment(next,adventure),next);
  assert.deepEqual(unlockEquipment(next,{}),next); // Profile cosmetics survive a new Adventure.
  assert.equal(adventure.xp,undefined);assert.equal(canEquip(1,'greatsword',next),true);
  saveEquipment(1,1,'greatsword',s);saveEquipmentCollection(1,next,s);
  assert.equal(readEquipment(1,1,s),'greatsword');assert.ok(loadEquipmentCollection(1,s).includes('greatsword'));
});
