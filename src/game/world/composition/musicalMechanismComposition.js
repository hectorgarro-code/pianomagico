export const WORLD_MUSIC_TYPES=['SEQUENCE_MEMORY','NOTE_RECOGNITION','HIGH_LOW','RHYTHM','MELODY_ORDER'];
export const FOREST_MUSIC={
  id:'forest-three-runes',type:'SEQUENCE_MEMORY',position:[-6,0,-29],rotation:[0,0,0],
  gateAsset:'/models/props/gate.glb',stoneAsset:'/models/props/pillar.glb',
  radius:6,sequence:['C4','E4','G4'],symbols:[
    {pitch:'C4',label:'DO',offset:[-1.4,0,2],color:0xffcc61},
    {pitch:'E4',label:'MI',offset:[0,0,2],color:0x70e3ae},
    {pitch:'G4',label:'SOL',offset:[1.4,0,2],color:0x78d9ff},
  ],rewards:[
    {id:'note-runes-do',position:[-6.8,0,-31],pitch:'C5',mechanismId:'forest-three-runes'},
    {id:'note-runes-mi',position:[-6,0,-32],pitch:'E5',mechanismId:'forest-three-runes'},
    {id:'note-runes-sol',position:[-5.2,0,-31],pitch:'G5',mechanismId:'forest-three-runes'},
  ],
};
