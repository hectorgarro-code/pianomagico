import test from 'node:test';
import assert from 'node:assert/strict';
import { creatureStep, moveWithBodies, ENCOUNTER } from './creatureEncounter.js';
import { CollisionWorld } from '../world/collision/CollisionWorld.js';
import * as THREE from 'three';
import { createCharacterAnimator } from '../presentation/characterActions.js';

const creature = () => ({ position: { x: 0, y: 0, z: 0 }, home: { x: 0, z: 0 }, reaction: 0, phase: 0, behaviorType: 'wander' });
test('creatures chase nearby players, return home at the leash and do not attack immediately', () => {
  const target = creature();
  assert.equal(creatureStep(target, { x: 0, z: 5 }, .1).state, 'CHASE');
  target.position.x = 11;
  assert.equal(creatureStep(target, { x: 11, z: 1 }, .1).state, 'RETURN');
  target.position.x = 5;
  assert.equal(creatureStep(target, { x: 5, z: 1 }, .1).state, 'RETURN');
  target.position.x = 0;
  const start = creatureStep(target, { x: 0, y: 0, z: 1 }, .1);
  assert.equal(start.started, true); assert.equal(start.hit, undefined);
});
test('strikes land once after windup and give time to escape; facing is not homing', () => {
  const target = creature(), player = { x: 0, y: 0, z: 1 };
  creatureStep(target, player, .1);
  assert.equal(creatureStep(target, player, .3).hit, false);
  assert.equal(creatureStep(target, player, .3).hit, true);
  assert.equal(creatureStep(target, player, .3).hit, false);
  assert.equal(creatureStep(target, player, ENCOUNTER.recovery).hit, false);
  creatureStep(target, player, .1);
  assert.equal(creatureStep(target, { ...player, z: -1 }, .6).hit, false);
});
test('moving away or jumping evades an attack; hits interrupt enemy windup', () => {
  for (const player of [{ x: 0, z: 4, y: 0 }, { x: 0, z: 1, y: 2 }]) {
    const target = creature(); creatureStep(target, { x: 0, z: 1 }, .1);
    assert.equal(creatureStep(target, player, .6).hit, false);
  }
  const target = creature(); creatureStep(target, { x: 0, z: 1 }, .1); target.reaction = .5;
  assert.equal(creatureStep(target, { x: 0, z: 1 }, .6).state, 'HIT_REACTION');
  assert.equal(target.strike, null);
});
test('static creatures do not gain hostile behavior', () => {
  const target = creature(); target.behaviorType = 'stationary';
  assert.equal(creatureStep(target, { x: 0, z: 1 }, .1).state, 'IDLE');
});
test('player cannot pass through creatures even at high speed; dynamic bodies leave static hash alone', () => {
  const world = new CollisionWorld(), bodies = [{ x: 0, z: 1.5, radius: .45 }];
  const next = moveWithBodies({ x: 0, z: 0 }, { x: 0, z: 6 }, world, bodies);
  assert.ok(next.z < .72); assert.equal(world.colliders.length, 0);
  const beside = moveWithBodies(next, { x: 2, z: 1 }, world, bodies);
  assert.ok(beside.x > 1.5);
});
test('enemy movement and knockback cannot push bodies through static walls', () => {
  const world = new CollisionWorld([{ id: 'wall', type: 'solid', shape: 'box', x: 0, z: -1, halfWidth: 4, halfDepth: .2, yaw: 0 }]);
  const next = moveWithBodies({ x: 0, z: 0 }, { x: 0, z: -4 }, world, [{ x: 1, z: 0, radius: .45 }]);
  assert.ok(next.z > -.5); assert.equal(world.overlaps(next), false);
});

test('player hit interrupts the current action and resumes normal movement after recovery', () => {
  const root = new THREE.Group(), mixer = new THREE.AnimationMixer(root);
  const clips = ['Idle', 'Hit_A', 'Walking_A', 'Spellcast_Raise'].map(name => new THREE.AnimationClip(name, .4, []));
  const animator = createCharacterAnimator(mixer, clips, 2);
  animator.express('Q'); animator.react(); assert.equal(animator.name, 'Hit_A');
  assert.equal(animator.locked, true); assert.equal(animator.express('Q'), false);
  mixer.update(.6); animator.locomotion('Walking_A'); assert.equal(animator.name, 'Walking_A');
  animator.dispose();
});
