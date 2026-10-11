// Local Kenney CC0 originals. Only this registry owns cartography URLs.
const root = '/models/kenney_cartography-pack/';
const icon = name => root + 'PNG/Retina/' + name + '.png';
export const CARTOGRAPHY_ASSETS = Object.freeze({
  parchment: root + 'Textures/parchmentBasic.png',
  tree: icon('treeTall'), pines: icon('treePines'), mountain: icon('rocksMountain'),
  rocks: icon('rocks'), bridge: icon('bridge'), ruins: icon('ruins'),
  architecture: icon('gate'), colonnade: icon('castleWideLow'),
  chest: icon('chest'), compass: icon('compass'), water: icon('textureWater'),
});
export function cartographyAsset(key) { return CARTOGRAPHY_ASSETS[key] || null; }

export function cartographicPathKind(path) {
  if (path.regionId === 'GRUTA_DEL_ECO') return 'secret';
  return /detour|voice/.test(path.id) ? 'secondary' : 'main';
}

// Framing only: worldToMap and every world coordinate remain unchanged.
export function cartographyFrame(model, marker, enlarged) {
  if (!enlarged) return { x: marker.x - 65, y: marker.y - 85, width: 130, height: 170 };
  const points = model.mapPoints || [];
  const all = [...points, marker];
  const xs = all.map(p => p.x), ys = all.map(p => p.y);
  const width = Math.max(260, Math.max(...xs) - Math.min(...xs) + 130);
  const height = Math.max(240, Math.max(...ys) - Math.min(...ys) + 90);
  return { x: (Math.min(...xs) + Math.max(...xs)) / 2 - width / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2 - height / 2, width, height };
}
