import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { CHARACTER_ACTIONS, rotateShowcase, resolveCharacterAction, createCharacterAnimator } from './characterActions.js';
import { assistedCameraYaw } from '../world/cameraAssist.js';
import { lessonEntryData } from '../piano/lessonEntryData.js';
import { playPianoTone } from '../../modules/piano-magico/pianoTone.js';
import { createWorldActivityState, worldActivityReducer as reduce } from '../state/worldActivityFlow.js';
import { FINAL_CHALLENGE } from '../world/composition/finalAdventureComposition.js';
import { ADVENTURE_OBJECT_TYPES as TYPES } from '../world/composition/forestAdventureComposition.js';
import { FOREST_COMPOSITION } from '../world/composition/forestComposition.js';
import { JUNCTION_COMPOSITION } from '../world/composition/junctionComposition.js';
import { RIVER_COMPOSITION } from '../world/composition/riverComposition.js';
import { pointToSegmentDistance } from '../world/worldGenerationRules.js';

for (const [index, name] of ['Knight', 'Mage', 'Barbarian', 'Rogue'].entries()) test(`${name}: Q/E reference real GLB clips, including Idle and locomotion`, () => {
  const bytes = fs.readFileSync(`public/models/characters/${name}.glb`);
  const doc = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
  const clips = doc.animations.map(a => a.name);
  for (const clip of ['Idle', 'Walking_A', 'Running_A', ...Object.values(CHARACTER_ACTIONS[index + 1])]) assert.ok(clips.includes(clip), clip);
});
test('rotation wraps continuously without changing selected character or position', () => {
  assert.ok(Math.abs(rotateShowcase(Math.PI - .1, .2) - (-Math.PI + .1)) < 1e-10);
  assert.equal(rotateShowcase(0, 0), 0);
  assert.ok(Math.abs(rotateShowcase(.3, Math.PI * 2) - .3) < 1e-10);
});
test('missing expression clips use real fallback, never a fabricated animation', () => {
  assert.equal(resolveCharacterAction(2, 'Q', ['Idle', 'Cheer']), 'Cheer');
  assert.equal(resolveCharacterAction(2, 'E', ['Idle', 'Jump_Full_Short']), 'Jump_Full_Short');
  assert.equal(resolveCharacterAction(2, 'E', ['Idle']), 'Idle');
});
for (const key of ['Q', 'E']) test(`${key} locks incompatible action, returns to Idle and resumes Walk without displacement`, () => {
  const root = new THREE.Group(); root.position.set(3, 2, -8);
  const clips = ['Idle', 'Walking_A', CHARACTER_ACTIONS[2][key]].map(name => new THREE.AnimationClip(name, .3, []));
  const mixer = new THREE.AnimationMixer(root), animator = createCharacterAnimator(mixer, clips, 2);
  assert.equal(animator.name, 'Idle'); assert.equal(animator.express(key), true);
  assert.equal(animator.locked, true); assert.equal(animator.express(key), false);
  animator.locomotion('Walking_A'); assert.equal(animator.name, CHARACTER_ACTIONS[2][key]);
  mixer.update(.5); assert.equal(animator.locked, false); assert.equal(animator.name, 'Idle');
  animator.locomotion('Walking_A'); assert.equal(animator.name, 'Walking_A');
  assert.deepEqual(root.position.toArray(), [3, 2, -8]); animator.dispose();
});
test('camera assist is gradual, shortest-angle, bounded and inactive at rest', () => {
  const input = { yaw: 0, rotation: Math.PI / 2, moving: true, dragging: false, sinceManual: 4, delta: .02 };
  const next = assistedCameraYaw(input);
  assert.ok(next < 0 && Math.abs(next) <= .015);
  assert.equal(assistedCameraYaw({ ...input, moving: false }), 0);
  const wrapped = assistedCameraYaw({ ...input, yaw: Math.PI - .01, rotation: .01 });
  assert.ok(wrapped > Math.PI - .01);
});
test('manual camera input suspends assist, then resumes without snap', () => {
  const input = { yaw: .8, rotation: Math.PI, moving: true, dragging: false, sinceManual: 1, delta: .016 };
  assert.equal(assistedCameraYaw(input), .8);
  assert.equal(assistedCameraYaw({ ...input, dragging: true, sinceManual: 10 }), .8);
  const resumed = assistedCameraYaw({ ...input, sinceManual: 2 });
  assert.ok(resumed < .8 && resumed > .78);
});
for (const [type, variant] of [[TYPES.LESSON_CHEST, 'LESSON'], [TYPES.PRACTICE_STATION, 'PRACTICE'], [TYPES.CHALLENGE, 'CHALLENGE']]) test(`real lesson data: ${variant} preparation`, () => {
  const data = lessonEntryData({ id: 'actual', type, label: 'Fallback' }, { id: 2, title: 'Subiendo la Escalera' }, ['C4', 'D4:2', 'R:1']);
  assert.equal(data.variant, variant); assert.equal(data.title, 'Subiendo la Escalera');
  assert.deepEqual(data.labels, ['C4', 'D4', 'Silencio']); assert.equal(data.canPreview, true);
});
test('Final Challenge shares preparation; secret never provides piano preview', () => {
  assert.equal(lessonEntryData(FINAL_CHALLENGE, { id: 35 }, ['C4']).variant, 'FINAL_CHALLENGE');
  const secret = lessonEntryData({ type: TYPES.SECRET_REWARD, label: 'Eco' }, null);
  assert.equal(secret.variant, 'SECRET'); assert.equal(secret.canPreview, false);
});
test('invalid, absent or complex data never fabricates an example', () => {
  for (const notes of [[], ['C4:0'], ['unknown'], ['C4:..'], ['C4', 'broken']]) assert.equal(lessonEntryData({ type: TYPES.LESSON_CHEST }, null, notes).canPreview, false);
  const data = lessonEntryData({ type: TYPES.CHALLENGE }, { title: 'Real' }, Array(12).fill('C4'));
  assert.equal(data.labels.length, 8); assert.equal(data.totalNotes, 12); assert.equal(data.more, true);
});
test('catalog titles already numbered are not numbered a second time', () => {
  const data = lessonEntryData({ type: TYPES.LESSON_CHEST }, { id: 1, title: '1. El Saludo del Elefante' }, ['C4']);
  assert.equal(data.number, null); assert.equal(data.title, '1. El Saludo del Elefante');
});
test('Practice preparation -> piano -> cancel preserves adventure and exact context', () => {
  const context = { stationId: 'plaza-first-lesson', activityId: 1, position: { x: 8, y: 0, z: 2 }, rotation: 1, camera: { currentYaw: .5 } };
  const initial = createWorldActivityState(), prepared = reduce(initial, { type: 'DISCOVER_ADVENTURE', objectId: context.stationId, context });
  assert.ok(prepared.discovery); assert.equal(prepared.mode, 'WORLD');
  assert.deepEqual(reduce(prepared, { type: 'CLOSE_DISCOVERY' }).game.adventure, initial.game.adventure);
  const transition = reduce(prepared, { type: 'REQUEST_PIANO', song: { id: 1, title: 'Real' }, context });
  const piano = reduce(transition, { type: 'TRANSITION_COMPLETE', target: 'PIANO' });
  assert.equal(piano.mode, 'PIANO');
  const returning = reduce(piano, { type: 'RETURN', result: { activityId: 1, cancelled: true, completed: false } });
  assert.deepEqual(returning.game.player.position, context.position);
  assert.deepEqual(returning.game.adventure, initial.game.adventure);
});
test('shared piano synthesis uses the existing envelope and releases owned nodes', () => {
  const calls = [], param = { setValueAtTime: (...a) => calls.push(a), exponentialRampToValueAtTime: (...a) => calls.push(a) };
  const oscillator = { frequency: { value: 0, setValueAtTime(value) { this.value = value; } }, connect() {}, start() {}, stop(t) { calls.push(['stop', t]); }, disconnect() { calls.push(['osc-disconnect']); } };
  const gain = { gain: param, connect() {}, disconnect() { calls.push(['gain-disconnect']); } };
  const context = { currentTime: 2, destination: {}, createOscillator: () => oscillator, createGain: () => gain };
  assert.equal(playPianoTone(context, 440, 'triangle', .16, .5), oscillator);
  assert.equal(oscillator.frequency.value, 440); assert.equal(oscillator.type, 'triangle');
  assert.ok(calls.some(c => c[0] === 'stop'));
  oscillator.onended(); assert.ok(calls.some(c => c[0] === 'osc-disconnect'));
});
test('corrected junction trunks and crossing rock leave a local playable corridor', () => {
  const ids = ['forest-north-02', 'forest-north-03', 'forest-north-04', 'forest-north-06', 'forest-north-07', 'forest-north-08', 'junction-west-rock'];
  const paths = JUNCTION_COMPOSITION.paths;
  for (const item of [...FOREST_COMPOSITION.instances, ...JUNCTION_COMPOSITION.instances].filter(i => ids.includes(i.id))) for (const path of paths) {
    const [x, , z] = item.position;
    const d = Math.min(...path.points.slice(1).map((b, index) => pointToSegmentDistance(x, z, path.points[index][0], path.points[index][2], b[0], b[2])));
    assert.ok(d > path.width / 2 + .6, item.id + '/' + path.id);
  }
  const tree = RIVER_COMPOSITION.instances.find(i => i.id === 'river-north-tree');
  assert.ok(Math.abs(tree.position[0] - -29) > 5);
});
