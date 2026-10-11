import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import process from 'node:process';
import { Group, Mesh, AnimationMixer, AnimationClip } from 'three';
import { EQUIPMENT, getEquipment, applyEquipment, readEquipment, saveEquipment } from './characterEquipment.js';
import { getCharacterModel } from '../../modules/core/utils/characterModels.js';
import { createCharacterAnimator } from './characterActions.js';
import { progressService } from '../services/progressService.js';

function glb(path) {
  const bytes = fs.readFileSync(path);
  return JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
}
for (const [id, options] of Object.entries(EQUIPMENT)) test(`character ${id}: equipment uses real meshes and available actions`, () => {
  const doc = glb(`public${getCharacterModel(Number(id)).file}`);
  const nodes = doc.nodes.map(node => node.name);
  const clips = Number(id) === 5 ? ['Idle', ...glb('public/models/characters/Animations/gltf/Rig_Medium/Rig_Medium_General.glb').animations.map(clip => clip.name), ...glb('public/models/characters/Animations/gltf/Rig_Medium/Rig_Medium_MovementBasic.glb').animations.map(clip => clip.name)] : doc.animations.map(clip => clip.name);
  for (const option of options) {
    for (const node of option.nodes) assert.ok(nodes.includes(node), node);
    for (const action of [option.Q, option.E]) assert.ok(clips.includes(action), action);
    if (option.accessory) {
      assert.ok(nodes.includes(option.hand));
      const path = `public/models/characters/Assets/gltf/${option.accessory}.gltf`;
      const asset = JSON.parse(fs.readFileSync(path));
      for (const resource of [...asset.buffers, ...asset.images]) assert.ok(fs.existsSync(new URL(resource.uri, new URL(path, `file://${process.cwd().replaceAll('\\', '/')}/`))));
    }
  }
});
test('equipment hides alternatives only on the character clone', async () => {
  const model = new Group();
  for (const name of ['1H_Sword', '2H_Sword', 'Badge_Shield', 'Knight_Body']) { const node = new Mesh(); node.name = name; model.add(node); }
  await applyEquipment(model, 1, 'greatsword');
  assert.equal(model.getObjectByName('1H_Sword').visible, false);
  assert.equal(model.getObjectByName('Badge_Shield').visible, false);
  assert.equal(model.getObjectByName('2H_Sword').visible, true);
  assert.equal(model.getObjectByName('Knight_Body').visible, true);
});
test('cosmetic persistence is scoped by profile and character and rejects unknown choices', () => {
  const values = new Map(), storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  saveEquipment(7, 1, 'greatsword', storage);
  assert.equal(readEquipment(7, 1, storage), 'greatsword');
  assert.equal(readEquipment(8, 1, storage), 'sword-shield');
  assert.equal(readEquipment(7, 2, storage), 'staff-book');
  assert.equal(getEquipment(1, 'invented').id, 'sword-shield');
  assert.equal(readEquipment(7, 1, { getItem() { throw new Error(); } }), 'sword-shield');
});
test('equipment action switches return to Idle without displacement', () => {
  const root = new Group(), option = getEquipment(1, 'greatsword');
  const mixer = new AnimationMixer(root);
  const animator = createCharacterAnimator(mixer, ['Idle', option.Q, option.E].map(name => new AnimationClip(name, .2, [])), 1, option);
  animator.express('Q'); assert.equal(animator.name, option.Q); mixer.update(.4);
  assert.equal(animator.name, 'Idle'); assert.deepEqual(root.position.toArray(), [0, 0, 0]); animator.dispose();
});
test('Ranger selects its own model instead of the legacy modulo fallback', () => {
  assert.equal(getCharacterModel(5).id, 5);
  assert.equal(getCharacterModel(1).id, 1);
  assert.equal(getCharacterModel(9).id, 1);
});
test('Ranger saves through the existing avatar-only endpoint, without educational fields', async () => {
  const previousFetch = globalThis.fetch, previousStorage = globalThis.localStorage;
  let sent, saved;
  globalThis.localStorage = { getItem: () => saved, setItem: (_key, value) => { saved = String(value); } };
  globalThis.fetch = async (_url, options) => {
    if (options) sent = JSON.parse(options.body);
    return { ok: true, json: async () => options ? { message: 'Profile updated' } : { user_id: 7, name: 'QA', avatar_id: 5, total_score: 200 } };
  };
  try {
    const profile = await progressService.selectCharacter(7, 5);
    assert.equal(profile.avatarId, 5); assert.equal(profile.total_score, 200);
    assert.deepEqual(sent, { userId: 7, avatarId: 5, avatarOnly: true });
    await assert.rejects(() => progressService.selectCharacter(7, 6));
  } finally { globalThis.fetch = previousFetch; globalThis.localStorage = previousStorage; }
});
