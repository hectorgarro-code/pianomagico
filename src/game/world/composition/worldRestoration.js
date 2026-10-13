// Authored accents only: no routes, landmarks, terrain or colliders are changed.
export const WORLD_RESTORATION=[
  {id:'BOSQUE_DE_LAS_NOTAS',color:0x86f4be,center:[3,-40],motif:['C4','E4','G4','C5'],
    anchors:[[8,-41],[7,-35],[-5,-36],[-6,-43],[13,-30],[10,-25]],flowers:true},
  {id:'RIO_DEL_RITMO',color:0x79e9ff,center:[-34,-77],motif:['C4','C4','G4','C5'],
    anchors:[[-28,-59],[-28,-66],[-28,-71],[-25,-77]],water:true},
  {id:'MONTANA_DE_LAS_MELODIAS',color:0xffd97b,center:[25,-77],motif:['C4','D4','E4','G4'],
    anchors:[[26.5,-66],[18.5,-75],[41.5,-73.5]],torches:true},
  {id:'RUINAS_DEL_GRAN_PENTAGRAMA',color:0xcba1ff,center:[0,-104],motif:['E4','C4','E4','G4'],
    anchors:[[-10,-95],[10,-95],[-10,-103],[10,-103]],
    existingTorches:['ruins-torch-west','ruins-torch-east'],
    bindings:['ruins-staff-floor-0','ruins-staff-floor-1','ruins-staff-floor-2','ruins-staff-floor-3','ruins-staff-floor-4']},
  {id:'OBSERVATORIO_MUSICAL',color:0xffe99c,center:[0,-131],motif:['C4','E4','G4','C5'],
    anchors:[[-7,-123],[-8,-129],[-5,-134],[5,-134],[8,-129],[7,-123]],final:true,
    existingTorches:['observatory-torch-west','observatory-torch-east'],
    bindings:Array.from({length:6},(_,i)=>'observatory-column-'+i)},
];
export const RESTORATION_DURATION=3.6;
