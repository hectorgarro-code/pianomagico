import test from 'node:test';
import assert from 'node:assert/strict';
import { BACKEND_RUNTIME, deploymentFiles, verifyLessons } from './deploymentPlan.mjs';

test('deployment excludes configuration, provisioning and model auxiliaries', () => {
  assert.ok(!BACKEND_RUNTIME.some(file => /dbconfig|migrate|create-admin|audit|test|\.sql/.test(file)));
  assert.deepEqual(deploymentFiles(['public/models/pet.glb', ''], ['dist/models/pet.fbx', 'dist/index.html', 'dist/.htaccess', 'dist/assets/game.js']), [
    { local: 'public/models/pet.glb', remote: '/models/pet.glb' },
    { local: 'dist/assets/game.js', remote: '/assets/game.js' },
  ]);
  for (const file of ['public/models/pet.fbx', 'public/models/Samples/pet.png', 'public/models/../dbconfig.php']) assert.throws(() => deploymentFiles([file], []));
  assert.throws(() => deploymentFiles([], ['dist/backend/dbconfig.php']));
});

test('deployment blocks missing lessons and incompatible schemas without changing catalogs', () => {
  const lessons = [{ id: 7 }];
  const document = { schemaVersion: 1, activities: [{ id: 'chest', lessonId: 7 }, { lessonId: null }] };
  const original = structuredClone(document);
  verifyLessons([document], lessons);
  assert.deepEqual(document, original);
  assert.throws(() => verifyLessons([document], []));
  assert.throws(() => verifyLessons([{ ...document, schemaVersion: 2 }], lessons));
  assert.throws(() => verifyLessons([document], [{ id: 12 }]));
});
