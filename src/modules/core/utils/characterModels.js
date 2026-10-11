export const CHARACTER_MODELS = {
  1: {
    id: 1,
    name: 'Caballero',
    file: '/models/characters/Knight.glb',
    scale: 1.1,
    yOffset: -0.9,
    defaultAnim: 'Idle',
    celebrateAnim: 'Cheer',
    color: '#1CB0F6',
    role: 'Defensor Musical'
  },
  2: {
    id: 2,
    name: 'Maga',
    file: '/models/characters/Mage.glb',
    scale: 1.1,
    yOffset: -0.9,
    defaultAnim: 'Idle',
    celebrateAnim: 'Spellcasting',
    color: '#CE82FF',
    role: 'Mística del Sonido'
  },
  3: {
    id: 3,
    name: 'Bárbaro',
    file: '/models/characters/Barbarian.glb',
    scale: 1.1,
    yOffset: -0.9,
    defaultAnim: 'Idle',
    celebrateAnim: 'Cheer',
    color: '#58CC02',
    role: 'Guardián del Ritmo'
  },
  4: {
    id: 4,
    name: 'Pícaro',
    file: '/models/characters/Rogue.glb',
    scale: 1.1,
    yOffset: -0.9,
    defaultAnim: 'Idle',
    celebrateAnim: 'Cheer',
    color: '#FF9600',
    role: 'Ágil Melodista'
  },
  5: {
    id: 5,
    name: 'Explorador',
    file: '/models/characters/Characters/gltf/Ranger.glb',
    scale: 1.1,
    yOffset: -0.9,
    defaultAnim: 'Idle',
    celebrateAnim: 'Jump_Full_Short',
    color: '#4DAF8C',
    role: 'Explorador Musical'
  },
  // Default fallback for other avatar IDs
  default: {
    id: 1,
    name: 'Aventurero',
    file: '/models/characters/Knight.glb',
    scale: 1.1,
    yOffset: -0.9,
    defaultAnim: 'Idle',
    celebrateAnim: 'Cheer',
    color: '#1CB0F6',
    role: 'Músico Galáctico'
  },
  boss: {
    id: 99,
    name: 'Jefe Guerrero Esqueleto',
    file: '/models/characters/Skeleton_Warrior.glb',
    scale: 1.05,
    yOffset: -0.85,
    defaultAnim: 'Idle',
    celebrateAnim: '1H_Melee_Attack_Chop',
    color: '#FF4B4B',
    role: 'Jefe Musical'
  },
  chest: {
    id: 100,
    name: 'Cofre Dorado',
    file: '/models/props/chest_gold.glb',
    scale: 1.6,
    yOffset: -0.4,
    defaultAnim: null,
    celebrateAnim: null,
    color: '#FFC800',
    role: 'Recompensa'
  }
};

export const getCharacterModel = (avatarId) => {
  if (Number(avatarId) === 5) return CHARACTER_MODELS[5];
  const normalizedId = ((Number(avatarId) - 1) % 4) + 1;
  return CHARACTER_MODELS[normalizedId] || CHARACTER_MODELS.default;
};
