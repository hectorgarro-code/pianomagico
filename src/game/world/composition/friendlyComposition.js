const resident=(id,regionId,characterId,position,extra={})=>({id,regionId,characterId,position,rotation:0,scale:.95,radius:.3,...extra});
export const FRIENDLY_NOTE={id:'note-plaza-garden',position:[13,0,8],pitch:'E5'};
export const WORLD_RESIDENTS=[
  resident('plaza-gardener','PLAZA_DE_LAS_NOTAS',2,[10,0,7],{goal:{noteId:FRIENDLY_NOTE.id,position:FRIENDLY_NOTE.position}}),
  resident('plaza-stroller','PLAZA_DE_LAS_NOTAS',4,[-10,0,2],{walk:[[-10,2],[-11,5]],watch:['plaza-first-lesson']}),
  resident('forest-listener','BOSQUE_DE_LAS_NOTAS',2,[23,0,-25],{watch:['forest-chest-01']}),
  resident('river-keeper','RIO_DEL_RITMO',3,[-20,0,-70],{watch:['river-chest-02']}),
  resident('mountain-traveler','MONTANA_DE_LAS_MELODIAS',1,[37,0,-72],{watch:['mountain-chest-02']}),
  resident('ruins-reader','RUINAS_DEL_GRAN_PENTAGRAMA',2,[-11,0,-99],{watch:['ruins-first-voice']}),
  resident('observatory-listener','OBSERVATORIO_MUSICAL',4,[6,0,-128],{watch:['observatory-final-challenge']}),
];
