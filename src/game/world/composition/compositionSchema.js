/** Serializable authoring contract: metres, +Y up, north -Z, XYZ Euler radians.
 * Scale has three positive components. Terrain grounding adds position Y to
 * sampled ground height; absolute grounding uses position Y directly.
 * Landmarks reference instances without duplicating them. Boundaries and
 * sightlines are diagnostics, not automatic collision or placement systems.
 */
export const COMPOSITION_SCHEMA = {
  version: 1,
  required: ['schemaVersion', 'regionId', 'reviewStatus', 'origin', 'groupName', 'spawn', 'camera', 'terrain', 'paths', 'instances', 'landmarks', 'entries', 'exits', 'boundaries', 'openZones', 'clearZones', 'stations', 'pointsOfInterest', 'sightlines'],
  collections: ['instances', 'landmarks', 'paths', 'entries', 'exits', 'boundaries', 'openZones', 'clearZones', 'stations', 'pointsOfInterest', 'sightlines'],
  roles: ['floor', 'architecture', 'mainTree', 'importantProp', 'decoration'],
  kinds: ['props', 'trees', 'rocks', 'bushes'],
  grounding: ['absolute', 'terrain'],
  zoneShapes: ['circle', 'polygon'],
};
