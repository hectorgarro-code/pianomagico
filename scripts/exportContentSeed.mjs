import fs from 'node:fs/promises';
import { createDefaultContent, CONTENT_COMPOSITIONS } from '../src/game/content/contentDefaults.js';
import { ASSET_CATALOG } from '../src/game/assets/assetCatalog.js';
const data = createDefaultContent();
await fs.mkdir('backend/content', { recursive: true });
await fs.writeFile('backend/content/seed.json', JSON.stringify(data, null, 2) + '\n');
const refs = CONTENT_COMPOSITIONS.map(c => ({ id: c.groupName, regionId: c.regionId,
  protectedIds: [...new Set([...(c.adventureObjects || []).map(o => o.instanceId), ...c.stations.map(s => s.instanceId),
    ...c.landmarks.flatMap(l => l.memberIds || []), ...(c.vegetationMasses || []).flatMap(m => m.memberIds || []),
    ...(c.reservations || []).map(r => r.instanceId).filter(Boolean),
    ...(c.gates || []).map(g => g.instanceId).filter(Boolean)])] }));
await fs.writeFile('backend/content/registry.json', JSON.stringify({ compositions: refs,
  assets: ASSET_CATALOG.assets.map(a => ({ id: a.id, url: a.url, category: a.category, animations: a.animations || [] })),
  animationNames: [...new Set(ASSET_CATALOG.animationLibraries.flatMap(l => l.animations.map(a => a.name)))],
  activities: data.activities }, null, 2) + '\n');
await fs.writeFile('src/game/content/assetReferences.json', JSON.stringify(ASSET_CATALOG.assets.map(a => a.url), null, 2) + '\n');
console.log(`Seed: ${data.world.length} compositions; ${data.activities.length} activities; ${ASSET_CATALOG.assets.length} assets`);
