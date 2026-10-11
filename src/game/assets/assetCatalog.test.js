import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { ASSET_CATALOG, ASSET_CATEGORIES, getCatalogAssets } from './assetCatalog.js';
import audit from './localAssetPacks.json' with { type: 'json' };

test('catalog exposes eight categories, keeps players separate and does not declare destructibles', () => {
  assert.deepEqual(ASSET_CATEGORIES, ['CHARACTER_PLAYER', 'PET', 'WORLD_CREATURE', 'PROP', 'DESTRUCTIBLE', 'ARCHITECTURE', 'VEGETATION', 'DECORATION']);
  assert.equal(getCatalogAssets('CHARACTER_PLAYER').length, 5);
  assert.equal(getCatalogAssets('PET').length, 24);
  assert.equal(getCatalogAssets('WORLD_CREATURE').length, 4);
  assert.equal(getCatalogAssets('DESTRUCTIBLE').length, 0);
  assert.equal(new Set(ASSET_CATALOG.assets.map(asset => asset.id)).size, ASSET_CATALOG.assets.length);
  assert.equal(new Set(ASSET_CATALOG.assets.map(asset => asset.url)).size, ASSET_CATALOG.assets.length);
});
test('all audited runtime models, textures, BIN, previews and licenses exist locally', () => {
  for (const asset of [...audit.assets, ...audit.animationLibraries, audit.legacyWarrior]) {
    const bytes = fs.readFileSync(`public${asset.url}`);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), asset.sha256, asset.name);
    for (const dependency of asset.dependencies) assert.ok(fs.existsSync(`public${dependency.url}`), dependency.url);
    if (asset.previewUrl) assert.ok(fs.existsSync(`public${asset.previewUrl}`));
    assert.ok(fs.existsSync(`public${asset.license.file}`));
    assert.ok(asset.bounds.size.every(value => value > 0));
  }
});
test('pet clips are exact, node-animated and readiness metadata never awards or follows', () => {
  for (const pet of getCatalogAssets('PET')) {
    assert.deepEqual(pet.animations.map(clip => clip.name), ['static', 'idle', 'walk', 'run', 'eat', 'dance', 'gesture-positive', 'gesture-negative']);
    assert.equal(pet.animationKind, 'NODE_TRANSFORMS'); assert.equal(pet.rigs.length, 0);
    assert.equal(pet.futurePet.companion.implemented, false);
    assert.equal(pet.futurePet.collectionKey, pet.id);
    assert.equal(pet.enabledInWorld, false); assert.equal(pet.placement, null);
    assert.ok(pet.dependencies.some(dependency => dependency.uri === 'Textures/colormap.png'));
  }
});
test('creatures retain external clips and optional unconfigured future actions without combat', () => {
  for (const creature of getCatalogAssets('WORLD_CREATURE')) {
    assert.equal(creature.animations.length, 0); assert.equal(creature.rigs[0].jointCount, 23);
    assert.equal(creature.animationSources.length, 2);
    for (const source of creature.animationSources) assert.deepEqual(source.missingTargetNodes, []);
    assert.deepEqual(creature.futureWorldAction.permittedHitRange, [1, 3]);
    for (const field of ['behavior', 'hitsRequired', 'defeatEffect', 'optionalReward', 'attackable']) assert.equal(creature.futureWorldAction[field], null);
    assert.equal(creature.futureWorldAction.implemented, false);
    assert.equal(creature.placement, null); assert.equal(creature.enabledInWorld, false);
  }
});
test('old Warrior remains a distinct animated variant, not a fifth creature or replacement', () => {
  const warrior = getCatalogAssets('WORLD_CREATURE').find(asset => asset.name === 'Skeleton_Warrior');
  assert.equal(warrior.variants.length, 1);
  const old = warrior.variants[0];
  assert.equal(old.url, '/models/characters/Skeleton_Warrior.glb');
  assert.equal(old.animations.length, 95); assert.equal(old.rigs[0].jointCount, 41);
  assert.equal(old.relation.byteIdentical, false); assert.equal(old.relation.sameEmbeddedTexture, true);
});
