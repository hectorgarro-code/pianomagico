import { COMPOSITION_SCHEMA as schema } from './compositionSchema.js';

export function collectAssetUrls(value) {
  if (typeof value === 'string') return value.startsWith('/models/') ? [value] : [];
  if (!value || typeof value !== 'object') return [];
  return Object.values(value).flatMap(collectAssetUrls);
}

// Pure diagnostics. assetExists is supplied by a filesystem audit; the browser
// instead checks actual materialization against the successfully loaded models.
export function validateComposition(composition, { registeredAssets = [], assetExists, worldBlueprint } = {}) {
  const errors = [];
  const warnings = [];
  const error = (code, at) => errors.push({ code, at });
  const warning = (code, at) => warnings.push({ code, at });
  const vector = (value, length) => Array.isArray(value) && value.length === length && value.every(Number.isFinite);
  const positive = value => Number.isFinite(value) && value > 0;
  const text = value => typeof value === 'string' && value.trim().length > 0;
  const registry = new Set(registeredAssets);
  const serializable = (value, ancestors = new Set()) => {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
    if (typeof value === 'number') return Number.isFinite(value);
    if (typeof value !== 'object' || ancestors.has(value)) return false;
    if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype) return false;
    const next = new Set(ancestors).add(value);
    return Object.values(value).every(child => serializable(child, next));
  };
  if (!composition || typeof composition !== 'object' || Array.isArray(composition)) {
    error('COMPOSITION_REQUIRED', 'root');
    return { valid: false, errors, warnings };
  }
  if (!serializable(composition)) error('NOT_SERIALIZABLE', 'root');
  for (const field of schema.required) if (!(field in composition)) error('REQUIRED_FIELD', field);
  if (composition.schemaVersion !== schema.version) error('SCHEMA_VERSION', 'schemaVersion');
  for (const field of ['regionId', 'groupName']) if (!text(composition[field])) error('INVALID_TEXT', field);
  if (!['draft', 'approved'].includes(composition.reviewStatus)) error('REVIEW_STATUS', 'reviewStatus');
  if (!vector(composition.origin, 3)) error('INVALID_TRANSFORM', 'origin');
  if (!vector(composition.spawn?.position, 3) || !vector(composition.spawn?.rotation, 3)) error('INVALID_TRANSFORM', 'spawn');
  if (!Number.isFinite(composition.camera?.yaw) || !Number.isFinite(composition.camera?.pitch) || !positive(composition.camera?.distance)) error('INVALID_CAMERA', 'camera');
  if (composition.camera?.lookAhead !== undefined && (!Number.isFinite(composition.camera.lookAhead) || composition.camera.lookAhead < 0)) error('INVALID_CAMERA', 'camera.lookAhead');
  if (composition.camera?.portraitDistance !== undefined && !positive(composition.camera.portraitDistance)) error('INVALID_CAMERA', 'camera.portraitDistance');
  if (composition.atmosphere !== undefined) {
    const {color,near,far}=composition.atmosphere || {};
    if (!Number.isInteger(color) || color<0 || color>0xffffff || !positive(near) || !positive(far) || far<=near) error('INVALID_ATMOSPHERE','atmosphere');
  }
  if (!Number.isFinite(composition.terrain?.baseY) || !positive(composition.terrain?.flatRadius)) error('INVALID_TERRAIN', 'terrain');
  if (composition.constructionPhase !== undefined && !['5A', '5B', '5C', '5D', '5E', '5F'].includes(composition.constructionPhase)) error('INVALID_PHASE', 'constructionPhase');
  if (composition.constructionPhase || composition.terrain?.landforms) {
    const falloff = composition.terrain?.outerFalloff;
    if (falloff !== undefined && (!positive(falloff?.width) || !positive(falloff?.depth))) error('INVALID_TERRAIN', 'terrain.outerFalloff');
    if (composition.constructionPhase && (!positive(composition.terrain?.reviewExtent) || !positive(composition.terrain?.transitionWidth) || !Number.isFinite(composition.terrain?.rimHeight))) error('INVALID_TERRAIN','terrain');
    if (!Array.isArray(composition.terrain?.landforms)) error('INVALID_TERRAIN', 'terrain.landforms');
    else for (const form of composition.terrain.landforms) {
      if (!text(form.id) || !vector(form.center, 2) || !vector(form.radius, 2) || !form.radius.every(positive) || !Number.isFinite(form.height)) error('INVALID_LANDFORM', form.id);
    }
  }
  if (composition.stage !== undefined && !['macro','medium','micro'].includes(composition.stage)) error('INVALID_STAGE','stage');
  const bounds=composition.terrain?.blendBounds;
  if (bounds && (!vector(bounds.min,2)||!vector(bounds.max,2)||!bounds.min.every((v,i)=>v<bounds.max[i])||!positive(bounds.edgeWidth)||!positive(bounds.protectedRadius))) error('INVALID_TERRAIN','terrain.blendBounds');
  if (composition.terrain?.plateaus !== undefined) {
    if (!Array.isArray(composition.terrain.plateaus)) error('INVALID_TERRAIN','terrain.plateaus');
    else for(const p of composition.terrain.plateaus) if(!text(p.id)||!vector(p.center,2)||!positive(p.radius)||!positive(p.blendWidth)||!Number.isFinite(p.height)) error('INVALID_TERRAIN','terrain.plateaus');
  }
  const lists = {};
  const ids = new Map();
  for (const collection of schema.collections) {
    if (!Array.isArray(composition[collection])) error('INVALID_COLLECTION', collection);
    lists[collection] = Array.isArray(composition[collection]) ? composition[collection] : [];
    for (const [index, item] of lists[collection].entries()) {
      const at = `${collection}[${index}]`;
      if (!item || typeof item !== 'object' || !text(item.id)) { error('ID_REQUIRED', at); continue; }
      if (ids.has(item.id)) error('DUPLICATE_ID', item.id);
      else ids.set(item.id, { collection, item });
    }
  }
  for(const collection of ['reservations','vegetationMasses']) {
    lists[collection]=composition[collection]===undefined?[]:composition[collection];
    if(!Array.isArray(lists[collection])) { error('INVALID_COLLECTION',collection);lists[collection]=[]; }
    for(const item of lists[collection]) {
      if(!item||!text(item.id)||!text(item.purpose)) {error('INVALID_SEMANTIC_ZONE',collection);continue;}
      if(ids.has(item.id)) error('DUPLICATE_ID',item.id);
      else ids.set(item.id,{collection,item});
    }
  }
  const reference = (id, at, collection) => {
    if (!text(id) || !ids.has(id)) error('MISSING_REFERENCE', at);
    else if (collection && ids.get(id).collection !== collection) error('REFERENCE_TYPE', at);
  };
  const region = worldBlueprint?.regions?.find(item => item.id === composition.regionId);
  if (worldBlueprint && !region) error('UNKNOWN_REGION', 'regionId');
  const permitted = new Set(collectAssetUrls(region?.permittedAssets));
  for (const item of lists.instances) {
    if (!item || typeof item !== 'object') continue;
    const at = item.id || 'instances';
    if (!vector(item.position, 3) || !vector(item.rotation, 3)) error('INVALID_TRANSFORM', at);
    if (!vector(item.scale, 3) || !item.scale.every(positive)) error('INVALID_SCALE', at);
    if (!schema.grounding.includes(item.grounding)) error('INVALID_GROUNDING', at);
    if(item.collision!==undefined) {
      const c=item.collision;
      if(!c||typeof c!=='object'||!['none','solid'].includes(c.type))error('INVALID_COLLISION',at);
      else if(c.type==='solid') {
        if(!['circle','box'].includes(c.shape)||!['base','bounds'].includes(c.source))error('INVALID_COLLISION',at);
        if(c.center!==undefined&&!vector(c.center,2))error('INVALID_COLLISION',at);
        if(c.radius!==undefined&&(c.shape!=='circle'||!positive(c.radius)))error('INVALID_COLLISION',at);
        if(c.size!==undefined&&(c.shape!=='box'||!vector(c.size,2)||!c.size.every(positive)))error('INVALID_COLLISION',at);
        if(vector(item.rotation,3)&&(Math.abs(item.rotation[0])>1e-7||Math.abs(item.rotation[2])>1e-7))error('COLLISION_REQUIRES_UPRIGHT_INSTANCE',at);
      }
    }
    if (!schema.roles.includes(item.role)) error('INVALID_ROLE', at);
    if (item.kind !== undefined && !schema.kinds.includes(item.kind)) error('INVALID_KIND', at);
    for (const field of ['castShadow', 'receiveShadow']) if (item[field] !== undefined && typeof item[field] !== 'boolean') error('INVALID_SHADOW', `${at}.${field}`);
    if (!text(item.assetUrl) || !registry.has(item.assetUrl)) error('ASSET_UNREGISTERED', `${at}: ${item.assetUrl}`);
    if (text(item.assetUrl) && assetExists && !assetExists(item.assetUrl)) error('ASSET_MISSING', `${at}: ${item.assetUrl}`);
    if (region && text(item.assetUrl) && !permitted.has(item.assetUrl)) warning('ASSET_OUTSIDE_REGION_LIST', item.assetUrl);
  }
  for (const item of lists.landmarks) {
    if (!item || typeof item !== 'object') continue;
    if (!Array.isArray(item.memberIds) || !item.memberIds.length) error('LANDMARK_MEMBERS_REQUIRED', item.id);
    else {
      if (new Set(item.memberIds).size !== item.memberIds.length) error('DUPLICATE_MEMBER', item.id);
      for (const id of item.memberIds) reference(id, `${item.id}.memberIds:${id}`, 'instances');
    }
  }
  for (const item of lists.paths) {
    if (!item || typeof item !== 'object') continue;
    if (!Array.isArray(item.points) || item.points.length < 2 || !item.points.every(point => vector(point, 3))) error('INVALID_PATH', item.id);
    if (!positive(item.width) || !Number.isFinite(item.freeMarginEachSide) || item.freeMarginEachSide < 0) error('INVALID_PATH_WIDTH', item.id);
    if (!Number.isInteger(item.color) || item.color < 0 || item.color > 0xffffff) error('INVALID_PATH_COLOR', item.id);
    if (!['provisional-ribbon', 'terrain-blend'].includes(item.visualImplementation)) error('UNSUPPORTED_PATH_IMPLEMENTATION', item.id);
    if (item.visualImplementation === 'provisional-ribbon') warning('PROVISIONAL_PATH_ART', item.id);
    if (item.visualImplementation === 'terrain-blend' && !positive(item.edgeBlend)) error('INVALID_PATH_BLEND', item.id);
    if (item.endFade !== undefined && !positive(item.endFade)) error('INVALID_PATH_BLEND', item.id);
    if (item.startFade !== undefined && !positive(item.startFade)) error('INVALID_PATH_BLEND', item.id);
  }
  for (const collection of ['boundaries', 'openZones', 'clearZones','reservations']) {
    for (const item of lists[collection]) {
      if (!item || typeof item !== 'object') continue;
      if (!schema.zoneShapes.includes(item.shape)) error('INVALID_ZONE_SHAPE', item.id);
      if (item.shape === 'circle' && (!vector(item.center, 2) || !positive(item.radius))) error('INVALID_ZONE', item.id);
      if (item.shape === 'polygon') {
        const points = item.points;
        if (!Array.isArray(points) || points.length < 3 || !points.every(point => vector(point, 2))) error('INVALID_ZONE', item.id);
        else {
          const area = points.reduce((sum, p, i) => { const q = points[(i + 1) % points.length]; return sum + p[0] * q[1] - q[0] * p[1]; }, 0);
          if (Math.abs(area) < 1e-8) error('INVALID_ZONE', item.id);
        }
      }
      if (['openZones','clearZones'].includes(collection) && (!Array.isArray(item.excludes) || !item.excludes.length || !item.excludes.every(text))) error('ZONE_EXCLUSIONS_REQUIRED', item.id);
      if (collection === 'boundaries' && item.purpose !== 'authoring') error('INVALID_BOUNDARY_PURPOSE', item.id);
      if (collection === 'reservations' && item.instanceId !== undefined) reference(item.instanceId, `${item.id}.instanceId`, 'instances');
    }
  }
  for(const mass of lists.vegetationMasses) {
    if(!mass||typeof mass!=='object') continue;
    if(!Array.isArray(mass.memberIds)||!mass.memberIds.length) error('LANDMARK_MEMBERS_REQUIRED',mass.id);
    else { if(new Set(mass.memberIds).size!==mass.memberIds.length) error('DUPLICATE_MEMBER',mass.id); for(const id of mass.memberIds) reference(id,mass.id,'instances'); }
  }
  for (const collection of ['entries', 'exits', 'pointsOfInterest']) for (const item of lists[collection]) {
    if (!item || typeof item !== 'object') continue;
    if (!vector(item.position, 3)) error('INVALID_TRANSFORM', item.id);
    if (item.rotation !== undefined && !vector(item.rotation, 3)) error('INVALID_TRANSFORM', item.id);
  }
  for (const item of lists.stations) {
    if (!item || typeof item !== 'object') continue;
    reference(item.instanceId, `${item.id}.instanceId`, 'instances');
    if (!positive(item.interactionRadius) || !text(item.lessonRef)) error('INVALID_STATION', item.id);
  }
  for (const item of lists.sightlines) {
    if (!item || typeof item !== 'object') continue;
    reference(item.fromId, `${item.id}.fromId`);
    reference(item.toId, `${item.id}.toId`);
    if (!positive(item.clearanceWidth) || !positive(item.clearanceHeight)) error('INVALID_SIGHTLINE', item.id);
  }
  for (const url of permitted) {
    if (!registry.has(url)) warning('BLUEPRINT_ASSET_UNREGISTERED', url);
    if (assetExists && !assetExists(url)) warning('BLUEPRINT_ASSET_MISSING', url);
  }
  return { valid: errors.length === 0, errors, warnings: warnings.filter((item, i, all) => all.findIndex(other => other.code === item.code && other.at === item.at) === i) };
}
