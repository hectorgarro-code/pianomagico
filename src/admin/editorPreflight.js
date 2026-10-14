import {CONTENT_COMPOSITIONS} from '../game/content/contentDefaults.js';
export function spatialWarnings(content) {
  const warnings=[];
  for(const region of content.world) {
    const source=CONTENT_COMPOSITIONS.find(c=>c.groupName===region.id),spawn=content.worldDesign?.regions?.find(r=>r.compositionId===region.id)?.spawn?.position||source?.spawn?.position;
    const solids=region.instances.filter(i=>i.collision?.type==='solid');
    if(spawn)for(const item of solids)if(Math.hypot(item.position[0]-spawn[0],item.position[2]-spawn[2])<1)warnings.push(`${item.id}: objeto solido junto al spawn; revisar en prueba.`);
    for(const activity of content.activities.filter(a=>a.compositionId===region.id||(!a.compositionId&&a.regionId===region.regionId))) {
      const binding=[...(source?.stations||[]),...(source?.adventureObjects||[])].find(a=>a.id===activity.id);
      const chest=region.instances.find(i=>i.id===(activity.instanceId||binding?.instanceId));if(!chest)continue;
      for(const item of solids)if(item.id!==chest.id&&Math.hypot(item.position[0]-chest.position[0],item.position[2]-chest.position[2])<1)warnings.push(`${activity.label||activity.id}: ${item.id} puede tapar el acceso.`);
    }
  }
  for(const limit of content.worldDesign?.limits||[])warnings.push(`${limit.id}: limite de circulacion; verificar spawn, cofres y pasos en el juego.`);
  for(const patch of content.worldDesign?.terrainPatches||[])warnings.push(`${patch.id}: relieve modificado; verificar pendientes, arquitectura y accesibilidad.`);
  if(content.worldDesign?.paths?.length||content.worldDesign?.connections?.length)warnings.push('Trazados modificados: comprobar continuidad y pasos con el personaje; una linea dibujada no garantiza accesibilidad.');
  if(content.worldDesign?.areas?.length)warnings.push('Areas de descubrimiento modificadas: recorrer entradas y salidas de cada region.');
  return warnings.slice(0,100);
}
