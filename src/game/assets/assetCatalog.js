import audited from './localAssetPacks.json' with { type: 'json' };
import kaykit from './kaykitCatalog.json' with { type: 'json' };
import { CHARACTER_MODELS } from '../../modules/core/utils/characterModels.js';

export const ASSET_CATEGORIES = Object.freeze(['CHARACTER_PLAYER', 'PET', 'WORLD_CREATURE', 'PROP', 'DESTRUCTIBLE', 'ARCHITECTURE', 'VEGETATION', 'DECORATION']);
const groups = { ARCHITECTURE: ['walls', 'floors', 'columns', 'stairs'], VEGETATION: ['trees', 'bushes', 'grass', 'trunks'], DECORATION: ['rocks', 'banners'], PROP: ['containers', 'dungeonProps', 'furniture', 'accessories'] };
const existing = Object.entries(groups).flatMap(([category, keys]) => keys.flatMap(key => (kaykit[key] || []).map(url => ({ id: `existing:${url}`, name: url.split('/').pop().replace(/\.(glb|gltf)$/i, ''), category, url, packId: 'existing-kaykit', metadataStatus: 'EXISTING_NOT_REAUDITED' }))));
const players = [1, 2, 3, 4, 5].map(id => ({ id: `player:${id}`, name: CHARACTER_MODELS[id].file.split('/').pop().replace('.glb', ''), category: 'CHARACTER_PLAYER', url: CHARACTER_MODELS[id].file, packId: 'existing-kaykit', metadataStatus: 'EXISTING_NOT_REAUDITED' }));
const newAssets = audited.assets.map(asset => asset.id === audited.legacyWarrior.relation.packAssetId ? { ...asset, variants: [audited.legacyWarrior] } : asset);
const runtimeAssets = ['chest_wood', 'chest_gold', 'gate'].map(name => ({ id: `runtime:${name}`, name,
  url: `/models/props/${name}.glb`, category: name === 'gate' ? 'ARCHITECTURE' : 'PROP',
  packId: 'existing-kaykit', metadataStatus: 'EXISTING_NOT_REAUDITED' }));
// Catalog records describe availability only. No placement or behavior is instantiated.
export const ASSET_CATALOG = Object.freeze({ schemaVersion: 1, categories: ASSET_CATEGORIES, packs: audited.packs, animationLibraries: audited.animationLibraries, assets: [...new Map([...existing, ...players, ...newAssets, ...runtimeAssets].map(asset => [asset.url, asset])).values()] });
export const getCatalogAssets = category => ASSET_CATALOG.assets.filter(asset => asset.category === category);
export function setImportedAssets(records){
  const imported=records.filter(a=>/^imported:[a-f0-9]{64}$/.test(a.id)&&a.url===`/models/imported/${a.id.slice(9)}.glb`&&['PROP','DESTRUCTIBLE','ARCHITECTURE','VEGETATION','DECORATION'].includes(a.category));
  for(let i=ASSET_CATALOG.assets.length-1;i>=0;i--)if(ASSET_CATALOG.assets[i].id.startsWith('imported:'))ASSET_CATALOG.assets.splice(i,1);
  ASSET_CATALOG.assets.push(...imported);
}
