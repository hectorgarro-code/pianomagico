import {getValleyProgress} from '../adventure/valleyProgression.js';
import {WORLD_RESTORATION,RESTORATION_DURATION} from '../world/composition/worldRestoration.js';

// Transient animation state. Adventure remains the only completion authority.
export function createRestorationPresentation(adventure){
  let previous=adventure,progress=adventure?getValleyProgress(adventure):{completedRegions:[],currentRegion:null};
  const states=WORLD_RESTORATION.map(definition=>({definition,
    target:progress.completedRegions.includes(definition.id),age:RESTORATION_DURATION,
    origin:{x:definition.center[0],z:definition.center[1]},notes:4,settled:true}));
  return {
    states,
    get currentRegion(){return progress.currentRegion;},
    update(next,delta,player){
      const started=[];
      if(next&&next!==previous){
        previous=next;progress=getValleyProgress(next);
        for(const state of states){
          const complete=progress.completedRegions.includes(state.definition.id);
          if(complete&&!state.target){state.age=0;state.notes=0;state.settled=false;
            state.origin=progress.currentRegion===state.definition.id?{x:player.x,z:player.z}:{x:state.definition.center[0],z:state.definition.center[1]};
            started.push(state.definition.id);
          }
          state.target=complete;
        }
      }
      for(const state of states)if(state.target)state.age=Math.min(RESTORATION_DURATION,state.age+Math.max(0,delta));
      return started;
    },
  };
}
export function restorationLevel(state,index=0,count=1){
  if(!state.target)return 0;
  const t=Math.max(0,Math.min(1,(state.age-index/Math.max(1,count)*1.3)/2.2));
  return t*t*(3-2*t);
}
