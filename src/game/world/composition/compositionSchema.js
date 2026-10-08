/** Serializable authoring contract: metres, +Y up, north -Z, XYZ Euler radians.
 * Scale has three positive components. Terrain grounding adds position Y to
 * sampled ground height; absolute grounding uses position Y directly.
 * Optional instance collision defaults to {type:'none'}. Solid shapes are
 * circle or box; source base samples the lowest native mesh band (tree trunks),
 * bounds uses the full native bounds. Optional local center [x,z], radius or
 * size [width,depth] overrides allow reusable authored shapes. Upright Y rotation
 * and nonuniform scale are supported. Interaction radius stays on stations.
 * Landmarks reference instances without duplicating them. Boundaries and
 * sightlines are diagnostics, not automatic collision or placement systems.
 * Optional constructionPhase gates the Plaza-only review. Its authored terrain
 * uses flatRadius, transitionWidth and rimHeight, plus landforms with explicit
 * center [x,z], positive radius [x,z] and signed height.
 * Optional outerFalloff {width,depth} lowers the technical support beyond
 * reviewExtent; both values are positive. It is not a collision boundary.
 * A terrain-blend path colors the terrain using its positive edgeBlend in metres.
 * Optional positive endFade blends its final metres into grass. Optional atmosphere
 * defines a 24-bit color and positive near/far distances (far > near) for linear fog.
 * Optional reservations are semantic zones, never materialized assets. Optional
 * instanceId identifies the explicitly authorized occupant, not an automatic placement.
 * vegetationMasses group instance references with an authored purpose.
 * Terrain blendBounds blends a neighboring height field outside a protected radius.
 * Plateaus define soft clearings; startFade optionally blends path entry metres.
 * Camera lookAhead is a nonnegative orbit-relative distance; portraitDistance
 * is an optional positive distance for vertical viewports. Station lessonRef
 * first-song binds the original first lesson; other strings are exact song IDs.
 * Optional gates [{id,gateId,exitId?,instanceId?}] bind authored exits/props to
 * logical WORLD_GATES. validateWorldGateBindings checks this contract; rendering
 * does not create geometry or invisible walls for an unavailable gate.
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
