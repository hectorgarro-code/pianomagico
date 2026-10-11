import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Box3, Matrix4, Vector3, Quaternion } from 'three';

const root = fileURLToPath(new URL('../', import.meta.url));
const publicRoot = path.join(root, 'public');
const petRoot = 'models/characters/kenney_cube-pets_1.0';
const creatureRoot = 'models/characters/KayKit_Skeletons_1.1_FREE/KayKit_Skeletons_1.1_FREE';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const round = value => Math.round(value * 1e6) / 1e6;
const vector = v => v.toArray().map(round);
const url = file => '/' + path.relative(publicRoot, file).replaceAll('\\', '/');
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(item => item.isDirectory() ? walk(path.join(directory, item.name)) : [path.join(directory, item.name)]).sort();
}
function readModel(file) {
  const bytes = fs.readFileSync(file);
  if (path.extname(file).toLowerCase() === '.gltf') return { doc: JSON.parse(bytes), bytes, bin: null };
  if (bytes.readUInt32LE(0) !== 0x46546c67 || bytes.readUInt32LE(4) !== 2) throw new Error(`Invalid GLB: ${file}`);
  let doc, bin;
  for (let offset = 12; offset < bytes.length;) {
    const length = bytes.readUInt32LE(offset), type = bytes.readUInt32LE(offset + 4);
    const chunk = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === 0x4e4f534a) doc = JSON.parse(chunk.toString());
    if (type === 0x004e4942) bin = chunk;
    offset += length + 8;
  }
  return { doc, bytes, bin };
}
function auditModel(file, category, packId) {
  const { doc, bytes, bin } = readModel(file);
  const dependencies = [...(doc.buffers || []), ...(doc.images || [])].filter(resource => resource.uri && !resource.uri.startsWith('data:')).map(resource => {
    const resolved = path.resolve(path.dirname(file), decodeURIComponent(resource.uri));
    if (!resolved.startsWith(publicRoot + path.sep)) throw new Error(`Dependency outside public: ${resource.uri}`);
    return { uri: resource.uri, url: url(resolved), exists: fs.existsSync(resolved) };
  });
  const box = new Box3(), sceneNodes = doc.scenes?.[doc.scene || 0]?.nodes || [];
  function visit(index, parentMatrix) {
    const node = doc.nodes[index];
    const local = node.matrix ? new Matrix4().fromArray(node.matrix) : new Matrix4().compose(new Vector3().fromArray(node.translation || [0, 0, 0]), new Quaternion().fromArray(node.rotation || [0, 0, 0, 1]), new Vector3().fromArray(node.scale || [1, 1, 1]));
    const matrix = parentMatrix.clone().multiply(local);
    for (const primitive of doc.meshes?.[node.mesh]?.primitives || []) {
      const accessor = doc.accessors[primitive.attributes.POSITION];
      if (accessor.min && accessor.max) box.union(new Box3(new Vector3().fromArray(accessor.min), new Vector3().fromArray(accessor.max)).applyMatrix4(matrix));
    }
    for (const child of node.children || []) visit(child, matrix);
  }
  for (const node of sceneNodes) visit(node, new Matrix4());
  const clips = (doc.animations || []).map(clip => ({
    name: clip.name,
    durationSeconds: round(Math.max(0, ...clip.samplers.map(sampler => doc.accessors[sampler.input]?.max?.[0] || 0))),
    channels: clip.channels.length,
    targets: [...new Set(clip.channels.map(channel => doc.nodes[channel.target.node]?.name))]
  }));
  const images = (doc.images || []).map(image => {
    const view = doc.bufferViews?.[image.bufferView];
    const imageBytes = view && bin ? bin.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength) : image.uri && !image.uri.startsWith('data:') ? fs.readFileSync(path.resolve(path.dirname(file), image.uri)) : null;
    const png = imageBytes?.length >= 24 && imageBytes.subarray(1, 4).toString() === 'PNG';
    return { name: image.name || null, uri: image.uri || null, embedded: image.bufferView != null || image.uri?.startsWith('data:') || false, mimeType: image.mimeType || (png ? 'image/png' : null), width: png ? imageBytes.readUInt32BE(16) : null, height: png ? imageBytes.readUInt32BE(20) : null, sha256: imageBytes ? hash(imageBytes) : null };
  });
  const name = path.basename(file, path.extname(file));
  return {
    id: `${packId}:${name}`, name, category, packId, url: url(file), format: path.extname(file).slice(1).toUpperCase(), bytes: bytes.length, sha256: hash(bytes),
    dependencies, images,
    materials: (doc.materials || []).map(material => ({ name: material.name || null, alphaMode: material.alphaMode || 'OPAQUE', doubleSided: Boolean(material.doubleSided), baseColorFactor: material.pbrMetallicRoughness?.baseColorFactor || [1, 1, 1, 1], metallicFactor: material.pbrMetallicRoughness?.metallicFactor ?? 1, roughnessFactor: material.pbrMetallicRoughness?.roughnessFactor ?? 1, baseColorTexture: material.pbrMetallicRoughness?.baseColorTexture?.index ?? null, emissiveFactor: material.emissiveFactor || [0, 0, 0] })),
    bounds: box.isEmpty() ? null : { min: vector(box.min), max: vector(box.max), size: vector(box.getSize(new Vector3())), method: 'scene-transformed accessor bounds; bind/rest pose, not animated envelope' },
    roots: sceneNodes.map(index => ({ name: doc.nodes[index].name, translation: doc.nodes[index].translation || [0, 0, 0], rotation: doc.nodes[index].rotation || [0, 0, 0, 1], scale: doc.nodes[index].scale || [1, 1, 1] })),
    meshNames: (doc.nodes || []).filter(node => node.mesh != null).map(node => node.name),
    rigs: (doc.skins || []).map(skin => ({ name: skin.name || null, jointCount: skin.joints.length, joints: skin.joints.map(index => doc.nodes[index].name) })),
    animationKind: doc.skins?.length ? 'SKINNED' : clips.length ? 'NODE_TRANSFORMS' : 'STATIC', animations: clips,
    nodeNames: (doc.nodes || []).map(node => node.name),
    license: { type: 'CC0', file: `/${packId === 'kenney-cube-pets' ? petRoot : creatureRoot}/License.txt` },
    placement: null, enabledInWorld: false
  };
}
function pack(id, directory) {
  const files = walk(path.join(publicRoot, directory));
  const formats = {};
  for (const file of files) { const extension = path.extname(file).toLowerCase(); formats[extension] = (formats[extension] || 0) + 1; }
  return { id, root: `/${directory}`, files: files.map(url), formats, licenseText: fs.readFileSync(path.join(publicRoot, directory, 'License.txt'), 'utf8').trim() };
}
const pets = pack('kenney-cube-pets', petRoot), creatures = pack('kaykit-skeletons', creatureRoot);
const animations = walk(path.join(publicRoot, creatureRoot, 'Animations')).filter(file => file.endsWith('.glb')).map(file => auditModel(file, null, creatures.id));
const assets = [
  ...walk(path.join(publicRoot, petRoot, 'Models', 'GLB format')).filter(file => file.endsWith('.glb')).map(file => auditModel(file, 'PET', pets.id)),
  ...walk(path.join(publicRoot, creatureRoot, 'characters', 'gltf')).filter(file => file.endsWith('.glb')).map(file => auditModel(file, 'WORLD_CREATURE', creatures.id)),
  ...walk(path.join(publicRoot, creatureRoot, 'assets', 'gltf')).filter(file => file.endsWith('.gltf')).map(file => auditModel(file, 'PROP', creatures.id))
];
for (const asset of assets) {
  if (asset.category === 'PET') {
    asset.previewUrl = `/${petRoot}/Previews/${asset.name}.png`;
    asset.futurePet = { rewardAssetId: asset.id, collectionKey: asset.id, companion: { implemented: false, idleClip: asset.animations.find(clip => clip.name === 'idle')?.name || null, walkClip: asset.animations.find(clip => clip.name === 'walk')?.name || null, runClip: asset.animations.find(clip => clip.name === 'run')?.name || null }, suggestedScaleToHeight05: asset.bounds ? round(.5 / asset.bounds.size[1]) : null };
  }
  if (asset.category === 'WORLD_CREATURE') {
    asset.animationSources = animations.map(source => ({ url: source.url, clips: source.animations.map(clip => clip.name), missingTargetNodes: [...new Set(source.animations.flatMap(clip => clip.targets))].filter(name => !asset.nodeNames.includes(name)) }));
    asset.futureWorldAction = { implemented: false, behavior: null, hitsRequired: null, permittedHitRange: [1, 3], hitReactionCandidates: ['Hit_A', 'Hit_B'], defeatClipCandidates: ['Death_A', 'Death_B'], defeatEffect: null, optionalReward: null, friendlyNpc: false, attackable: null };
  }
}
const legacy = auditModel(path.join(publicRoot, 'models/characters/Skeleton_Warrior.glb'), 'WORLD_CREATURE', creatures.id);
const original = assets.find(asset => asset.name === 'Skeleton_Warrior');
const all = [...assets, ...animations, legacy];
const missing = all.flatMap(asset => asset.dependencies.filter(dependency => !dependency.exists));
if (missing.length) throw new Error(`Missing dependencies: ${JSON.stringify(missing)}`);
const duplicateGroups = Object.values(Object.groupBy([...pets.files, ...creatures.files].map(file => ({ url: file, hash: hash(fs.readFileSync(path.join(publicRoot, file))) })), item => item.hash)).filter(group => group.length > 1).map(group => group.map(item => item.url));
const result = { schemaVersion: 1, packs: [pets, creatures], assets, animationLibraries: animations,
  legacyWarrior: { ...legacy, id: 'legacy:skeleton-warrior', relation: { packAssetId: original.id, byteIdentical: legacy.sha256 === original.sha256, sameEmbeddedTexture: legacy.images[0].sha256 === original.images[0].sha256, commonMeshNames: original.meshNames.filter(name => legacy.meshNames.includes(name)), explanation: 'Distinct rigged export with embedded clips; retain existing runtime path, do not automatically substitute or duplicate placements.' } },
  exactDuplicateFiles: duplicateGroups };
if (process.argv.includes('--write')) {
  fs.writeFileSync(path.join(root, 'src/game/assets/localAssetPacks.json'), JSON.stringify(result, null, 2) + '\n');
  process.stdout.write(JSON.stringify({ packs: result.packs.map(item => ({ id: item.id, formats: item.formats })), assets: assets.map(item => ({ name: item.name, category: item.category, size: item.bounds?.size, animationKind: item.animationKind, clips: item.animations.map(clip => clip.name), rigs: item.rigs.map(rig => ({ name: rig.name, jointCount: rig.jointCount })), sources: item.animationSources })), libraries: animations.map(item => ({ name: item.name, clips: item.animations.map(clip => clip.name) })), legacyRelation: result.legacyWarrior.relation, duplicates: duplicateGroups }, null, 2));
} else process.stdout.write(JSON.stringify(result, null, 2) + '\n');
