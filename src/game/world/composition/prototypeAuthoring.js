export const asset = name => `/models/props/Assets/gltf/${name}.gltf`;
export function instance(id, name, x, z, scale = 1, kind = 'rocks', yaw = 0) {
  return { id, assetUrl: asset(name), role: kind === 'trees' ? 'mainTree' : 'importantProp', kind,
    position: [x, .02, z], rotation: [0, yaw, 0], scale: [scale, scale, scale], grounding: 'terrain',
    castShadow: kind !== 'bushes', receiveShadow: true,
    collision: kind === 'bushes' ? { type: 'none' } : { type: 'solid', shape: kind === 'trees' ? 'circle' : 'box', source: kind === 'trees' ? 'base' : 'bounds' } };
}
export function path(id, points, width = 3) {
  return { id, points: points.map(p => [p[0], 0, p[1]]), width, freeMarginEachSide: 2.2,
    color: 0x706957, visualImplementation: 'terrain-blend', edgeBlend: 1.2 };
}
export function composition(regionId, groupName, paths, instances) {
  return { schemaVersion: 1, regionId, groupName, reviewStatus: 'draft', origin: [0, 0, 0],
    spawn: { position: [paths[0].points[0][0], 0, paths[0].points[0][2]], rotation: [0, Math.PI, 0] },
    camera: { yaw: 0, pitch: .26, distance: 18 }, terrain: { baseY: 0, flatRadius: 5 },
    paths, instances, landmarks: [], entries: [], exits: [], boundaries: [], openZones: [], clearZones: [],
    stations: [], pointsOfInterest: [], sightlines: [], gates: [] };
}
