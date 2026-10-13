import {CONTENT_COMPOSITIONS} from '../game/content/contentDefaults.js';
export function spatialWarnings(content) {
  const warnings=[];
  for(const region of content.world) {
    const source=CONTENT_COMPOSITIONS.find(c=>c.groupName===region.id),spawn=source?.spawn?.position;
    const solids=region.instances.filter(i=>i.collision?.type==='solid');
    if(spawn)for(const item of solids)if(Math.hypot(item.position[0]-spawn[0],item.position[2]-spawn[2])<1)warnings.push(`${item.id}: objeto solido junto al spawn; revisar en prueba.`);
    for(const activity of content.activities.filter(a=>a.compositionId===region.id||(!a.compositionId&&a.regionId===region.regionId))) {
      const binding=[...(source?.stations||[]),...(source?.adventureObjects||[])].find(a=>a.id===activity.id);
      const chest=region.instances.find(i=>i.id===(activity.instanceId||binding?.instanceId));if(!chest)continue;
      for(const item of solids)if(item.id!==chest.id&&Math.hypot(item.position[0]-chest.position[0],item.position[2]-chest.position[2])<1)warnings.push(`${activity.label||activity.id}: ${item.id} puede tapar el acceso.`);
    }
  }
  return warnings.slice(0,100);
}
