import { getCharacterModel } from '../../modules/core/utils/characterModels.js';
import { PropertyBinding } from 'three';

export const EQUIPMENT = {
  1: [
    { id: 'sword-shield', label: 'Espada y escudo', nodes: ['1H_Sword', 'Badge_Shield'], Q: '1H_Melee_Attack_Slice_Horizontal', E: 'Block' },
    { id: 'greatsword', label: 'Espada larga', nodes: ['2H_Sword'], Q: '2H_Melee_Attack_Chop', E: '2H_Melee_Attack_Spin' },
    { id: 'dual-swords', label: 'Dos espadas', nodes: ['1H_Sword', '1H_Sword_Offhand'], Q: 'Dualwield_Melee_Attack_Chop', E: 'Dualwield_Melee_Attack_Slice' }
  ],
  2: [
    { id: 'staff-book', label: 'Baston y libro', nodes: ['2H_Staff', 'Spellbook'], Q: 'Spellcast_Raise', E: 'Spellcast_Shoot' },
    { id: 'wand-book', label: 'Varita y libro', nodes: ['1H_Wand', 'Spellbook_open'], Q: 'Spellcast_Raise', E: 'Spellcast_Long' }
  ],
  3: [
    { id: 'dual-axes', label: 'Dos hachas', nodes: ['1H_Axe', '1H_Axe_Offhand'], Q: 'Dualwield_Melee_Attack_Chop', E: 'Dualwield_Melee_Attack_Slice' },
    { id: 'great-axe', label: 'Hacha grande', nodes: ['2H_Axe'], Q: '2H_Melee_Attack_Chop', E: '2H_Melee_Attack_Spin' },
    { id: 'axe-shield', label: 'Hacha y escudo', nodes: ['1H_Axe', 'Barbarian_Round_Shield'], Q: '1H_Melee_Attack_Chop', E: 'Block' }
  ],
  4: [
    { id: 'crossbow', label: 'Ballesta', nodes: ['1H_Crossbow'], Q: '1H_Ranged_Shoot', E: '1H_Ranged_Reload' },
    { id: 'heavy-crossbow', label: 'Ballesta grande', nodes: ['2H_Crossbow'], Q: '2H_Ranged_Shoot', E: '2H_Ranged_Reload' },
    { id: 'daggers', label: 'Dos dagas', nodes: ['Knife', 'Knife_Offhand'], Q: 'Dualwield_Melee_Attack_Stab', E: 'Dodge_Backward' }
  ],
  5: [
    { id: 'bow', label: 'Arco', nodes: [], accessory: 'bow_withString', hand: 'handslot.l', Q: 'Throw', E: 'Jump_Full_Short' },
    { id: 'ranger-crossbow', label: 'Ballesta', nodes: [], accessory: 'crossbow_1handed', hand: 'handslot.r', Q: 'Throw', E: 'Jump_Full_Short' }
  ]
};
const equipmentNodes = new Set(['1H_Sword_Offhand', 'Badge_Shield', 'Rectangle_Shield', 'Round_Shield', 'Spike_Shield', '1H_Sword', '2H_Sword', 'Spellbook', 'Spellbook_open', '1H_Wand', '2H_Staff', '1H_Axe_Offhand', 'Barbarian_Round_Shield', '1H_Axe', '2H_Axe', 'Mug', 'Knife_Offhand', '1H_Crossbow', '2H_Crossbow', 'Knife', 'Throwable']);
export const getEquipment = (id, choice) => (EQUIPMENT[id] || EQUIPMENT[1]).find(item => item.id === choice) || (EQUIPMENT[id] || EQUIPMENT[1])[0];
export function readEquipment(userId, id, storage = globalThis.localStorage) {
  try { return getEquipment(id, storage?.getItem(`valley_equipment_${userId}_${id}`)).id; } catch { return getEquipment(id).id; }
}
export function saveEquipment(userId, id, choice, storage = globalThis.localStorage) {
  try { storage?.setItem(`valley_equipment_${userId}_${id}`, getEquipment(id, choice).id); } catch { /* Cosmetic selection remains usable for this session. */ }
}
export async function loadCharacterPresentation(id) {
  const { loadCachedModel, KAYKIT_ASSETS } = await import('../assets/assetManifest.js');
  const data = await loadCachedModel(getCharacterModel(id).file);
  if (getCharacterModel(id).id !== 5) return data;
  const [general, movement] = await Promise.all([loadCachedModel(KAYKIT_ASSETS.animations.general), loadCachedModel(KAYKIT_ASSETS.animations.movement)]);
  const clips = [...general.animations.filter(clip => clip.name !== 'T-Pose'), ...movement.animations];
  const idle = clips.find(clip => clip.name === 'Idle_A').clone(); idle.name = 'Idle';
  return { ...data, animations: [...clips, idle] };
}
export async function applyEquipment(model, id, choice) {
  const token = (model.userData.equipmentToken || 0) + 1; model.userData.equipmentToken = token;
  const selected = getEquipment(id, choice);
  model.traverse(node => { if (equipmentNodes.has(node.name)) node.visible = selected.nodes.includes(node.name); });
  const previous = model.getObjectByName('valley-equipped-accessory');
  previous?.removeFromParent();
  if (selected.accessory) {
    const { loadCachedModel } = await import('../assets/assetManifest.js');
    const data = await loadCachedModel(`/models/characters/Assets/gltf/${selected.accessory}.gltf`);
    if (model.userData.equipmentToken !== token) return selected;
    const accessory = data.scene.clone(true); accessory.name = 'valley-equipped-accessory';
    // KayKit accessories use the same native unit scale as the hand sockets.
    accessory.rotation.set(-Math.PI / 2, 0, Math.PI);
    const socket = model.getObjectByName(PropertyBinding.sanitizeNodeName(selected.hand));
    if (!socket) throw new Error(`Missing equipment socket: ${selected.hand}`);
    socket.add(accessory);
  }
  return selected;
}
