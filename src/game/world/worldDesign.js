const defaults=new WeakMap();
const empty=()=>({lights:[],sounds:[],reveals:[],terrainPatches:[],limits:[],paths:[],regions:[],connections:[],areas:[]});
let design=empty();
export const getWorldDesign=()=>design;
export function applyWorldDesign(content,compositions){
  design={...empty(),...structuredClone(content.worldDesign||{})};
  for(const c of compositions){
    if(!defaults.has(c))defaults.set(c,structuredClone({paths:c.paths,spawn:c.spawn,entries:c.entries,exits:c.exits}));
    const base=defaults.get(c);
    for(const key of ['paths','spawn','entries','exits']){if(base[key]===undefined)delete c[key];else c[key]=structuredClone(base[key]);}
    for(const p of design.paths.filter(p=>p.compositionId===c.groupName)){
      const original=c.paths.find(x=>x.id===p.id);if(original)Object.assign(original,{points:p.points,width:p.width});
    }
    const region=design.regions.find(r=>r.compositionId===c.groupName);
    if(region){if(region.spawn)c.spawn=region.spawn;if(region.entryPoints)c.entries=region.entryPoints;if(region.exitPoints)c.exits=region.exitPoints;}
    for(const link of design.connections.filter(l=>l.compositionId===c.groupName))c.paths.push({id:link.id,points:link.points,width:link.width,color:0xaa956a,freeMarginEachSide:2,edgeBlend:.8,visualImplementation:'terrain-blend'});
  }
}
export function authoredHeightOffset(x,z){
  return design.terrainPatches.reduce((height,p)=>{const d=Math.hypot((x-p.position[0])/p.radius,(z-p.position[2])/p.radius);return height+p.height*Math.max(0,1-d*d)**2;},0);
}
export function authoredLimitColliders(){return design.limits.map(l=>({id:l.id,type:'solid',shape:'box',x:l.position[0],z:l.position[2],yaw:0,halfWidth:l.size[0]/2,halfDepth:l.size[1]/2,regionId:l.regionId}));}
export function authoredRegionAt(p){return design.areas.find(a=>p.x>=a.min[0]&&p.x<=a.max[0]&&p.z>=a.min[1]&&p.z<=a.max[1])?.regionId;}
export function createRevealController(){
  const seen=new Set();let current=null;
  return {step(player,delta,blocked=false){
    if(blocked){current=null;return null;}
    if(current){current.elapsed+=delta;if(current.elapsed>=current.definition.duration)current=null;}
    if(!current){const next=design.reveals.find(r=>!seen.has(r.id)&&Math.hypot(player.x-r.position[0],player.z-r.position[2])<r.radius);if(next){seen.add(next.id);current={definition:next,elapsed:0};}}
    return current?.definition||null;
  }};
}
