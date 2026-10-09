import { composition, instance, path } from './prototypeAuthoring.js';
export const GROTTO_DISCOVERY = {id:'echo-grotto-found',x:-19,z:-54,radius:2};
export const GROTTO_ENTRANCE_COMPOSITION=composition('GRUTA_DEL_ECO','Grotto_Entrance',[
  path('grotto-hidden-detour',[[-10,-55],[-16,-54],[-19,-54]],1.6)
],[
  instance('grotto-left-wall','Rock_3_A_Color1',-22,-54,1.5),
  instance('grotto-right-wall','Rock_3_A_Color1',-19,-51,1.4),
  instance('grotto-back-wall','Rock_3_A_Color1',-23,-51,1.6),
  instance('grotto-low-clue','Bush_2_A_Color1',-17,-51,.8,'bushes'),
  instance('grotto-candle','candle_lit',-21,-53,.8,'props')
]);
GROTTO_ENTRANCE_COMPOSITION.instances[0].scale=[3,6,3];
GROTTO_ENTRANCE_COMPOSITION.instances[1].scale=[3,5.5,3];
GROTTO_ENTRANCE_COMPOSITION.instances[2].scale=[3.2,6.5,3.2];
