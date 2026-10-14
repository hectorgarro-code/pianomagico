import assert from 'node:assert/strict';

export const BACKEND_RUNTIME = [
  'backend/content/lessons.php', 'backend/content/security.php', 'backend/content/editor.php', 'backend/content/preflight.php',
  'backend/content/events.php', 'backend/content/validation.php', 'backend/content/schema.php',
  'backend/content/registry.json', 'backend/content/seed.json',
  'backend/content.php', 'backend/api.php',
];

export function deploymentFiles(trackedModels, builtFiles) {
  const models = trackedModels.filter(Boolean);
  for (const file of models) {
    assert.match(file, /^public\/models\//);
    assert.ok(!file.split('/').some(part => part === '..'));
    assert.ok(/\.(glb|gltf|bin|png|jpg|jpeg|webp|txt|md)$/i.test(file), `Non-runtime model resource: ${file}`);
    assert.ok(!/(^|\/)(samples?|screenshots?)(\/|$)/i.test(file), `Auxiliary resource: ${file}`);
  }
  const files = builtFiles.filter(file => !file.startsWith('dist/models/') && !['dist/index.html', 'dist/.htaccess'].includes(file));
  for (const file of files) {
    assert.ok(/^dist\/(assets|audio|wasm)\//.test(file) || /^dist\/images\/entry\/[a-z0-9-]+\.webp$/.test(file) || file === 'dist/vite.svg', `Unexpected build resource: ${file}`);
    assert.ok(!file.split('/').some(part => part === '..'));
  }
  return [...models, ...files].map(local => ({ local, remote: '/' + local.replace(/^(public|dist)\//, '') }));
}

export function verifyLessons(documents, lessons) {
  assert.ok(Array.isArray(lessons) && lessons.length > 0, 'Production lesson catalog unavailable');
  const ids = new Set(lessons.map(lesson => Number(lesson.id)));
  for (const document of documents) {
    assert.equal(document.schemaVersion, 1, 'Schema migration requires manual approval');
    assert.ok(Array.isArray(document.activities));
    for (const activity of document.activities) {
      if (activity.lessonId != null) assert.ok(ids.has(Number(activity.lessonId)), `Missing production lesson for ${activity.id}; migrate separately before deploy`);
    }
  }
}
